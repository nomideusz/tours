import type { RequestHandler } from './$types.js';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { qrCode } = params;
		
		if (!qrCode) {
			throw error(400, 'QR code parameter is required');
		}
		
		// Get tour data by QR code with user information
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
				categories: tours.categories,
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
				userName: users.name
			})
			.from(tours)
			.leftJoin(users, eq(tours.userId, users.id))
			.where(eq(tours.qrCode, qrCode))
			.limit(1);
		
		if (tourData.length === 0) {
			throw error(404, 'Tour not found for the provided QR code');
		}
		
		const tourRecord = tourData[0];
		
		// Format the response to match expected structure
		const tour = {
			id: tourRecord.id,
			name: tourRecord.name,
			description: tourRecord.description,
			price: tourRecord.price,
			duration: tourRecord.duration,
			capacity: tourRecord.capacity,
			location: tourRecord.location,
			images: tourRecord.images,
			categories: tourRecord.categories || [],
			includedItems: tourRecord.includedItems,
			requirements: tourRecord.requirements,
			cancellationPolicy: tourRecord.cancellationPolicy,
			enablePricingTiers: tourRecord.enablePricingTiers,
			pricingTiers: tourRecord.pricingTiers,
			status: tourRecord.status,
			userId: tourRecord.userId,
			qrCode: tourRecord.qrCode,
			qrScans: tourRecord.qrScans,
			qrConversions: tourRecord.qrConversions,
			createdAt: tourRecord.createdAt,
			owner: {
				username: tourRecord.userUsername,
				name: tourRecord.userName
			}
		};
		
		return json({ tour });
		
	} catch (err) {
		console.error('Error fetching tour by QR code:', err);
		
		if ((err as any).status) {
			throw err;
		}
		
		throw error(500, 'Failed to fetch tour data');
	}
}; 