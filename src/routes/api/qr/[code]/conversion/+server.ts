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
			console.log(`QR conversion tracking skipped: QR code '${qrCode}' not found`);
			return json({ 
				success: true, 
				conversions: 0,
				note: 'QR code not found - tracking skipped'
			});
		}

		const tour = tourRecords[0];
		
		// Increment conversion count
		const updatedTour = await db.update(tours)
			.set({
				qrConversions: (tour.qrConversions || 0) + 1,
				updatedAt: new Date()
			})
			.where(eq(tours.id, tour.id))
			.returning();
		
		console.log(`QR conversion tracked: ${qrCode} (${tour.name}) - Total conversions: ${updatedTour[0].qrConversions}`);
		
		return json({ 
			success: true, 
			conversions: updatedTour[0].qrConversions 
		});
	} catch (err) {
		console.error('Error tracking QR conversion:', err);
		return json({ error: 'Failed to track conversion' }, { status: 500 });
	}
}; 