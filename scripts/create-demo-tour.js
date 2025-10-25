#!/usr/bin/env node
/**
 * Create a professional Demo Tour for marketing demonstrations
 * 
 * This script creates a fully-featured demo tour with:
 * - Attractive name and description
 * - Multiple time slots
 * - Sample bookings
 * - All features enabled
 * 
 * Usage: node scripts/create-demo-tour.js <userId>
 */

import pg from 'pg';
import { config } from 'dotenv';
import { randomBytes } from 'crypto';

// Load environment variables
config();

const { Client } = pg;

// Simple ID generation
function createId() {
	return randomBytes(16).toString('base64url');
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
	console.error('❌ Please provide a userId as argument');
	console.error('Usage: node scripts/create-demo-tour.js <userId>');
	process.exit(1);
}

// Database configuration from environment
const dbConfig = {
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
};

if (!dbConfig.connectionString) {
	console.error('❌ DATABASE_URL environment variable is not set');
	process.exit(1);
}

async function createDemoTour() {
	const client = new Client(dbConfig);
	
	try {
		await client.connect();
		console.log('🎯 Creating Demo Tour...\n');

		// Generate unique QR code
		const qrCode = `TUR-DEMO-${createId().substring(0, 8).toUpperCase()}`;
		const tourId = createId();

		// Create the demo tour
		const demoTour = {
			id: tourId,
			name: 'Historic Berlin Walking Tour',
			description: `Discover the fascinating history of Berlin on this immersive 3-hour walking tour through the city's most iconic landmarks.

**What You'll Experience:**
• Brandenburg Gate & Pariser Platz
• The Reichstag Building & Government Quarter
• Holocaust Memorial & historical insights
• Checkpoint Charlie & Berlin Wall history
• Hidden courtyards and local stories

Our expert guides bring history to life with engaging storytelling, rare historical photos, and insider knowledge that you won't find in guidebooks.

Perfect for history enthusiasts, first-time visitors, and anyone wanting to understand Berlin's complex and compelling past.`,
			price: '35.00',
			duration: 180, // 3 hours in minutes
			capacity: 15,
			minCapacity: 4,
			maxCapacity: 15,
			userId: userId,
			images: [
				'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200',
				'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=1200',
				'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1200'
			],
			status: 'active',
			categories: ['historical', 'walking', 'cultural', 'city'],
			location: 'Berlin, Germany',
			includedItems: [
				'Expert local guide',
				'Small group experience (max 15 people)',
				'Historical photos and visual aids',
				'Insider tips for your Berlin visit',
				'Optional coffee break at local café'
			],
			requirements: [
				'Comfortable walking shoes required',
				'Weather-appropriate clothing',
				'Basic fitness level (3 hours walking)',
				'Children welcome (discounted rates available)',
				'Tours in English & German available'
			],
			cancellationPolicy: 'Free cancellation up to 24 hours before the tour starts. Cancel within 24 hours for a 50% refund. No-shows are non-refundable.',
			cancellationPolicyId: 'moderate',
			pricingModel: 'per_person',
			enablePricingTiers: true,
			pricingTiers: {
				adult: 35,
				child: 18
			},
			participantCategories: {
				categories: [
					{
						id: 'adult',
						label: 'Adult',
						price: 35,
						ageRange: '13+',
						description: 'Standard adult ticket',
						sortOrder: 1,
						minAge: 13,
						countsTowardCapacity: true
					},
					{
						id: 'child',
						label: 'Child',
						price: 18,
						ageRange: '6-12',
						description: 'Discounted rate for children',
						sortOrder: 2,
						minAge: 6,
						maxAge: 12,
						countsTowardCapacity: true
					},
					{
						id: 'infant',
						label: 'Infant',
						price: 0,
						ageRange: '0-5',
						description: 'Free for young children',
						sortOrder: 3,
						minAge: 0,
						maxAge: 5,
						countsTowardCapacity: false
					}
				]
			},
			groupDiscounts: {
				enabled: true,
				tiers: [
					{
						id: 'group-small',
						minParticipants: 6,
						maxParticipants: 9,
						discountType: 'percentage',
						discountValue: 10,
						label: 'Small Group (10% off)'
					},
					{
						id: 'group-large',
						minParticipants: 10,
						maxParticipants: 15,
						discountType: 'percentage',
						discountValue: 15,
						label: 'Large Group (15% off)'
					}
				]
			},
			optionalAddons: {
				addons: [
					{
						id: 'photos',
						name: 'Professional Tour Photos',
						description: 'Digital photo package delivered within 48 hours',
						price: 15,
						required: false,
						icon: '📸'
					},
					{
						id: 'snacks',
						name: 'Berlin Snack Box',
						description: 'Traditional Berlin treats and drinks',
						price: 8,
						required: false,
						icon: '🥨'
					}
				]
			},
			guidePaysStripeFee: false,
			countInfantsTowardCapacity: false,
			qrCode: qrCode,
			qrScans: 127,
			qrConversions: 34,
			publicListing: true,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// Insert tour using raw SQL
		const insertTourQuery = `
			INSERT INTO tours (
				id, name, description, price, duration, capacity, min_capacity, max_capacity,
				user_id, images, status, categories, location, included_items, requirements,
				cancellation_policy, cancellation_policy_id, pricing_model, enable_pricing_tiers,
				pricing_tiers, participant_categories, group_discounts, optional_addons,
				guide_pays_stripe_fee, count_infants_toward_capacity, qr_code, qr_scans,
				qr_conversions, public_listing, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
				$16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
			)
		`;
		
		await client.query(insertTourQuery, [
			demoTour.id,
			demoTour.name,
			demoTour.description,
			demoTour.price,
			demoTour.duration,
			demoTour.capacity,
			demoTour.minCapacity,
			demoTour.maxCapacity,
			demoTour.userId,
			JSON.stringify(demoTour.images),
			demoTour.status,
			JSON.stringify(demoTour.categories),
			demoTour.location,
			JSON.stringify(demoTour.includedItems),
			JSON.stringify(demoTour.requirements),
			demoTour.cancellationPolicy,
			demoTour.cancellationPolicyId,
			demoTour.pricingModel,
			demoTour.enablePricingTiers,
			JSON.stringify(demoTour.pricingTiers),
			JSON.stringify(demoTour.participantCategories),
			JSON.stringify(demoTour.groupDiscounts),
			JSON.stringify(demoTour.optionalAddons),
			demoTour.guidePaysStripeFee,
			demoTour.countInfantsTowardCapacity,
			demoTour.qrCode,
			demoTour.qrScans,
			demoTour.qrConversions,
			demoTour.publicListing,
			new Date(),
			new Date()
		]);
		
		console.log(`✅ Demo tour created: ${demoTour.name}`);
		console.log(`   Tour ID: ${demoTour.id}`);
		console.log(`   QR Code: ${demoTour.qrCode}`);
		console.log(`   Public URL: https://zaur.app/book/${demoTour.qrCode}\n`);

		// Create time slots for the next 2 weeks
		const now = new Date();
		const timeSlotData = [];
		
		// Create slots for next 14 days (every Monday, Wednesday, Friday, Saturday at 10:00 and 14:00)
		for (let i = 0; i < 14; i++) {
			const date = new Date(now);
			date.setDate(date.getDate() + i);
			const dayOfWeek = date.getDay();
			
			// Only Mon (1), Wed (3), Fri (5), Sat (6)
			if ([1, 3, 5, 6].includes(dayOfWeek)) {
				// Morning slot (10:00 AM)
				const morningStart = new Date(date);
				morningStart.setHours(10, 0, 0, 0);
				const morningEnd = new Date(morningStart);
				morningEnd.setHours(13, 0, 0, 0); // 3 hours
				
				timeSlotData.push({
					id: createId(),
					tourId: tourId,
					startTime: morningStart,
					endTime: morningEnd,
					availableSpots: 15,
					bookedSpots: Math.floor(Math.random() * 8), // Random bookings 0-7
					status: 'available',
					isRecurring: false,
					createdAt: new Date(),
					updatedAt: new Date()
				});
				
				// Afternoon slot (2:00 PM)
				const afternoonStart = new Date(date);
				afternoonStart.setHours(14, 0, 0, 0);
				const afternoonEnd = new Date(afternoonStart);
				afternoonEnd.setHours(17, 0, 0, 0); // 3 hours
				
				timeSlotData.push({
					id: createId(),
					tourId: tourId,
					startTime: afternoonStart,
					endTime: afternoonEnd,
					availableSpots: 15,
					bookedSpots: Math.floor(Math.random() * 6), // Random bookings 0-5
					status: 'available',
					isRecurring: false,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			}
		}

		if (timeSlotData.length > 0) {
			// Insert time slots using batch query
			const insertSlotQuery = `
				INSERT INTO time_slots (
					id, tour_id, start_time, end_time, available_spots, booked_spots,
					status, is_recurring, created_at, updated_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			`;
			
			for (const slot of timeSlotData) {
				await client.query(insertSlotQuery, [
					slot.id,
					slot.tourId,
					slot.startTime,
					slot.endTime,
					slot.availableSpots,
					slot.bookedSpots,
					slot.status,
					slot.isRecurring,
					slot.createdAt,
					slot.updatedAt
				]);
			}
			
			console.log(`✅ Created ${timeSlotData.length} time slots`);
		}

		// Create a sample booking for demonstration
		const [firstSlot] = timeSlotData;
		if (firstSlot) {
			const bookingReference = `ZAUR-${createId().substring(0, 8).toUpperCase()}`;
			const ticketQR = `TIX-${createId().substring(0, 10).toUpperCase()}`;
			
			const sampleBooking = {
				id: createId(),
				tourId: tourId,
				timeSlotId: firstSlot.id,
				source: 'tour_qr',
				sourceQrCode: qrCode,
				customerName: 'Sarah Johnson',
				customerEmail: 'sarah.demo@example.com',
				customerPhone: '+49 123 456 7890',
				participants: 2,
				totalAmount: '70.00',
				participantBreakdown: {
					adults: 2,
					children: 0
				},
				participantsByCategory: {
					'adult': 2
				},
				selectedAddons: [],
				priceBreakdown: {
					basePrice: 70,
					addonsTotal: 0,
					totalAmount: 70,
					categoryBreakdown: {
						'adult': {
							label: 'Adult',
							count: 2,
							pricePerPerson: 35,
							subtotal: 70
						}
					}
				},
				status: 'confirmed',
				paymentStatus: 'paid',
				bookingReference: bookingReference,
				ticketQRCode: ticketQR,
				specialRequests: 'This is a demo booking to showcase the system',
				checkedInAt: null,
				checkedInBy: null,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// Insert sample booking
			const insertBookingQuery = `
				INSERT INTO bookings (
					id, tour_id, time_slot_id, source, source_qr_code, customer_name,
					customer_email, customer_phone, participants, total_amount, participant_breakdown,
					participants_by_category, selected_addons, price_breakdown, status,
					payment_status, booking_reference, ticket_qr_code, special_requests,
					checked_in_at, checked_in_by, created_at, updated_at
				) VALUES (
					$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
					$15, $16, $17, $18, $19, $20, $21, $22, $23
				)
			`;
			
			await client.query(insertBookingQuery, [
				sampleBooking.id,
				sampleBooking.tourId,
				sampleBooking.timeSlotId,
				sampleBooking.source,
				sampleBooking.sourceQrCode,
				sampleBooking.customerName,
				sampleBooking.customerEmail,
				sampleBooking.customerPhone,
				sampleBooking.participants,
				sampleBooking.totalAmount,
				JSON.stringify(sampleBooking.participantBreakdown),
				JSON.stringify(sampleBooking.participantsByCategory),
				JSON.stringify(sampleBooking.selectedAddons),
				JSON.stringify(sampleBooking.priceBreakdown),
				sampleBooking.status,
				sampleBooking.paymentStatus,
				sampleBooking.bookingReference,
				sampleBooking.ticketQRCode,
				sampleBooking.specialRequests,
				sampleBooking.checkedInAt,
				sampleBooking.checkedInBy,
				sampleBooking.createdAt,
				sampleBooking.updatedAt
			]);
			
			console.log(`✅ Created sample booking: ${bookingReference}`);
		}

		console.log('\n🎉 Demo tour setup complete!\n');
		console.log('📋 Next Steps:');
		console.log('   1. Visit the Tours page to see your demo tour');
		console.log('   2. Share the public booking link with customers');
		console.log('   3. Test the QR code scanning flow');
		console.log('   4. Demonstrate the booking management features\n');
		
	} catch (error) {
		console.error('❌ Error creating demo tour:', error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run the script
createDemoTour();

