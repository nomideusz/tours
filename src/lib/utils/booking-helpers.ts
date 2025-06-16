/**
 * Booking-related helper functions for fetching and processing booking data
 */

import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import type { ProcessedBooking } from './booking-types.js';

/**
 * Get recent bookings for dashboard display
 * This is designed to be compatible with future TanStack Query implementation
 */
export async function getRecentBookings(userId: string, limit: number = 10): Promise<ProcessedBooking[]> {
	try {
		const recentBookingsData = await db.select({
			id: bookings.id,
			customerName: bookings.customerName,
			customerEmail: bookings.customerEmail,
			participants: bookings.participants,
			status: bookings.status,
			createdAt: bookings.createdAt,
			totalAmount: bookings.totalAmount,
			paymentStatus: bookings.paymentStatus,
			timeSlotId: bookings.timeSlotId,
			tourName: tours.name,
			tourId: tours.id,
			// TimeSlot fields
			timeSlotStartTime: timeSlots.startTime,
			timeSlotEndTime: timeSlots.endTime
		})
		.from(bookings)
		.innerJoin(tours, eq(bookings.tourId, tours.id))
		.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
		.where(eq(tours.userId, userId))
		.orderBy(desc(bookings.createdAt))
		.limit(Math.min(limit, 1000)); // Allow higher limits for comprehensive stats
		
		// Process for display - convert to ProcessedBooking format with timeSlot data for dashboard
		return recentBookingsData.map((booking: any) => {
			// Safe date conversion with null checks
			const createdAtDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
			const createdAtStr = !isNaN(createdAtDate.getTime()) ? createdAtDate.toISOString() : new Date().toISOString();
			
			// Handle time slot dates safely
			let startTimeStr = null;
			let endTimeStr = null;
			let effectiveDateStr = createdAtStr;
			
			if (booking.timeSlotStartTime) {
				const startDate = new Date(booking.timeSlotStartTime);
				if (!isNaN(startDate.getTime())) {
					startTimeStr = startDate.toISOString();
					effectiveDateStr = startTimeStr;
				}
			}
			
			if (booking.timeSlotEndTime) {
				const endDate = new Date(booking.timeSlotEndTime);
				if (!isNaN(endDate.getTime())) {
					endTimeStr = endDate.toISOString();
				}
			}
			
			return {
				id: booking.id,
				customerName: booking.customerName || '',
				customerEmail: booking.customerEmail || '',
				participants: booking.participants || 1,
				status: booking.status || 'pending',
				created: createdAtStr,
				updated: createdAtStr, // Use created as fallback
				tour: booking.tourName || 'Unknown Tour',
				totalAmount: typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) || 0 : (booking.totalAmount || 0),
				paymentStatus: booking.paymentStatus || 'pending',
				effectiveDate: effectiveDateStr,
				expand: {
					tour: { 
						id: booking.tourId || '',
						name: booking.tourName || 'Unknown Tour'
					},
					timeSlot: booking.timeSlotId && startTimeStr ? {
						id: booking.timeSlotId,
						startTime: startTimeStr,
						endTime: endTimeStr
					} : undefined
				}
			};
		});
	} catch (error) {
		console.error('Error fetching recent bookings:', error);
		return [];
	}
}

/**
 * Get tour-specific booking data and stats for a single tour
 * This replaces the booking-helpers.ts functionality for tour detail pages
 */
