import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';

// Type definitions
interface RecentQRCode {
	id: string;
	code: string;
	scans: number;
	created: string;
	tourName: string;
	category?: string;
}

interface ActiveTour {
	id: string;
	name: string;
	location: string;
}

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	// Authentication is handled by the parent layout, but double-check
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	// Use PocketBase instance from locals (provided by hooks.server.ts)
	const pb = locals.pb;
	if (!pb) {
		throw error(500, 'Database connection not available');
	}

	try {
		// Get tour ID from URL params (optional - for tour-specific scanning)
		const tourId = url.searchParams.get('tour');
		let tour = null;
		
		// If scanning for a specific tour, load tour details
		if (tourId) {
			try {
				tour = await pb.collection('tours').getOne(tourId, {
					filter: `user = "${locals.user.id}"`,
					fields: 'id,name,status,location'
				});
			} catch (err) {
				console.warn('Tour not found or access denied:', tourId);
				// Don't throw error - just continue without tour context
			}
		}

		// Load recent QR codes for this user (most active ones)
		const recentQRCodes: RecentQRCode[] = [];
		try {
			const qrCodes = await pb.collection('qr_codes').getList(1, 10, {
				filter: `user = "${locals.user.id}" && isActive = true`,
				sort: '-scans,-created',
				expand: 'tour'
			});
			
			recentQRCodes.push(...qrCodes.items.map((qr: any) => ({
				id: qr.id,
				code: qr.code,
				scans: qr.scans || 0,
				created: qr.created,
				tourName: qr.expand?.tour?.name || 'No Tour Linked',
				category: qr.category
			})));
		} catch (err) {
			console.warn('Could not load recent QR codes:', err);
			// Continue without recent QR codes - not critical
		}

		// Load user's active tours for quick access
		const activeTours: ActiveTour[] = [];
		try {
			const tours = await pb.collection('tours').getList(1, 20, {
				filter: `user = "${locals.user.id}" && status = "active"`,
				fields: 'id,name,location',
				sort: 'name'
			});
			
			activeTours.push(...tours.items.map((tour: any) => ({
				id: tour.id,
				name: tour.name,
				location: tour.location
			})));
		} catch (err) {
			console.warn('Could not load active tours:', err);
			// Continue without tours list - not critical
		}

		return {
			user: {
				id: locals.user.id,
				name: locals.user.name || locals.user.username || 'Scanner User'
			},
			tour,
			recentQRCodes,
			activeTours,
			scannerConfig: {
				highlightScanRegion: true,
				highlightCodeOutline: true,
				maxHistoryItems: 10
			}
		};

	} catch (err) {
		console.error('Error loading checkin-scanner data:', err);
		
		// Return minimal data to allow scanner to function
		const emptyRecentQRCodes: RecentQRCode[] = [];
		const emptyActiveTours: ActiveTour[] = [];
		
		return {
			user: {
				id: locals.user.id,
				name: locals.user.name || locals.user.username || 'Scanner User'
			},
			tour: null,
			recentQRCodes: emptyRecentQRCodes,
			activeTours: emptyActiveTours,
			scannerConfig: {
				highlightScanRegion: true,
				highlightCodeOutline: true,
				maxHistoryItems: 10
			},
			loadError: 'Some data could not be loaded, but scanner is still functional.'
		};
	}
}; 