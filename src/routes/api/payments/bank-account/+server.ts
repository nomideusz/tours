import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/drizzle.js';
import { eq } from 'drizzle-orm';

// Save bank account details for cross-border payouts
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const user = locals.user;

		const data = await request.json();
		const {
			accountHolderName,
			accountNumber,
			bankName,
			swiftCode,
			iban,
			routingNumber,
			bankAddress,
			accountType,
			currency
		} = data;

		// Validate required fields
		if (!accountHolderName || !bankName || (!accountNumber && !iban)) {
			return json({ 
				error: 'Missing required bank account information' 
			}, { status: 400 });
		}

		// Encrypt sensitive data before storing (in production, use proper encryption)
		const bankAccountInfo = {
			accountHolderName,
			accountNumber: accountNumber ? `****${accountNumber.slice(-4)}` : null, // Store masked version
			accountNumberEncrypted: accountNumber, // In production: encrypt this
			bankName,
			swiftCode,
			iban: iban ? `****${iban.slice(-4)}` : null, // Store masked version
			ibanEncrypted: iban, // In production: encrypt this
			routingNumber,
			bankAddress,
			accountType: accountType || 'checking',
			currency,
			lastUpdated: new Date().toISOString()
		};

		// Update user with bank account info
		await db.update(users)
			.set({
				bankAccountInfo: JSON.stringify(bankAccountInfo),
				paymentSetup: true,
				updatedAt: new Date()
			})
			.where(eq(users.id, user.id));

		return json({
			success: true,
			message: 'Bank account information saved successfully',
			maskedAccount: bankAccountInfo.accountNumber || bankAccountInfo.iban
		});

	} catch (error) {
		console.error('Bank account setup error:', error);
		return json({ 
			error: 'Failed to save bank account information' 
		}, { status: 500 });
	}
};

// Get bank account details (masked)
export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const user = locals.user;

		const [userData] = await db.select({
			bankAccountInfo: users.bankAccountInfo,
			paymentSetup: users.paymentSetup
		})
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);

		if (!userData?.bankAccountInfo) {
			return json({ 
				hasBankAccount: false 
			});
		}

		const bankInfo = JSON.parse(userData.bankAccountInfo);
		
		// Return masked version only
		return json({
			hasBankAccount: true,
			bankAccount: {
				accountHolderName: bankInfo.accountHolderName,
				bankName: bankInfo.bankName,
				maskedAccount: bankInfo.accountNumber || bankInfo.iban,
				currency: bankInfo.currency,
				lastUpdated: bankInfo.lastUpdated
			}
		});

	} catch (error) {
		console.error('Get bank account error:', error);
		return json({ 
			error: 'Failed to retrieve bank account information' 
		}, { status: 500 });
	}
};