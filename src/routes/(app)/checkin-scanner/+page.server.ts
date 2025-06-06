import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { qrCodes, tours } from '$lib/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

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

export const load: PageServerLoad = async ({ locals, fetch }) => {
	// Authentication is handled by the parent layout, but double-check
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		// Load recent QR codes for this user (most active ones)
		const recentQRCodes: RecentQRCode[] = [];
		try {
			const qrCodesData = await db
				.select({
					id: qrCodes.id,
					code: qrCodes.code,
					scans: qrCodes.scans,
					createdAt: qrCodes.createdAt,
					category: qrCodes.category,
					tourId: qrCodes.tourId,
					tourName: tours.name
				})
				.from(qrCodes)
				.leftJoin(tours, eq(qrCodes.tourId, tours.id))
				.where(and(
					eq(qrCodes.userId, locals.user.id),
					eq(qrCodes.isActive, true)
				))
				.orderBy(desc(qrCodes.scans), desc(qrCodes.createdAt))
				.limit(10);
			
			recentQRCodes.push(...qrCodesData.map((qr) => ({
				id: qr.id,
				code: qr.code,
				scans: qr.scans || 0,
				created: qr.createdAt.toISOString(),
				tourName: qr.tourName || 'No Tour Linked',
				category: qr.category || undefined
			})));
		} catch (err) {
			console.warn('Could not load recent QR codes:', err);
			// Continue without recent QR codes - not critical
		}

		// Load user's active tours for quick access
		const activeTours: ActiveTour[] = [];
		try {
			const toursData = await db
				.select({
					id: tours.id,
					name: tours.name,
					location: tours.location
				})
				.from(tours)
				.where(and(
					eq(tours.userId, locals.user.id),
					eq(tours.status, 'active')
				))
				.orderBy(tours.name)
				.limit(20);
			
			activeTours.push(...toursData.map((tour) => ({
				id: tour.id,
				name: tour.name,
				location: tour.location || ''
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