export async function getTourBookingData(userId: string, tourId: string) {
	try {
		// Get tour data first to verify ownership
		const tourData = await db.select()
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);
		
		if (tourData.length === 0) {
			throw new Error('Tour not found or access denied');
		}
		
		const tour = tourData[0];
		
		// Get booking data for this tour (without JOIN for better performance)
		const bookingsData = await db.select({
			id: bookings.id,
			status: bookings.status,
			paymentStatus: bookings.paymentStatus,
			totalAmount: bookings.totalAmount,
			participants: bookings.participants,
			createdAt: bookings.createdAt,
			timeSlotId: bookings.timeSlotId,
			customerName: bookings.customerName,
			customerEmail: bookings.customerEmail,
			ticketQRCode: bookings.ticketQRCode,
			bookingReference: bookings.bookingReference,
			attendanceStatus: bookings.attendanceStatus
		})
		.from(bookings)
		.where(eq(bookings.tourId, tourId))
		.orderBy(desc(bookings.createdAt))
		.limit(15); // Reduced limit to prevent timeout
		
		// Get time slot data separately if needed
		const timeSlotIds = [...new Set(bookingsData
			.map(b => b.timeSlotId)
			.filter(id => id !== null))];
		
		let timeSlotsMap = new Map();
		if (timeSlotIds.length > 0) {
			for (const timeSlotId of timeSlotIds.slice(0, 5)) { // Limit to 5 for tour detail page
				try {
					const timeSlotData = await db.select({
						id: timeSlots.id,
						startTime: timeSlots.startTime,
						endTime: timeSlots.endTime
					})
					.from(timeSlots)
					.where(eq(timeSlots.id, timeSlotId))
					.limit(1);
					
					if (timeSlotData.length > 0) {
						timeSlotsMap.set(timeSlotId, timeSlotData[0]);
					}
				} catch (err) {
					console.warn('Failed to fetch time slot', timeSlotId, ':', err);
				}
			}
		}
		
		// Process bookings data
		const processedBookings = bookingsData.map(booking => {
			const timeSlot = booking.timeSlotId ? timeSlotsMap.get(booking.timeSlotId) : null;
			
			// Safe date conversion
			const createdAtDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
			const createdAtStr = !isNaN(createdAtDate.getTime()) ? createdAtDate.toISOString() : new Date().toISOString();
			
			// Handle time slot dates safely
			let effectiveDateStr = createdAtStr;
			let timeSlotData = undefined;
			
			if (timeSlot) {
				const startDate = timeSlot.startTime ? new Date(timeSlot.startTime) : null;
				const endDate = timeSlot.endTime ? new Date(timeSlot.endTime) : null;
				
				const startTimeStr = startDate && !isNaN(startDate.getTime()) ? startDate.toISOString() : null;
				const endTimeStr = endDate && !isNaN(endDate.getTime()) ? endDate.toISOString() : null;
				
				if (startTimeStr) {
					effectiveDateStr = startTimeStr;
					timeSlotData = {
						id: booking.timeSlotId,
						startTime: startTimeStr,
						endTime: endTimeStr
					};
				}
			}
			
			return {
				id: booking.id,
				customerName: booking.customerName || '',
				customerEmail: booking.customerEmail || '',
				participants: booking.participants || 0,
				status: booking.status || 'pending',
				paymentStatus: booking.paymentStatus || 'pending',
				created: createdAtStr,
				updated: createdAtStr,
				tour: tour.name || 'Unknown Tour',
				totalAmount: booking.totalAmount ? parseFloat(booking.totalAmount) : 0,
				bookingReference: booking.bookingReference || '',
				ticketQRCode: booking.ticketQRCode || null,
				attendanceStatus: booking.attendanceStatus || null,
				effectiveDate: effectiveDateStr,
				expand: {
					timeSlot: timeSlotData
				}
			};
		});
		
		// Calculate stats
		let totalBookings = processedBookings.length;
		let confirmed = 0;
		let pending = 0;
		let cancelled = 0;
		let totalRevenue = 0;
		let totalParticipants = 0;
		let checkIns = 0;
		let noShows = 0;
		
		const now = new Date();
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		let thisWeekBookings = 0;
		
		// Filter for upcoming bookings
		const upcomingBookings = processedBookings.filter(booking => {
			if (!booking.expand?.timeSlot?.startTime) return false;
			const tourDate = new Date(booking.expand.timeSlot.startTime);
			const isUpcoming = tourDate > now || tourDate.toDateString() === now.toDateString();
			return isUpcoming && booking.status === 'confirmed' && booking.paymentStatus === 'paid';
		});
		
		for (const booking of processedBookings) {
			// Status counts
			switch (booking.status) {
				case 'confirmed':
					confirmed++;
					break;
				case 'pending':
					pending++;
					break;
				case 'cancelled':
					cancelled++;
					break;
			}
			
			// Revenue calculation (confirmed, completed bookings)
			if ((booking.status === 'confirmed' || booking.status === 'completed') && booking.paymentStatus === 'paid') {
				totalRevenue += booking.totalAmount;
				totalParticipants += booking.participants;
			}
			
			// Attendance tracking
			if (booking.attendanceStatus === 'checked_in') {
				checkIns++;
			} else if (booking.attendanceStatus === 'no_show') {
				noShows++;
			}
			
			// This week's bookings
			const bookingDate = new Date(booking.created);
			if (bookingDate >= weekAgo) {
				thisWeekBookings++;
			}
		}
		
		const stats = {
			total: totalBookings,
			confirmed,
			pending,
			cancelled,
			totalRevenue,
			totalParticipants,
			thisWeekBookings,
			averageBookingValue: confirmed > 0 ? totalRevenue / confirmed : 0,
			checkIns,
			noShows
		};
		
		// Safe tour date conversion
		const tourCreatedAt = tour.createdAt ? new Date(tour.createdAt) : new Date();
		const tourUpdatedAt = tour.updatedAt ? new Date(tour.updatedAt) : tourCreatedAt;
		
		return {
			tour: {
				...tour,
				price: tour.price ? parseFloat(tour.price) : 0,
				createdAt: !isNaN(tourCreatedAt.getTime()) ? tourCreatedAt.toISOString() : new Date().toISOString(),
				updatedAt: !isNaN(tourUpdatedAt.getTime()) ? tourUpdatedAt.toISOString() : new Date().toISOString()
			},
			bookings: upcomingBookings, // Return only upcoming bookings for display
			allBookings: processedBookings, // Return all bookings for stats
			stats
		};
		
	} catch (error) {
		console.error('Error fetching tour booking data:', error);
		throw error;
	}
}

