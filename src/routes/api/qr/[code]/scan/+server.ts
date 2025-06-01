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
			scans: 0,
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
		
		// Increment scan count
		const updatedQR = await pb.collection('qr_codes').update(qrRecord.id, {
			scans: (qrRecord.scans || 0) + 1
		});
		
		console.log(`QR scan tracked: ${qrCode} - Total scans: ${updatedQR.scans}`);
		
		return json({ 
			success: true, 
			scans: updatedQR.scans 
		});
	} catch (err) {
		// If QR code not found, return success but don't log as error
		if ((err as any)?.status === 404 || (err as any)?.message?.includes('no rows')) {
			console.log(`QR scan tracking skipped: QR code '${qrCode}' not found or inactive`);
			return json({ 
				success: true, 
				scans: 0,
				note: 'QR code not found - tracking skipped'
			});
		}
		
		console.error('Error tracking QR scan:', err);
		return json({ error: 'Failed to track scan' }, { status: 500 });
	}
}; 