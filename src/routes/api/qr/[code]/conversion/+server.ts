import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { qrCodes } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params }) => {
	const qrCode = params.code;
	
	if (!qrCode) {
		return json({ error: 'QR code is required' }, { status: 400 });
	}

	try {
		// Find the QR code by code
		const qrRecords = await db.select()
			.from(qrCodes)
			.where(and(
				eq(qrCodes.code, qrCode),
				eq(qrCodes.isActive, true)
			))
			.limit(1);

		if (qrRecords.length === 0) {
			console.log(`QR conversion tracking skipped: QR code '${qrCode}' not found or inactive`);
			return json({ 
				success: true, 
				conversions: 0,
				note: 'QR code not found - tracking skipped'
			});
		}

		const qrRecord = qrRecords[0];
		
		// Increment conversion count
		const updatedQR = await db.update(qrCodes)
			.set({
				conversions: (qrRecord.conversions || 0) + 1,
				updatedAt: new Date()
			})
			.where(eq(qrCodes.id, qrRecord.id))
			.returning();
		
		console.log(`QR conversion tracked: ${qrCode} - Total conversions: ${updatedQR[0].conversions}`);
		
		return json({ 
			success: true, 
			conversions: updatedQR[0].conversions 
		});
	} catch (err) {
		console.error('Error tracking QR conversion:', err);
		return json({ error: 'Failed to track conversion' }, { status: 500 });
	}
}; 