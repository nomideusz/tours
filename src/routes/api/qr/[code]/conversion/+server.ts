import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { tryCreateAuthenticatedPB } from '$lib/admin-auth.server.js';

export const POST: RequestHandler = async ({ params }) => {
	const qrCode = params.code;
	
	// Get authenticated PocketBase instance (use try version for graceful handling)
	const pb = await tryCreateAuthenticatedPB();
	if (!pb) {
		console.error('Failed to authenticate with PocketBase for QR tracking');
		// Return success but don't track if auth fails
		return json({ 
			success: true, 
			conversions: 0,
			note: 'Authentication failed - tracking skipped'
		});
	}
	
	if (!qrCode) {
		return json({ error: 'QR code is required' }, { status: 400 });
	}
	
	try {
		// Find the QR code by code
		const qrRecord = await pb.collection('qr_codes').getFirstListItem(
			`code = "${qrCode}" && isActive = true`
		);
		
		// Increment conversion count
		const updatedQR = await pb.collection('qr_codes').update(qrRecord.id, {
			conversions: (qrRecord.conversions || 0) + 1
		});
		
		console.log(`QR conversion tracked: ${qrCode} - Total conversions: ${updatedQR.conversions}`);
		
		return json({ 
			success: true, 
			conversions: updatedQR.conversions 
		});
	} catch (err) {
		// If QR code not found, return success but don't log as error
		if ((err as any)?.status === 404 || (err as any)?.message?.includes('no rows')) {
			console.log(`QR conversion tracking skipped: QR code '${qrCode}' not found or inactive`);
			return json({ 
				success: true, 
				conversions: 0,
				note: 'QR code not found - tracking skipped'
			});
		}
		
		console.error('Error tracking QR conversion:', err);
		return json({ error: 'Failed to track conversion' }, { status: 500 });
	}
}; 