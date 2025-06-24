import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings } from '$lib/db/schema/index.js';
import { like, and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication
	if (!locals?.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const { code } = await request.json();
		
		if (!code || typeof code !== 'string') {
			return json({ error: 'Invalid code provided' }, { status: 400 });
		}

		const upperCode = code.toUpperCase().trim();
		
		// Check if it's already a full ticket code
		if (upperCode.startsWith('TKT-')) {
			return json({ ticketCode: upperCode });
		}
		
		// If it's a short code (6 characters), find matching booking
		if (/^[A-Z0-9]{6}$/i.test(upperCode)) {
			// Look for bookings where ticketQRCode ends with this short code
			const pattern = `%-${upperCode}`;
			const matchingBookings = await db
				.select({
					ticketQRCode: bookings.ticketQRCode
				})
				.from(bookings)
				.where(
					and(
						like(bookings.ticketQRCode, pattern),
						eq(bookings.status, 'confirmed'),
						eq(bookings.paymentStatus, 'paid')
					)
				)
				.limit(1);
			
			if (matchingBookings.length > 0 && matchingBookings[0].ticketQRCode) {
				return json({ ticketCode: matchingBookings[0].ticketQRCode });
			}
			
			return json({ 
				error: 'No valid ticket found with this code',
				suggestion: 'Try entering the full ticket code from the booking email'
			}, { status: 404 });
		}
		
		return json({ 
			error: 'Invalid code format. Enter either a 6-character short code or full ticket code.' 
		}, { status: 400 });
		
	} catch (error) {
		console.error('Error resolving ticket code:', error);
		return json({ error: 'Failed to resolve ticket code' }, { status: 500 });
	}
}; 