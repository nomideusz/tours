import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, qrCodes, bookings, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Load tour and QR code in one query with ownership check
		const qrCodeData = await db
			.select({
				// Tour fields
				tourId: tours.id,
				tourName: tours.name,
				tourDescription: tours.description,
				tourLocation: tours.location,
				tourPrice: tours.price,
				tourDuration: tours.duration,
				tourCapacity: tours.capacity,
				tourStatus: tours.status,
				tourUserId: tours.userId,
				tourCreatedAt: tours.createdAt,
				tourUpdatedAt: tours.updatedAt,
				
				// QR code fields
				qrId: qrCodes.id,
				qrCode: qrCodes.code,
				qrName: qrCodes.name,
				qrCategory: qrCodes.category,
				qrScans: qrCodes.scans,
				qrConversions: qrCodes.conversions,
				qrIsActive: qrCodes.isActive,
				qrCreatedAt: qrCodes.createdAt,
				qrUpdatedAt: qrCodes.updatedAt
			})
			.from(qrCodes)
			.leftJoin(tours, eq(qrCodes.tourId, tours.id))
			.where(and(
				eq(qrCodes.id, params.qrId),
				eq(tours.id, params.id),
				eq(tours.userId, locals.user.id)
			))
			.limit(1);
		
		if (qrCodeData.length === 0) {
			throw error(404, 'QR code not found or access denied');
		}
		
		const result = qrCodeData[0];
		
		// Format data to match expected structure
		const tour = {
			id: result.tourId!,
			name: result.tourName || 'Untitled Tour',
			description: result.tourDescription || '',
			location: result.tourLocation || '',
			price: result.tourPrice || '0',
			duration: result.tourDuration || 0,
			capacity: result.tourCapacity || 0,
			status: result.tourStatus || 'draft',
			user: result.tourUserId!,
			created: result.tourCreatedAt?.toISOString() || '',
			updated: result.tourUpdatedAt?.toISOString() || ''
		};
		
		const qrCode = {
			id: result.qrId,
			code: result.qrCode,
			name: result.qrName || 'Untitled QR Code',
			category: result.qrCategory,
			scans: result.qrScans,
			conversions: result.qrConversions,
			isActive: result.qrIsActive,
			tour: result.tourId,
			user: result.tourUserId,
			created: result.qrCreatedAt.toISOString(),
			updated: result.qrUpdatedAt?.toISOString() || '',
			expand: {
				tour: tour,
				user: { id: result.tourUserId }
			}
		};

		// Get recent bookings made through this QR code
		let recentBookings: any[] = [];
		try {
			const bookingsData = await db
				.select({
					id: bookings.id,
					customerName: bookings.customerName,
					customerEmail: bookings.customerEmail,
					participants: bookings.participants,
					totalAmount: bookings.totalAmount,
					status: bookings.status,
					paymentStatus: bookings.paymentStatus,
					createdAt: bookings.createdAt,
					timeSlotId: bookings.timeSlotId,
					timeSlotStartTime: timeSlots.startTime,
					timeSlotEndTime: timeSlots.endTime
				})
				.from(bookings)
				.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
				.where(eq(bookings.qrCodeId, params.qrId))
				.orderBy(desc(bookings.createdAt))
				.limit(10);
			
			recentBookings = bookingsData.map(booking => ({
				...booking,
				created: booking.createdAt.toISOString(),
				expand: {
					timeSlot: booking.timeSlotId ? {
						id: booking.timeSlotId,
						startTime: booking.timeSlotStartTime?.toISOString(),
						endTime: booking.timeSlotEndTime?.toISOString()
					} : null
				}
			}));
		} catch (err) {
			console.warn('Could not load bookings for QR code:', err);
		}
		
		return {
			tour,
			qrCode,
			recentBookings
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