import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { qrCodes, tours, timeSlots, bookings } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ params, url, locals, fetch }) => {
	try {
		// Get QR code with tour information
		console.log('Looking for QR code:', params.code);
		
		const qrCodeData = await db
			.select({
				// QR code fields
				qrId: qrCodes.id,
				qrCode: qrCodes.code,
				qrName: qrCodes.name,
				qrCategory: qrCodes.category,
				qrIsActive: qrCodes.isActive,
				qrScans: qrCodes.scans,
				qrConversions: qrCodes.conversions,
				qrCreatedAt: qrCodes.createdAt,
				
				// Tour fields
				tourId: tours.id,
				tourName: tours.name,
				tourDescription: tours.description,
				tourPrice: tours.price,
				tourDuration: tours.duration,
				tourCapacity: tours.capacity,
				tourLocation: tours.location,
				tourImages: tours.images,
				tourCategory: tours.category,
				tourIncludedItems: tours.includedItems,
				tourRequirements: tours.requirements,
				tourCancellationPolicy: tours.cancellationPolicy,
				tourUserId: tours.userId,
				tourCreatedAt: tours.createdAt
			})
			.from(qrCodes)
			.leftJoin(tours, eq(qrCodes.tourId, tours.id))
			.where(and(
				eq(qrCodes.code, params.code),
				eq(qrCodes.isActive, true)
			))
			.limit(1);
		
		if (qrCodeData.length === 0) {
			throw error(404, `QR code '${params.code}' not found or inactive.`);
		}
		
		const qrResult = qrCodeData[0];
		
		// Format to match expected structure
		const qrCode = {
			id: qrResult.qrId,
			code: qrResult.qrCode,
			name: qrResult.qrName,
			category: qrResult.qrCategory,
			isActive: qrResult.qrIsActive,
			scans: qrResult.qrScans,
			conversions: qrResult.qrConversions,
			created: qrResult.qrCreatedAt.toISOString(),
			expand: {
				tour: qrResult.tourId ? {
					id: qrResult.tourId,
					name: qrResult.tourName,
					description: qrResult.tourDescription,
					price: qrResult.tourPrice,
					duration: qrResult.tourDuration,
					capacity: qrResult.tourCapacity,
					location: qrResult.tourLocation,
					images: qrResult.tourImages,
					category: qrResult.tourCategory,
					includedItems: qrResult.tourIncludedItems,
					requirements: qrResult.tourRequirements,
					cancellationPolicy: qrResult.tourCancellationPolicy,
					user: qrResult.tourUserId,
					created: qrResult.tourCreatedAt?.toISOString(),
					collectionId: 'tours', // For image URL compatibility
					collectionName: 'tours'
				} : null
			}
		};
		
		// Track scan via API (works for both authenticated and anonymous users)
		const isFirstVisit = !url.searchParams.has('submitted');
		if (isFirstVisit) {
			try {
				const trackResponse = await fetch(`/api/qr/${params.code}/scan`, {
					method: 'POST'
				});
				if (trackResponse.ok) {
					const trackResult = await trackResponse.json();
					console.log(`Scan tracked via API: ${trackResult.scans} total scans`);
				} else {
					console.error('Failed to track scan via API:', await trackResponse.text());
				}
			} catch (trackError) {
				console.error('Error calling scan tracking API:', trackError);
				// Don't fail the page load if scan tracking fails
			}
		}
		
		// Get available time slots for the tour
		const tourId = qrResult.tourId;
		console.log('Looking for time slots for tour:', tourId);
		
		let timeSlotsResult: any[] = [];
		if (tourId) {
			try {
				const timeSlotsData = await db
					.select()
					.from(timeSlots)
					.where(and(
						eq(timeSlots.tourId, tourId),
						eq(timeSlots.status, 'available')
					))
					.orderBy(timeSlots.startTime);
				
				timeSlotsResult = timeSlotsData.map((slot) => ({
					...slot,
					startTime: slot.startTime.toISOString(),
					endTime: slot.endTime.toISOString(),
					created: slot.createdAt.toISOString(),
					updated: slot.updatedAt.toISOString()
				}));
				
				console.log('Available slots:', timeSlotsResult.length);
			} catch (err) {
				console.error('Failed to load time slots:', err);
				// Continue with empty array - the page will show "no available slots"
			}
		}
		
		// Generate SEO data for this tour
		const tour = qrCode.expand?.tour;
		const seoData = generateTourSEO(tour, params.code, url.origin);
		
		return {
			qrCode,
			timeSlots: timeSlotsResult,
			seo: seoData
		};
	} catch (err) {
		console.error('Error loading QR code:', err);
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load booking page');
	}
};

