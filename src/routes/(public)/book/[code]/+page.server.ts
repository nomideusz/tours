import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { generateTicketQRCode } from '$lib/ticket-qr.js';
import { canUserCreateBooking } from '$lib/stripe-subscriptions.server.js';
import { calculateBookingPrice } from '$lib/utils/pricing-calculations.js';
import type { Tour } from '$lib/types.js';

export const load: PageServerLoad = async ({ params }) => {
	return {
		qrCode: params.code
	};
};

export const actions: Actions = {
	book: async ({ request, params }) => {
		const formData = await request.formData();
		const qrCode = params.code;

		// Extract form data
		const timeSlotId = formData.get('timeSlotId') as string;
		const totalParticipantsStr = formData.get('totalParticipants') as string;
		const participantBreakdownStr = formData.get('participantBreakdown') as string;
		const participantsByCategoryStr = formData.get('participantsByCategory') as string;
		const legacyParticipants = formData.get('participants') as string; // For backward compatibility
		const selectedAddonIdsStr = formData.get('selectedAddonIds') as string;
		const customerName = formData.get('customerName') as string;
		const customerEmail = formData.get('customerEmail') as string;
		const customerPhone = formData.get('customerPhone') as string;
		const specialRequests = formData.get('specialRequests') as string;
		
		// Handle participant data
		let participants: number;
		let participantBreakdown: { adults: number; children: number } | null = null;
		let participantsByCategory: Record<string, number> | null = null;
		
		// New participant categories format
		if (participantsByCategoryStr) {
			try {
				participantsByCategory = JSON.parse(participantsByCategoryStr);
				participants = parseInt(totalParticipantsStr) || 0;
			} catch (e) {
				console.error('Failed to parse participants by category:', e);
				participants = parseInt(totalParticipantsStr) || 0;
			}
		}
		// Legacy adult/child breakdown
		else if (totalParticipantsStr && participantBreakdownStr) {
			participants = parseInt(totalParticipantsStr);
			try {
				participantBreakdown = JSON.parse(participantBreakdownStr);
			} catch (e) {
				console.error('Failed to parse participant breakdown:', e);
				participantBreakdown = null;
			}
		}
		// Legacy single number
		else if (legacyParticipants) {
			participants = parseInt(legacyParticipants);
		}
		else {
			participants = 0;
		}
		
		// Handle selected add-ons
		let selectedAddonIds: string[] = [];
		if (selectedAddonIdsStr) {
			try {
				selectedAddonIds = JSON.parse(selectedAddonIdsStr);
			} catch (e) {
				console.error('Failed to parse selected add-ons:', e);
			}
		}

		// Validate required fields
		if (!timeSlotId || !participants || !customerName || !customerEmail) {
			return fail(400, {
				error: 'Missing required fields',
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}

		let booking;
		
		try {
			// Get tour by QR code
			const tourData = await db
				.select()
				.from(tours)
				.where(and(
					eq(tours.qrCode, qrCode),
					eq(tours.status, 'active')
				))
				.limit(1);

			if (tourData.length === 0) {
				return fail(404, {
					error: 'Tour not found or inactive',
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			const tour = tourData[0];

			// Check if tour owner can create more bookings (subscription limit)
			const bookingLimitCheck = await canUserCreateBooking(tour.userId);
			if (!bookingLimitCheck.allowed) {
				return fail(403, {
					error: 'The tour guide has reached their monthly booking limit. Please try again next month or contact the tour guide.',
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			// Get time slot and check availability
			const timeSlotData = await db
				.select()
				.from(timeSlots)
				.where(eq(timeSlots.id, timeSlotId))
				.limit(1);

			if (timeSlotData.length === 0) {
				return fail(404, {
					error: 'Time slot not found',
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			const timeSlot = timeSlotData[0];

			// Check if time slot is in the future
			if (timeSlot.startTime && new Date(timeSlot.startTime) <= new Date()) {
				return fail(400, {
					error: 'Cannot book past time slots',
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			// Calculate participants that count toward capacity
			// This respects the countsTowardCapacity setting on each category (e.g., infants)
			let participantsThatCount = participants; // Default to total
			
			if (participantsByCategory && tour.participantCategories?.categories) {
				participantsThatCount = Object.entries(participantsByCategory).reduce((sum, [catId, count]) => {
					const category = tour.participantCategories?.categories?.find(c => c.id === catId);
					// Only count if category has countsTowardCapacity !== false
					if (category && category.countsTowardCapacity !== false) {
						return sum + count;
					}
					return sum;
				}, 0);
				
				console.log(`👥 Capacity check: ${participantsThatCount} count toward capacity (${participants} total participants)`);
			}

			// Check availability using participants that count toward capacity
			const availableSpots = timeSlot.availableSpots - (timeSlot.bookedSpots || 0);
			
			if (availableSpots < participantsThatCount) {
				return fail(400, {
					error: `Only ${availableSpots} spots available`,
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			// Get tour owner's currency for Stripe fee calculation (regulatory compliance)
			const tourOwnerData = await db.select({ currency: users.currency })
				.from(users)
				.where(eq(users.id, tour.userId))
				.limit(1);
			const currency = tourOwnerData[0]?.currency || 'EUR';
			
			// Calculate total amount using new pricing calculation utility
			// Convert tour data to match Tour interface (Date -> string, null -> undefined)
			const tourForCalculation: Tour = {
				...tour,
				images: tour.images ?? undefined,
				categories: tour.categories ?? undefined,
				location: tour.location ?? undefined,
				includedItems: tour.includedItems ?? undefined,
				requirements: tour.requirements ?? undefined,
				cancellationPolicy: tour.cancellationPolicy ?? undefined,
				qrCode: tour.qrCode ?? undefined,
				pricingModel: tour.pricingModel ?? undefined,
				pricingTiers: tour.pricingTiers ?? undefined,
				participantCategories: tour.participantCategories ?? undefined,
				privateTour: tour.privateTour ?? undefined,
				groupPricingTiers: tour.groupPricingTiers ?? undefined,
				groupDiscounts: tour.groupDiscounts ?? undefined,
				optionalAddons: tour.optionalAddons ?? undefined,
				createdAt: tour.createdAt.toISOString(),
				updatedAt: tour.updatedAt.toISOString()
			};
			
			// Calculate with Stripe fees for regulatory compliance (FTC, California SB 478, UK, EU)
			const priceCalculation = calculateBookingPrice(
				tourForCalculation,
				participants,
				selectedAddonIds,
				participantBreakdown?.adults,
				participantBreakdown?.children,
				participantsByCategory || undefined,
				currency
			);
			
			// Check for calculation errors
			if (priceCalculation.errors && priceCalculation.errors.length > 0) {
				console.error('💥 Price calculation errors:', priceCalculation.errors);
				return fail(400, {
					error: priceCalculation.errors.join('. '),
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}
			
			const totalAmount = priceCalculation.totalAmount.toFixed(2);
			
			// Get selected add-ons details for storing in booking
			const selectedAddons = tour.optionalAddons?.addons?.filter(addon =>
				selectedAddonIds.includes(addon.id)
			).map(addon => ({
				addonId: addon.id,
				name: addon.name,
				price: addon.price
			})) || [];
			
			console.log(`💰 Price calculation (${tour.pricingModel || 'per_person'}) with Stripe fees:`, {
				basePrice: priceCalculation.basePrice,
				addonsTotal: priceCalculation.addonsTotal,
				stripeFee: priceCalculation.stripeFee,
				totalAmount: priceCalculation.totalAmount,
				guideReceives: priceCalculation.guideReceives,
				guidePaysStripeFee: priceCalculation.guidePaysStripeFee,
				selectedTier: priceCalculation.selectedTier?.label || 'N/A'
			});

			// Generate booking reference and ticket QR code
			const bookingReference = `BK-${createId().slice(0, 8).toUpperCase()}`;
			const ticketQRCode = generateTicketQRCode();

			console.log(`✅ Creating booking for ${customerName} - ${tour.name} (${participants} participants)`);

			// Create booking with all-in pricing (regulatory compliance)
			const bookingResult = await db.insert(bookings).values({
				tourId: tour.id,
				timeSlotId: timeSlot.id,
				source: 'direct',
				sourceQrCode: qrCode,
				customerName,
				customerEmail,
				customerPhone: customerPhone || null,
				participants,
				participantBreakdown: participantBreakdown,
				participantsByCategory: participantsByCategory,
				totalAmount,  // This is now the all-in price including Stripe fees
				selectedAddons: selectedAddons.length > 0 ? selectedAddons : null,
				priceBreakdown: {
					basePrice: priceCalculation.basePrice,
					addonsTotal: priceCalculation.addonsTotal,
					subtotal: priceCalculation.subtotal,
					stripeFee: priceCalculation.stripeFee,
					totalAmount: priceCalculation.totalAmount,
					guideReceives: priceCalculation.guideReceives,
					guidePaysStripeFee: priceCalculation.guidePaysStripeFee,
					categoryBreakdown: priceCalculation.categoryBreakdown || undefined
				},
				status: 'pending',
				paymentStatus: 'pending',
				bookingReference,
				specialRequests: specialRequests || null,
				ticketQRCode
			}).returning();

			booking = bookingResult[0];

			// Update time slot booked spots (only count participants that count toward capacity)
			await db.update(timeSlots)
				.set({
					bookedSpots: (timeSlot.bookedSpots || 0) + participantsThatCount,
					updatedAt: new Date()
				})
				.where(eq(timeSlots.id, timeSlotId));

			// Update tour QR conversions
			await db.update(tours)
				.set({
					qrConversions: (tour.qrConversions || 0) + 1,
					updatedAt: new Date()
				})
				.where(eq(tours.id, tour.id));

			// Check if this is a free tour
			const totalAmountNum = parseFloat(totalAmount);
			if (totalAmountNum === 0) {
				console.log(`✅ Free tour booking ${booking.bookingReference} - ${tour.name} - confirming immediately`);
				
				// Update booking to confirmed status since no payment is needed
				await db.update(bookings)
					.set({
						status: 'confirmed',
						paymentStatus: 'paid', // Mark as 'paid' even though it's free
						updatedAt: new Date()
					})
					.where(eq(bookings.id, booking.id));
				
				console.log(`🎉 Free tour booking confirmed - redirecting to success page`);
				
				// TODO: Send notification for free tour booking
				// Notification will be sent via webhook when payment is confirmed
				// For free tours, we might want to send notification immediately
				
				// Redirect directly to success page for free tours
				redirect(303, `/book/${qrCode}/success?booking=${booking.id}`);
			}

			// Notification will be sent via webhook when payment is confirmed
			// This prevents duplicate notifications for pending bookings

		} catch (error) {
			console.error('💥 Booking creation error:', error);
			console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

			return fail(500, {
				error: 'Failed to create booking. Please try again.',
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}

		// If we get here, booking was successful - redirect to payment
		console.log(`✅ Booking ${booking.bookingReference} created successfully, redirecting to payment`);
		redirect(303, `/book/${qrCode}/payment?booking=${booking.id}`);
	}
}; 