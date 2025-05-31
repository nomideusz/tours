import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import type { Tour, QRCode } from '$lib/types.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || !locals.pb) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Load tour data
		const tour = await locals.pb.collection('tours').getOne<Tour>(params.id, {
			expand: 'user'
		});
		
		if (!tour) {
			throw error(404, 'Tour not found');
		}
		
		// Check if user owns this tour
		if (tour.user !== locals.user.id) {
			throw error(403, 'You do not have permission to view this QR code');
		}
		
		// Load QR code data
		const qrCode = await locals.pb.collection('qr_codes').getOne<QRCode>(params.qrId, {
			expand: 'tour,user'
		});
		
		if (!qrCode) {
			throw error(404, 'QR code not found');
		}
		
		// Verify QR code belongs to this tour
		if (qrCode.tour !== tour.id) {
			throw error(404, 'QR code not found for this tour');
		}
		
		return {
			tour,
			qrCode
		};
	} catch (err) {
		console.error('Error loading QR code details:', err);
		if ((err as any).status === 404) {
			throw error(404, 'Not found');
		}
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load QR code details');
	}
}; 