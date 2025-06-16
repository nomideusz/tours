import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq, and, gte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, url }) => {
	const qrCode = params.qrCode;
	
	if (!qrCode) {
		return json({ error: 'QR code required' }, { status: 400 });
	}
	
	try {
		// Get tour data by QR code
		const tourData = await db
			.select({
				// Tour fields
				id: tours.id,
				name: tours.name,
				description: tours.description,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				location: tours.location,
				images: tours.images,
				category: tours.category,
				includedItems: tours.includedItems,
				requirements: tours.requirements,
				cancellationPolicy: tours.cancellationPolicy,
				enablePricingTiers: tours.enablePricingTiers,
				pricingTiers: tours.pricingTiers,
				status: tours.status,
				userId: tours.userId,
				qrCode: tours.qrCode,
				qrScans: tours.qrScans,
				qrConversions: tours.qrConversions,
				createdAt: tours.createdAt,
				
				// User fields
				userUsername: users.username,
				userName: users.name,
				userCurrency: users.currency
			})
			.from(tours)
			.leftJoin(users, eq(tours.userId, users.id))
			.where(and(
				eq(tours.qrCode, qrCode),
				eq(tours.status, 'active') // Only return active tours
			))
			.limit(1);
		
		if (tourData.length === 0) {
			return json({ error: 'Tour not found or inactive' }, { status: 404 });
		}
		
		const tour = tourData[0];
		
		// Track scan if this is a first visit (no 'visited' param)
		const isFirstVisit = !url.searchParams.has('visited');
		if (isFirstVisit) {
			try {
				// Update scan count
				await db
					.update(tours)
					.set({
						qrScans: (tour.qrScans || 0) + 1,
						updatedAt: new Date()
					})
					.where(eq(tours.id, tour.id));
			} catch (scanError) {
				console.warn('Failed to track scan:', scanError);
				// Don't fail the request if scan tracking fails
			}
		}
		
		// Get available time slots
		const now = new Date();
		const timeSlotData = await db
			.select({
				id: timeSlots.id,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				availableSpots: timeSlots.availableSpots,
				bookedSpots: timeSlots.bookedSpots,
				status: timeSlots.status,
				createdAt: timeSlots.createdAt,
				updatedAt: timeSlots.updatedAt
			})
			.from(timeSlots)
			.where(and(
				eq(timeSlots.tourId, tour.id),
				eq(timeSlots.status, 'available'),
				gte(timeSlots.startTime, now) // Only future slots
			))
			.orderBy(timeSlots.startTime);
		
		// Filter only available slots (not overbooked)
		const availableSlots = timeSlotData
			.filter(slot => (slot.availableSpots || 0) > (slot.bookedSpots || 0))
			.map(slot => ({
				id: slot.id,
				startTime: slot.startTime.toISOString(),
				endTime: slot.endTime.toISOString(),
				availableSpots: slot.availableSpots || 0,
				bookedSpots: slot.bookedSpots || 0,
				status: slot.status,
				created: slot.createdAt.toISOString(),
				updated: slot.updatedAt.toISOString()
			}));
		
		// Return formatted response
		return json({
			tour: {
				id: tour.id,
				name: tour.name,
				description: tour.description,
				price: tour.price,
				duration: tour.duration,
				capacity: tour.capacity,
				location: tour.location,
				images: tour.images || [],
				category: tour.category,
				includedItems: tour.includedItems,
				requirements: tour.requirements,
				cancellationPolicy: tour.cancellationPolicy,
				enablePricingTiers: tour.enablePricingTiers,
				pricingTiers: tour.pricingTiers,
				qrCode: tour.qrCode,
				scans: tour.qrScans || 0,
				conversions: tour.qrConversions || 0,
				created: tour.createdAt.toISOString()
			},
			timeSlots: availableSlots,
			tourOwner: {
				username: tour.userUsername,
				name: tour.userName,
				currency: tour.userCurrency
			}
		});
		
	} catch (err) {
		console.error('Error fetching public tour data:', err);
		return json({ error: 'Failed to load tour data' }, { status: 500 });
	}
}; 