/**
 * Get all bookings for a specific tour (for bookings management page)
 * This replaces the booking-helpers.ts functionality for tour bookings pages
 * Optimized to prevent 502 timeouts by reducing query complexity
 */
export async function getTourAllBookings(userId: string, tourId: string) {
	try {
		// Get tour data first to verify ownership
		const tourData = await db.select()
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);
		
		if (tourData.length === 0) {
			throw new Error('Tour not found or access denied');
		}
		
		const tour = tourData[0];
		
		// Step 1: Get core booking data without JOIN (most performant)
		const bookingsData = await db.select({
			id: bookings.id,
			status: bookings.status,
			paymentStatus: bookings.paymentStatus,
			totalAmount: bookings.totalAmount,
			participants: bookings.participants,
			customerName: bookings.customerName,
			customerEmail: bookings.customerEmail,
			customerPhone: bookings.customerPhone,
			specialRequests: bookings.specialRequests,
			createdAt: bookings.createdAt,
			updatedAt: bookings.updatedAt,
			bookingReference: bookings.bookingReference,
			attendanceStatus: bookings.attendanceStatus,
			checkedInAt: bookings.checkedInAt,
			ticketQRCode: bookings.ticketQRCode,
			timeSlotId: bookings.timeSlotId
		})
		.from(bookings)
		.where(eq(bookings.tourId, tourId))
		.orderBy(desc(bookings.createdAt))
		.limit(25); // Reduced limit to prevent timeout
		
		// Step 2: Get time slot data separately for only the bookings that have time slots
		const timeSlotIds = [...new Set(bookingsData
			.map(b => b.timeSlotId)
			.filter(id => id !== null))];
		
		let timeSlotsMap = new Map();
		if (timeSlotIds.length > 0) {
			// Fetch time slots individually to avoid complex queries
			for (const timeSlotId of timeSlotIds.slice(0, 10)) { // Limit to 10 time slots to prevent timeout
				try {
					const timeSlotData = await db.select({
						id: timeSlots.id,
						startTime: timeSlots.startTime,
						endTime: timeSlots.endTime,
						availableSpots: timeSlots.availableSpots,
						bookedSpots: timeSlots.bookedSpots
					})
					.from(timeSlots)
					.where(eq(timeSlots.id, timeSlotId))
					.limit(1);
					
					if (timeSlotData.length > 0) {
						timeSlotsMap.set(timeSlotId, timeSlotData[0]);
					}
				} catch (err) {
					console.warn('Failed to fetch time slot', timeSlotId, ':', err);
				}
			}
		}
		
		// Step 3: Process bookings data with separate time slot lookup
		const processedBookings = bookingsData.map(booking => {
			const timeSlot = booking.timeSlotId ? timeSlotsMap.get(booking.timeSlotId) : null;
			
			return {
				id: booking.id,
				customerName: booking.customerName || '',
				customerEmail: booking.customerEmail || '',
				customerPhone: booking.customerPhone || '',
				participants: booking.participants || 1,
				status: booking.status,
				paymentStatus: booking.paymentStatus,
				created: booking.createdAt?.toISOString() || new Date().toISOString(),
				updated: booking.updatedAt?.toISOString() || booking.createdAt?.toISOString() || new Date().toISOString(),
				tour: tour.name,
				totalAmount: booking.totalAmount || 0,
				bookingReference: booking.bookingReference || '',
				specialRequests: booking.specialRequests || '',
				attendanceStatus: booking.attendanceStatus || null,
				checkedInAt: booking.checkedInAt?.toISOString() || null,
				ticketQRCode: booking.ticketQRCode || null,
				effectiveDate: timeSlot?.startTime?.toISOString() || booking.createdAt?.toISOString() || new Date().toISOString(),
				expand: {
					timeSlot: timeSlot ? {
						id: booking.timeSlotId,
						startTime: timeSlot.startTime?.toISOString(),
						endTime: timeSlot.endTime?.toISOString(),
						availableSpots: timeSlot.availableSpots,
						bookedSpots: timeSlot.bookedSpots
					} : undefined
				}
			};
		});
		
		return {
			tour: {
				...tour,
				price: tour.price ? parseFloat(tour.price) : 0,
				createdAt: tour.createdAt?.toISOString() || new Date().toISOString(),
				updatedAt: tour.updatedAt?.toISOString() || new Date().toISOString()
			},
			bookings: processedBookings
		};
		
	} catch (error) {
		console.error('Error fetching tour all bookings:', error);
		throw error;
	}
}

