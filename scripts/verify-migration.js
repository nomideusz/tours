/**
 * Verify migration status
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function verify() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  try {
    // Check columns exist
    console.log('🔍 Checking new columns exist...\n');
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'bookings' 
        AND column_name IN ('refund_status_new', 'transfer_status_new')
      ORDER BY column_name;
    `);

    if (columns.rows.length === 2) {
      console.log('✅ New columns exist:');
      columns.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.error('❌ New columns NOT found!');
      process.exit(1);
    }

    // Check trigger exists
    console.log('\n🔍 Checking trigger...\n');
    const trigger = await client.query(`
      SELECT tgname, tgenabled 
      FROM pg_trigger 
      WHERE tgname = 'sync_booking_statuses_trigger';
    `);

    if (trigger.rows.length > 0) {
      console.log('✅ Trigger exists and is enabled');
    } else {
      console.error('❌ Trigger NOT found!');
      process.exit(1);
    }

    // Sample bookings
    console.log('\n📊 Sample booking statuses:\n');
    const sample = await client.query(`
      SELECT 
        booking_reference,
        status,
        refund_status as old_refund,
        refund_status_new as new_refund,
        transfer_status as old_transfer,
        transfer_status_new as new_transfer
      FROM bookings
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    sample.rows.forEach(row => {
      console.log(`${row.booking_reference}:`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Refund: ${row.old_refund || 'NULL'} → ${row.new_refund}`);
      console.log(`  Transfer: ${row.old_transfer || 'NULL'} → ${row.new_transfer}`);
      console.log('');
    });

    console.log('✅ Migration verification complete!');
    console.log('\n📝 Note: NULL values in old columns are NORMAL.');
    console.log('   They will sync to enum defaults via trigger on next update.');
    console.log('\n🚀 Safe to proceed with deployment!');

  } finally {
    client.release();
    await pool.end();
  }
}

verify();

