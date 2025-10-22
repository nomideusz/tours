/**
 * Fix status sync mismatches
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function fixSync() {
  console.log('🔧 Fixing status sync mismatches...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  try {
    // Run the fix
    await client.query(`
      UPDATE bookings 
      SET refund_status_new = 
        CASE
          WHEN refund_status IS NULL THEN 'not_required'::refund_status_enum
          WHEN refund_status ILIKE 'succeeded' THEN 'succeeded'::refund_status_enum
          WHEN refund_status ILIKE 'success' THEN 'succeeded'::refund_status_enum
          WHEN refund_status ILIKE 'failed' THEN 'failed'::refund_status_enum
          WHEN refund_status ILIKE 'pending' THEN 'pending'::refund_status_enum
          ELSE 'not_required'::refund_status_enum
        END;

      UPDATE bookings 
      SET transfer_status_new = 
        CASE
          WHEN transfer_status IS NULL THEN 'pending'::transfer_status_enum
          WHEN transfer_status ILIKE 'completed' THEN 'completed'::transfer_status_enum
          WHEN transfer_status ILIKE 'complete' THEN 'completed'::transfer_status_enum
          WHEN transfer_status ILIKE 'succeeded' THEN 'completed'::transfer_status_enum
          WHEN transfer_status ILIKE 'failed' THEN 'failed'::transfer_status_enum
          WHEN transfer_status ILIKE 'reversed' THEN 'reversed'::transfer_status_enum
          ELSE 'pending'::transfer_status_enum
        END;
    `);

    console.log('✅ Sync fixed!\n');

    // Verify
    const check = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE refund_status IS DISTINCT FROM refund_status_new::text) as refund_mismatches,
        COUNT(*) FILTER (WHERE transfer_status IS DISTINCT FROM transfer_status_new::text) as transfer_mismatches
      FROM bookings;
    `);

    const result = check.rows[0];
    console.log('📊 Mismatch Status:');
    console.log(`   Refund mismatches: ${result.refund_mismatches}`);
    console.log(`   Transfer mismatches: ${result.transfer_mismatches}`);

    if (result.refund_mismatches === '0' && result.transfer_mismatches === '0') {
      console.log('\n✅ All synced perfectly!');
    } else {
      console.log('\n⚠️  Still have mismatches - check data manually');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

fixSync();