/**
 * Get individual booking details with tour and payment information
 * This is for the individual booking detail page
 */
export async function getBookingDetails(userId: string, bookingId: string) {
	try {
		// Get the booking with expanded tour and timeSlot data
		const bookingData = await db
			.select({
				// Booking fields
				id: bookings.id,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				paymentId: bookings.paymentId,
				totalAmount: bookings.totalAmount,
				participants: bookings.participants,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				customerPhone: bookings.customerPhone,
				specialRequests: bookings.specialRequests,
				bookingReference: bookings.bookingReference,
				ticketQRCode: bookings.ticketQRCode,
				attendanceStatus: bookings.attendanceStatus,
				checkedInAt: bookings.checkedInAt,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
				
				// Tour fields
				tourId: bookings.tourId,
				tourName: tours.name,
				tourDescription: tours.description,
				tourLocation: tours.location,
				tourPrice: tours.price,
				tourDuration: tours.duration,
				tourUserId: tours.userId,
				
				// Time slot fields
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime,
				timeSlotAvailableSpots: timeSlots.availableSpots,
				timeSlotBookedSpots: timeSlots.bookedSpots
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(eq(bookings.id, bookingId))
			.limit(1);
		
		if (bookingData.length === 0) {
			throw new Error('Booking not found');
		}
		
		const booking = bookingData[0];
		
		// Check if the booking belongs to a tour owned by this user
		if (booking.tourUserId !== userId) {
			throw new Error('Access denied: You can only view bookings for your own tours');
		}
		
		// Transform to match expected format with expand structure
		const formattedBooking = {
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			paymentId: booking.paymentId,
			totalAmount: booking.totalAmount,
			participants: booking.participants,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			customerPhone: booking.customerPhone,
			specialRequests: booking.specialRequests,
			bookingReference: booking.bookingReference,
			ticketQRCode: booking.ticketQRCode,
			attendanceStatus: booking.attendanceStatus,
			checkedInAt: booking.checkedInAt?.toISOString(),
			created: booking.createdAt?.toISOString() || new Date().toISOString(),
			updated: booking.updatedAt?.toISOString() || new Date().toISOString(),
			expand: {
				tour: {
					id: booking.tourId,
					name: booking.tourName,
					description: booking.tourDescription,
					location: booking.tourLocation,
					price: booking.tourPrice,
					duration: booking.tourDuration,
					user: booking.tourUserId
				},
				timeSlot: booking.timeSlotId ? {
					id: booking.timeSlotId,
					startTime: booking.timeSlotStartTime?.toISOString(),
					endTime: booking.timeSlotEndTime?.toISOString(),
					availableSpots: booking.timeSlotAvailableSpots,
					bookedSpots: booking.timeSlotBookedSpots
				} : null
			}
		};
		
		// Get payment information if exists
		let payment = null;
		if (booking.paymentId) {
			try {
				const { payments } = await import('$lib/db/schema/index.js');
				const paymentData = await db
					.select()
					.from(payments)
					.where(eq(payments.stripePaymentIntentId, booking.paymentId))
					.limit(1);
				
				if (paymentData.length > 0) {
					payment = {
						...paymentData[0],
						created: paymentData[0].createdAt.toISOString(),
						updated: paymentData[0].updatedAt.toISOString(),
						expand: {
							booking: formattedBooking
						}
					};
				}
			} catch (paymentErr) {
				console.log('Payment not found or accessible for booking', bookingId, ':', paymentErr);
				// Payment record doesn't exist or isn't accessible - this is OK, continue without it
				payment = null;
			}
		}
		
		return {
			booking: formattedBooking,
			payment: payment
		};
		
	} catch (error) {
		console.error('Error fetching booking details:', error);
		throw error;
	}
}

/**
 * Format a recent booking for dashboard display
 * This replaces the formatRecentBooking function from booking-helpers.ts
 */
export function formatRecentBooking(booking: ProcessedBooking) {
	return {
		id: booking.id,
		customerName: booking.customerName,
		tourName: booking.tour, // Map tour to tourName for dashboard compatibility
		status: booking.status,
		amount: booking.totalAmount, // Map totalAmount to amount for dashboard compatibility
		participants: booking.participants,
		date: booking.effectiveDate, // Map effectiveDate to date for dashboard compatibility
		created: booking.created,
		expand: booking.expand
	};
}

/**
 * Create today's schedule from recent bookings data
 * This replaces the createTodaysSchedule function from booking-helpers.ts
 * 
 * Note: This function now includes bookings from the last 48 hours to account for timezone differences
 * The frontend can further filter based on the user's actual timezone
 */
export function createTodaysSchedule(bookings: ProcessedBooking[]) {
	try {
		const now = new Date();
		// Expand the time window to include last 48 hours to account for timezone differences
		// This ensures bookings don't get filtered out due to server/client timezone mismatch
		const timeWindow = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago
		const futureWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
		
		// Filter for recent bookings that have time slots
		const todaysBookings = bookings.filter(booking => {
			if (!booking.expand?.timeSlot?.startTime) return false;
			
			const bookingDate = new Date(booking.expand.timeSlot.startTime);
			const isInTimeWindow = bookingDate >= timeWindow && bookingDate <= futureWindow;
			const isConfirmedOrPending = booking.status === 'confirmed' || booking.status === 'pending';
			
			return isInTimeWindow && isConfirmedOrPending;
		});
		
		// Sort by time
		const sortedBookings = todaysBookings.sort((a, b) => {
			const timeA = new Date(a.expand?.timeSlot?.startTime || 0);
			const timeB = new Date(b.expand?.timeSlot?.startTime || 0);
			return timeA.getTime() - timeB.getTime();
		});
		
		// Format for schedule display
		return sortedBookings.map(booking => ({
			id: booking.id,
			time: booking.expand?.timeSlot?.startTime,
			tourName: booking.tour, // Map for dashboard compatibility
			customerName: booking.customerName,
			participants: booking.participants,
			status: booking.status,
			expand: booking.expand
		}));
		
	} catch (error) {
		console.error('Error creating today\'s schedule:', error);
		return [];
	}
} 