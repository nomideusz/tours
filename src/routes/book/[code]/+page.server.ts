import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import PocketBase from 'pocketbase';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const load: PageServerLoad = async ({ params, getClientAddress }) => {
	const pb = new PocketBase(POCKETBASE_URL);
	
	try {
		// Get QR code by code
		const qrCodes = await pb.collection('qr_codes').getFullList({
			filter: `code = "${params.code}"`,
			expand: 'tour,tour.user'
		});
		
		if (qrCodes.length === 0) {
			throw error(404, 'QR code not found');
		}
		
		const qrCode = qrCodes[0];
		
		// Check if QR code is active
		if (!qrCode.isActive) {
			throw error(403, 'This QR code is no longer active');
		}
		
		// Increment scan count (only if we're not already counting this session)
		try {
			await pb.collection('qr_codes').update(qrCode.id, {
				scans: (qrCode.scans || 0) + 1
			});
		} catch (err) {
			console.error('Failed to increment scan count:', err);
			// Don't fail the page load if scan tracking fails
		}
		
		// TODO: Track additional analytics (device, location, etc.)
		const clientIP = getClientAddress();
		console.log('QR scan from IP:', clientIP);
		
		return {
			qrCode,
			pbUrl: POCKETBASE_URL
		};
	} catch (err) {
		console.error('Error loading QR code:', err);
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load booking page');
	}
}; 