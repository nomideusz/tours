import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params }) => {
	const qrCode = params.code;
	
	if (!qrCode) {
		return json({ error: 'QR code is required' }, { status: 400 });
	}

	try {
		// Find the tour by QR code
		const tourRecords = await db.select()
			.from(tours)
			.where(eq(tours.qrCode, qrCode))
			.limit(1);

		if (tourRecords.length === 0) {
			console.log(`QR scan tracking skipped: QR code '${qrCode}' not found`);
			return json({ 
				success: true, 
				scans: 0,
				note: 'QR code not found - tracking skipped'
			});
		}

		const tour = tourRecords[0];
		
		// Increment scan count
		const updatedTour = await db.update(tours)
			.set({
				qrScans: (tour.qrScans || 0) + 1,
				updatedAt: new Date()
			})
			.where(eq(tours.id, tour.id))
			.returning();
		
		console.log(`QR scan tracked: ${qrCode} (${tour.name}) - Total scans: ${updatedTour[0].qrScans}`);
		
		return json({ 
			success: true, 
			scans: updatedTour[0].qrScans 
		});
	} catch (err) {
		console.error('Error tracking QR scan:', err);
		return json({ error: 'Failed to track scan' }, { status: 500 });
	}
}; 