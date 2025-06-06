import PocketBase from 'pocketbase';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema/index.js';
import { createId } from '@paralleldrive/cuid2';
import { config } from 'dotenv';

// Load environment variables
config();

// Database setup
const connectionString = 'postgresql://zaur_dev:zaur_dev_password@localhost:5432/zaur_local';
const client = postgres(connectionString, { max: 20 });
const db = drizzle(client, { schema });

// Configuration
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'https://z.xeon.pl';
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'nom@zaur.app';
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'Szczerzuj1a!';

async function migratePayments() {
  console.log('💳 Starting payments migration from PocketBase to PostgreSQL...');
  
  // Initialize PocketBase client
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Authenticate as admin
    await pb.collection('_superusers').authWithPassword(
      POCKETBASE_ADMIN_EMAIL,
      POCKETBASE_ADMIN_PASSWORD
    );
    
    console.log('✅ Connected to PocketBase');
    
    // Clear existing payments data
    console.log('\n🧹 Clearing existing payments data...');
    await db.execute(sql`TRUNCATE TABLE payments RESTART IDENTITY CASCADE`);
    console.log('✅ Payments table cleared');
    
    // Get bookings mapping using booking reference (more reliable)
    console.log('\n📋 Building booking ID mappings by booking reference...');
    const postgresBookings = await db.select({ 
      id: schema.bookings.id, 
      bookingReference: schema.bookings.bookingReference 
    }).from(schema.bookings);
    
    const pbBookings = await pb.collection('bookings').getFullList({ 
      fields: 'id,bookingReference,bookingCode',
      expand: 'booking' 
    });
    
    // Create mapping based on booking reference
    const bookingIdMap = new Map();
    
    for (const pbBooking of pbBookings) {
      const reference = pbBooking.bookingReference || pbBooking.bookingCode;
      if (reference) {
        const matchingPostgresBooking = postgresBookings.find(
          pgBooking => pgBooking.bookingReference === reference
        );
        if (matchingPostgresBooking) {
          bookingIdMap.set(pbBooking.id, matchingPostgresBooking.id);
        }
      }
    }
    
    console.log(`📊 Built mapping for ${bookingIdMap.size} bookings`);
    
    // Migrate Payments
    console.log('\n📥 Migrating payments...');
    const pbPayments = await pb.collection('payments').getFullList({
      expand: 'booking'
    });
    let paymentsSkipped = 0;
    let paymentsMigrated = 0;
    
    for (const pbPayment of pbPayments) {
      // Validate required fields
      if (!pbPayment.booking) {
        console.warn(`⚠️  Payment ${pbPayment.id} has no booking reference, skipping...`);
        paymentsSkipped++;
        continue;
      }
      
      const bookingId = bookingIdMap.get(pbPayment.booking);
      if (!bookingId) {
        console.warn(`⚠️  Payment ${pbPayment.id} references booking ${pbPayment.booking} that couldn't be mapped, skipping...`);
        paymentsSkipped++;
        continue;
      }
      
      const newPaymentId = createId();
      
      // Map PocketBase payment status to PostgreSQL enum values
      let mappedStatus = pbPayment.status || 'pending';
      if (mappedStatus === 'succeeded') {
        mappedStatus = 'paid';
      } else if (!['pending', 'paid', 'failed', 'refunded'].includes(mappedStatus)) {
        console.warn(`Unknown payment status "${mappedStatus}", defaulting to "pending"`);
        mappedStatus = 'pending';
      }
      
      await db.insert(schema.payments).values({
        id: newPaymentId,
        bookingId: bookingId,
        stripePaymentIntentId: pbPayment.stripePaymentIntentId || `pi_migrated_${newPaymentId.slice(-8)}`,
        amount: (pbPayment.amount || 0).toString(),
        currency: pbPayment.currency || 'EUR',
        status: mappedStatus,
        refundAmount: pbPayment.refundAmount ? pbPayment.refundAmount.toString() : null,
        processingFee: (pbPayment.processingFee || 0).toString(),
        netAmount: (pbPayment.netAmount || pbPayment.amount || 0).toString(),
        createdAt: new Date(pbPayment.created),
        updatedAt: new Date(pbPayment.updated)
      });
      
      paymentsMigrated++;
      
      if (paymentsMigrated % 10 === 0) {
        console.log(`📥 Migrated ${paymentsMigrated} payments so far...`);
      }
    }
    
    console.log(`✅ Migrated ${paymentsMigrated} payments (${paymentsSkipped} skipped due to invalid references)`);
    
    // Verify migration
    const totalPayments = await db.select({ count: sql`count(*)` }).from(schema.payments);
    console.log(`\n📊 Total payments in PostgreSQL: ${totalPayments[0].count}`);
    
    // Show some sample data
    const samplePayments = await db.select().from(schema.payments).limit(3);
    console.log('\n📋 Sample migrated payments:');
    samplePayments.forEach(payment => {
      console.log(`  - Payment ${payment.id}: ${payment.amount} ${payment.currency} (${payment.status})`);
    });
    
    console.log('\n✨ Payments migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Payments migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run migration
migratePayments(); 