export const actions: Actions = {
	book: async ({ request, params, locals, fetch }) => {
		const formData = await request.formData();
		
		const timeSlotId = formData.get('timeSlotId') as string;
		const participants = parseInt(formData.get('participants') as string);
		const availableSpots = parseInt(formData.get('availableSpots') as string);
		const bookedSpots = parseInt(formData.get('bookedSpots') as string) || 0;
		const customerName = formData.get('customerName') as string;
		const customerEmail = formData.get('customerEmail') as string;
		const customerPhone = formData.get('customerPhone') as string;
		const specialRequests = formData.get('specialRequests') as string;
		
		// Validate required fields
		if (!timeSlotId || !participants || !customerName || !customerEmail) {
			return fail(400, {
				error: 'Please fill in all required fields',
				timeSlotId,
				participants,
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}
		
		// Validate availability
		if (availableSpots < participants) {
			return fail(400, {
				error: 'Not enough spots available for this time slot',
				timeSlotId,
				participants,
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}
		
		try {
			// Get QR code and tour info
			const qrCodeData = await db
				.select({
					qrId: qrCodes.id,
					qrCode: qrCodes.code,
					qrIsActive: qrCodes.isActive,
					tourId: tours.id,
					tourName: tours.name,
					tourPrice: tours.price
				})
				.from(qrCodes)
				.leftJoin(tours, eq(qrCodes.tourId, tours.id))
				.where(and(
					eq(qrCodes.code, params.code),
					eq(qrCodes.isActive, true)
				))
				.limit(1);
			
			if (qrCodeData.length === 0) {
				return fail(404, { error: 'QR code not found or inactive' });
			}
			
			const qrResult = qrCodeData[0];
			
			if (!qrResult.tourId) {
				return fail(500, { error: 'Tour information not found' });
			}
			
			// Calculate total price
			const totalPrice = participants * Number(qrResult.tourPrice);
			
			// Generate unique booking reference and ticket QR code
			const bookingReference = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
			const ticketQRCode = `TK-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
			
			// Create booking with atomic transaction-like behavior
			try {
				const bookingId = createId();
				const newBooking = {
					id: bookingId,
					tourId: qrResult.tourId,
					timeSlotId: timeSlotId,
					qrCodeId: qrResult.qrId,
					customerName,
					customerEmail,
					customerPhone: customerPhone || null,
					participants,
					totalAmount: totalPrice.toString(),
					bookingReference,
					ticketQRCode,
					specialRequests: specialRequests || null,
					status: 'pending' as const,
					paymentStatus: 'pending' as const,
					attendanceStatus: 'not_arrived' as const,
					createdAt: new Date(),
					updatedAt: new Date()
				};
				
				// Insert booking
				const bookingResult = await db.insert(bookings).values(newBooking).returning();
				const booking = bookingResult[0];
				
				// Update time slot availability
				let timeSlotUpdated = false;
				try {
					await db
						.update(timeSlots)
						.set({
							bookedSpots: bookedSpots + participants,
							availableSpots: availableSpots - participants,
							updatedAt: new Date()
						})
						.where(eq(timeSlots.id, timeSlotId));
					timeSlotUpdated = true;
				} catch (updateErr) {
					console.error('Failed to update time slot availability:', updateErr);
					// Note: In production, you might want to implement a cleanup job
					// or queue system to handle these orphaned bookings
				}
				
				// Track conversion via API
				try {
					const trackResponse = await fetch(`/api/qr/${params.code}/conversion`, {
						method: 'POST'
					});
					if (trackResponse.ok) {
						const trackResult = await trackResponse.json();
						console.log(`Conversion tracked via API: ${trackResult.conversions} total conversions`);
					} else {
						console.error('Failed to track conversion via API:', await trackResponse.text());
					}
				} catch (trackError) {
					console.error('Error calling conversion tracking API:', trackError);
					// Don't fail the booking if conversion tracking fails
				}
				
				// Success! Log and redirect to payment page
				console.log(`Booking created successfully! ID: ${booking.id}, Reference: ${bookingReference}`);
				console.log('User info:', locals?.user?.email || 'anonymous');
				
				const redirectUrl = `/book/${params.code}/payment?booking=${booking.id}`;
				console.log('Redirecting to:', redirectUrl);
				throw redirect(303, redirectUrl);
				
			} catch (dbErr) {
				// If it's a redirect, re-throw it (this is success, not an error!)
				if (
					(dbErr instanceof Response && dbErr.status === 303) ||
					(dbErr && typeof dbErr === 'object' && 'status' in dbErr && (dbErr as any).status === 303) ||
					(dbErr && typeof dbErr === 'object' && 'location' in dbErr)
				) {
					console.log('Booking successful, redirecting to payment page');
					throw dbErr;
				}
				
				console.error('Database error during booking creation:', dbErr);
				throw dbErr;
			}
			
		} catch (err) {
			// If it's a redirect, re-throw it (this is success, not an error!)
			if (
				(err instanceof Response && err.status === 303) ||
				(err && typeof err === 'object' && 'status' in err && (err as any).status === 303) ||
				(err && typeof err === 'object' && 'location' in err)
			) {
				console.log('Booking successful, redirecting to payment page');
				throw err;
			}
			
			// Only log as actual error if it's not a redirect
			console.error('Booking failed with error:', err);
			
			return fail(500, {
				error: 'Failed to create booking. Please try again.',
				timeSlotId,
				participants,
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}
	}
};

function generateTourSEO(tour: any, qrCode: string, origin: string) {
	if (!tour) {
		return {
			title: 'Book Tour - Zaur',
			description: 'Book your tour instantly with our secure QR booking system.',
			canonical: `${origin}/book/${qrCode}`,
			keywords: 'tour booking, instant booking, QR booking'
		};
	}

	const title = `Book ${tour.name} - Zaur`;
	const description = tour.description 
		? `${tour.description.substring(0, 150)}${tour.description.length > 150 ? '...' : ''} Book instantly with QR code.`
		: `Book ${tour.name} in ${tour.location || 'an amazing location'}. Instant booking with secure payment.`;
	
	const image = tour.images?.[0] 
		? `https://z.xeon.pl/api/files/${tour.collectionId}/${tour.id}/${tour.images[0]}?thumb=1200x630`
		: `${origin}/images/og-tour-default.jpg`;

	return {
		title,
		description,
		canonical: `${origin}/book/${qrCode}`,
		keywords: `${tour.name}, tour booking, ${tour.location}, instant booking, QR booking, tourism`,
		openGraph: {
			title,
			description,
			url: `${origin}/book/${qrCode}`,
			type: 'website',
			image,
			site_name: 'Zaur'
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			image
		},
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'TouristAttraction',
			name: tour.name,
			description: tour.description,
			image: image,
			location: {
				'@type': 'Place',
				name: tour.location
			},
			offers: {
				'@type': 'Offer',
				price: tour.price,
				priceCurrency: 'EUR',
				availability: 'https://schema.org/InStock',
				url: `${origin}/book/${qrCode}`
			},
			provider: {
				'@type': 'Organization',
				name: 'Zaur'
			}
		}
	};
} 