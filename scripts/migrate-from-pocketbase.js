import PocketBase from 'pocketbase';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema/index.js';
import { hash } from 'argon2';
import { createId } from '@paralleldrive/cuid2';

// Database setup
const connectionString = 'postgresql://zaur_dev:zaur_dev_password@localhost:5432/zaur_local';
const client = postgres(connectionString, { max: 20 });
const db = drizzle(client, { schema });

// Configuration
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'https://z.xeon.pl';
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'nom@zaur.app';
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'Szczerzuj1a!';

// Hash password function
async function hashPassword(password) {
  return await hash(password);
}

async function migrateData() {
  console.log('🚀 Starting PocketBase to PostgreSQL migration...');
  
  // Initialize PocketBase client
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Authenticate as admin
    await pb.collection('_superusers').authWithPassword(
      POCKETBASE_ADMIN_EMAIL,
      POCKETBASE_ADMIN_PASSWORD
    );
    
    console.log('✅ Connected to PocketBase');
    
    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('\n🧹 Clearing existing data...');
    await db.execute(sql`TRUNCATE TABLE payments, bookings, qr_codes, time_slots, tours, sessions, users RESTART IDENTITY CASCADE`);
    console.log('✅ Database cleared');
    
    // 1. Migrate Users
    console.log('\n📥 Migrating users...');
    const pbUsers = await pb.collection('users').getFullList();
    const userIdMap = new Map(); // Map old IDs to new IDs
    
    for (const pbUser of pbUsers) {
      const newUserId = createId();
      userIdMap.set(pbUser.id, newUserId);
      
      await db.insert(schema.users).values({
        id: newUserId,
        email: pbUser.email,
        hashedPassword: await hashPassword(pbUser.email), // Temporary password, users will need to reset
        name: pbUser.name || pbUser.email.split('@')[0],
        businessName: pbUser.businessName || null,
        stripeAccountId: pbUser.stripeAccountId || null,
        avatar: pbUser.avatar ? `${POCKETBASE_URL}/api/files/users/${pbUser.id}/${pbUser.avatar}` : null,
        role: pbUser.role || 'user',
        intendedRole: pbUser.intendedRole || null,
        phone: pbUser.phone || null,
        website: pbUser.website || null,
        description: pbUser.description || null,
        location: pbUser.location || null,
        emailVerified: pbUser.verified || false,
        lastLogin: pbUser.lastLogin ? new Date(pbUser.lastLogin) : null,
        createdAt: new Date(pbUser.created),
        updatedAt: new Date(pbUser.updated)
      });
    }
    console.log(`✅ Migrated ${pbUsers.length} users`);
    
    // 2. Migrate Tours
    console.log('\n📥 Migrating tours...');
    const pbTours = await pb.collection('tours').getFullList();
    const tourIdMap = new Map();
    let toursSkipped = 0;
    let toursMigrated = 0;
    
    for (const pbTour of pbTours) {
      const newTourId = createId();
      tourIdMap.set(pbTour.id, newTourId);
      
      // Validate required fields
      if (!pbTour.user) {
        console.warn(`⚠️  Tour "${pbTour.name || pbTour.id}" has no user, skipping...`);
        toursSkipped++;
        continue;
      }
      
      await db.insert(schema.tours).values({
        id: newTourId,
        userId: userIdMap.get(pbTour.user) || pbTour.user,
        name: pbTour.name || `Untitled Tour ${newTourId.slice(-8)}`,
        description: pbTour.description || 'No description provided',
        location: pbTour.location || 'Location TBD',
        duration: Math.round(pbTour.duration) || 60, // Round to integer, default 1 hour
        price: (pbTour.price || 0).toString(),
        capacity: Math.round(pbTour.capacity) || 10, // Round to integer, default capacity
        category: pbTour.category || null,
        status: (pbTour.status === 'active') ? 'active' : 'draft', // Map inactive to draft
        images: pbTour.images?.map((img) => 
          `${POCKETBASE_URL}/api/files/tours/${pbTour.id}/${img}`
        ) || [],
        includedItems: pbTour.includedItems || [],
        requirements: pbTour.requirements || [],
        cancellationPolicy: pbTour.cancellationPolicy || null,
        createdAt: new Date(pbTour.created),
        updatedAt: new Date(pbTour.updated)
      });
      toursMigrated++;
    }
    console.log(`✅ Migrated ${toursMigrated} tours (${toursSkipped} skipped due to missing guide)`);
    
    // 3. Migrate Time Slots
    console.log('\n📥 Migrating time slots...');
    const pbTimeSlots = await pb.collection('time_slots').getFullList();
    const timeSlotIdMap = new Map();
    let timeSlotsSkipped = 0;
    let timeSlotsMigrated = 0;
    
    for (const pbSlot of pbTimeSlots) {
      const newSlotId = createId();
      timeSlotIdMap.set(pbSlot.id, newSlotId);
      
      // Validate required fields
      if (!pbSlot.tour || !tourIdMap.has(pbSlot.tour)) {
        console.warn(`⚠️  Time slot ${pbSlot.id} references non-existent tour ${pbSlot.tour}, skipping...`);
        timeSlotsSkipped++;
        continue;
      }
      
      const bookedSpots = parseInt(pbSlot.bookedSpots) || 0;
      const availableSpots = parseInt(pbSlot.availableSpots) || 10;
      
      await db.insert(schema.timeSlots).values({
        id: newSlotId,
        tourId: tourIdMap.get(pbSlot.tour),
        startTime: new Date(pbSlot.startTime),
        endTime: new Date(pbSlot.endTime),
        status: pbSlot.status || 'available',
        bookedSpots: bookedSpots,
        availableSpots: availableSpots,
        isRecurring: pbSlot.isRecurring || false,
        recurringPattern: pbSlot.recurringPattern || null,
        recurringEnd: pbSlot.recurringEndDate ? new Date(pbSlot.recurringEndDate) : null,
        createdAt: new Date(pbSlot.created),
        updatedAt: new Date(pbSlot.updated)
      });
      timeSlotsMigrated++;
    }
    console.log(`✅ Migrated ${timeSlotsMigrated} time slots (${timeSlotsSkipped} skipped due to invalid references)`);
    
    // 4. Migrate QR Codes first (before bookings that reference them)
    console.log('\n📥 Migrating QR codes...');
    const pbQRCodes = await pb.collection('qr_codes').getFullList();
    const qrCodeIdMap = new Map();
    
    for (const pbQR of pbQRCodes) {
      // Validate required fields
      if (!pbQR.tour || !tourIdMap.has(pbQR.tour)) {
        console.warn(`⚠️  QR Code ${pbQR.id} references non-existent tour, skipping...`);
        continue;
      }
      
      if (!pbQR.user || !userIdMap.has(pbQR.user)) {
        console.warn(`⚠️  QR Code ${pbQR.id} references non-existent user, skipping...`);
        continue;
      }
      
      const newQRId = createId();
      qrCodeIdMap.set(pbQR.id, newQRId);
      
      await db.insert(schema.qrCodes).values({
        id: newQRId,
        code: pbQR.code,
        tourId: tourIdMap.get(pbQR.tour),
        userId: userIdMap.get(pbQR.user),
        name: pbQR.name,
        category: pbQR.category || null,
        customization: pbQR.customization || {},
        scans: pbQR.scans || 0,
        conversions: pbQR.conversions || 0,
        isActive: pbQR.isActive !== false,
        createdAt: new Date(pbQR.created),
        updatedAt: new Date(pbQR.updated)
      });
    }
    console.log(`✅ Migrated ${pbQRCodes.length} QR codes`);
    
    // 5. Migrate Bookings
    console.log('\n📥 Migrating bookings...');
    const pbBookings = await pb.collection('bookings').getFullList();
    
    for (const pbBooking of pbBookings) {
      // Validate required fields
      if (!pbBooking.tour || !tourIdMap.has(pbBooking.tour)) {
        console.warn(`⚠️  Booking ${pbBooking.id} references non-existent tour, skipping...`);
        continue;
      }
      
      if (!pbBooking.timeSlot || !timeSlotIdMap.has(pbBooking.timeSlot)) {
        console.warn(`⚠️  Booking ${pbBooking.id} references non-existent time slot, skipping...`);
        continue;
      }
      
      await db.insert(schema.bookings).values({
        id: createId(),
        tourId: tourIdMap.get(pbBooking.tour) || pbBooking.tour,
        timeSlotId: timeSlotIdMap.get(pbBooking.timeSlot) || pbBooking.timeSlot,
        qrCodeId: pbBooking.qrCode ? (qrCodeIdMap.get(pbBooking.qrCode) || null) : null,
        customerName: pbBooking.customerName,
        customerEmail: pbBooking.customerEmail,
        customerPhone: pbBooking.customerPhone || null,
        participants: pbBooking.participants || pbBooking.numberOfPeople || 1,
        totalAmount: (pbBooking.totalAmount || pbBooking.totalPrice || 0).toString(),
        status: pbBooking.status || 'pending',
        paymentId: pbBooking.paymentId || null,
        paymentStatus: pbBooking.paymentStatus || 'pending',
        bookingReference: pbBooking.bookingReference || pbBooking.bookingCode || `BK-${createId().slice(-8)}`,
        specialRequests: pbBooking.notes || null,
        ticketQRCode: pbBooking.ticketQRCode || null,
        attendanceStatus: pbBooking.checkedIn ? 'checked_in' : 'not_arrived',
        checkedInAt: pbBooking.checkedInAt ? new Date(pbBooking.checkedInAt) : null,
        checkedInBy: pbBooking.checkedInBy ? (userIdMap.get(pbBooking.checkedInBy) || null) : null,
        createdAt: new Date(pbBooking.created),
        updatedAt: new Date(pbBooking.updated)
      });
    }
    console.log(`✅ Migrated ${pbBookings.length} bookings`);
    
    console.log('\n✨ Migration completed successfully!');
    console.log('\n⚠️  Important notes:');
    console.log('1. All users have been given a temporary password (their email address)');
    console.log('2. Users will need to reset their passwords');
    console.log('3. Image URLs still point to PocketBase - consider migrating to a CDN');
    console.log('4. Stripe payment records may need to be verified');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run migration
migrateData(); 