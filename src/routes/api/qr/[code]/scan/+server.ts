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
			console.log(`QR scan tracking skipped: QR code '${qrCode}' not found or inactive`);
			return json({ 
				success: true, 
				scans: 0,
				note: 'QR code not found - tracking skipped'
			});
		}

		const qrRecord = qrRecords[0];
		
		// Increment scan count
		const updatedQR = await db.update(qrCodes)
			.set({
				scans: (qrRecord.scans || 0) + 1,
				updatedAt: new Date()
			})
			.where(eq(qrCodes.id, qrRecord.id))
			.returning();
		
		console.log(`QR scan tracked: ${qrCode} - Total scans: ${updatedQR[0].scans}`);
		
		return json({ 
			success: true, 
			scans: updatedQR[0].scans 
		});
	} catch (err) {
		console.error('Error tracking QR scan:', err);
		return json({ error: 'Failed to track scan' }, { status: 500 });
	}
}; 