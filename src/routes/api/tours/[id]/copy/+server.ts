import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { generateTourQRCode } from '$lib/utils/qr-generation.js';
import { copyTourImages } from '$lib/utils/image-storage.js';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ params, locals, fetch }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const tourId = params.id;

	try {
		// First check if tour exists and belongs to user
		const [originalTour] = await db
			.select()
			.from(tours)
			.where(and(eq(tours.id, tourId), eq(tours.userId, locals.user.id)))
			.limit(1);

		if (!originalTour) {
			throw error(404, 'Tour not found');
		}

		// Check subscription limits using event.fetch
		const response = await fetch('/api/subscriptions/usage');
		if (response.ok) {
			const usage = await response.json();
			if (usage.tours && usage.tours.limit !== null && usage.tours.used >= usage.tours.limit) {
				throw error(403, 'Tour limit reached. Please upgrade your subscription to create more tours.');
			}
		}

		// Generate a new QR code for the copied tour
		const newQrCode = generateTourQRCode(originalTour.name);

		// Generate new tour ID
		const newTourId = createId();

		// Copy images from the original tour to the new tour
		let copiedImages: string[] = [];
		if (originalTour.images && originalTour.images.length > 0) {
			// Copy all images to the new tour's directory
			copiedImages = await copyTourImages(tourId, newTourId, originalTour.images);
			console.log(`📸 Copied ${copiedImages.length} images for new tour ${newTourId}`);
		}

	// Create a copy of the tour with some modifications
	const newTour = {
		id: newTourId,
		userId: locals.user.id,
		name: `${originalTour.name} (Copy)`,
		description: originalTour.description,
		location: originalTour.location,
		duration: originalTour.duration,
		price: originalTour.price,
		capacity: originalTour.capacity,
		categories: originalTour.categories || [],
		includedItems: originalTour.includedItems,
		requirements: originalTour.requirements,
		
		// Cancellation policy
		cancellationPolicy: originalTour.cancellationPolicy,
		cancellationPolicyId: originalTour.cancellationPolicyId,
		
		// Pricing configuration
		pricingModel: originalTour.pricingModel,
		enablePricingTiers: originalTour.enablePricingTiers,
		pricingTiers: originalTour.pricingTiers,
		participantCategories: originalTour.participantCategories,
		privateTour: originalTour.privateTour,
		groupPricingTiers: originalTour.groupPricingTiers,
		groupDiscounts: originalTour.groupDiscounts,
		optionalAddons: originalTour.optionalAddons,
		guidePaysStripeFee: originalTour.guidePaysStripeFee,
		
		// Capacity settings
		minCapacity: originalTour.minCapacity,
		maxCapacity: originalTour.maxCapacity,
		countInfantsTowardCapacity: originalTour.countInfantsTowardCapacity,
		
		// Images and QR
		images: copiedImages, // Use the copied images instead of original
		qrCode: newQrCode,
		qrScans: 0,
		qrConversions: 0,
		
		// Status and visibility
		status: 'draft' as const, // Always create copies as drafts
		publicListing: originalTour.publicListing,
		
		createdAt: new Date(),
		updatedAt: new Date()
	};

		// Insert the new tour
		const [copiedTour] = await db
			.insert(tours)
			.values(newTour)
			.returning();

		console.log(`✅ Tour ${tourId} copied to ${copiedTour.id} by user ${locals.user.id} (includes pricing, cancellation, capacity settings, and all configurations)`);

		return json({
			id: copiedTour.id,
			message: 'Tour copied successfully'
		});
	} catch (err) {
		console.error('Failed to copy tour:', err);
		
		if (err instanceof Response) {
			throw err;
		}
		
		// Check if it's our custom error
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		throw error(500, 'An unexpected error occurred while copying the tour');
	}
};
