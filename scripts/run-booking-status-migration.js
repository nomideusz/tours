/**
 * Run Booking Status Migration (Phase 1)
 * Alternative to psql for environments without PostgreSQL client
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

async function runMigration() {
  console.log('🔄 Starting booking status migration...\n');

  // Get database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    // Read migration SQL file
    const migrationPath = join(__dirname, '..', 'migrations', '001_add_booking_status_enums.sql');
    console.log(`📖 Reading migration file: ${migrationPath}`);
    
    const sqlContent = readFileSync(migrationPath, 'utf-8');
    
    // Remove comments and psql-specific commands
    const cleanSql = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))  // Remove comments
      .filter(line => !line.trim().startsWith('\\'))   // Remove psql commands
      .join('\n');

    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    try {
      // Run migration
      console.log('🚀 Running migration SQL...\n');
      
      const result = await client.query(cleanSql);
      
      console.log('✅ Migration completed successfully!\n');

      // Verify migration
      console.log('🔍 Verifying migration...\n');
      
      const verification = await client.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(*) FILTER (WHERE refund_status_new IS NOT NULL) as with_refund_enum,
          COUNT(*) FILTER (WHERE transfer_status_new IS NOT NULL) as with_transfer_enum
        FROM bookings;
      `);

      const stats = verification.rows[0];
      console.log('📊 Migration Statistics:');
      console.log(`   Total bookings: ${stats.total_bookings}`);
      console.log(`   With refund enum: ${stats.with_refund_enum}`);
      console.log(`   With transfer enum: ${stats.with_transfer_enum}`);
      
      if (stats.total_bookings === stats.with_refund_enum && stats.total_bookings === stats.with_transfer_enum) {
        console.log('\n✅ All bookings migrated successfully!');
      } else {
        console.warn('\n⚠️  Warning: Some bookings may not have new enum values');
      }

      // Check for mismatches
      const mismatchCheck = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE refund_status IS DISTINCT FROM refund_status_new::text) as refund_mismatches,
          COUNT(*) FILTER (WHERE transfer_status IS DISTINCT FROM transfer_status_new::text) as transfer_mismatches
        FROM bookings;
      `);

      const mismatches = mismatchCheck.rows[0];
      console.log('\n🔄 Sync Status:');
      console.log(`   Refund mismatches: ${mismatches.refund_mismatches}`);
      console.log(`   Transfer mismatches: ${mismatches.transfer_mismatches}`);
      
      if (mismatches.refund_mismatches === '0' && mismatches.transfer_mismatches === '0') {
        console.log('\n✅ All columns in perfect sync!');
      } else {
        console.warn('\n⚠️  Found mismatches - trigger may need time to sync');
      }

      // Show enum distribution
      console.log('\n📊 Refund Status Distribution:');
      const refundDist = await client.query(`
        SELECT refund_status_new, COUNT(*) as count
        FROM bookings
        GROUP BY refund_status_new
        ORDER BY count DESC;
      `);
      refundDist.rows.forEach(row => {
        console.log(`   ${row.refund_status_new}: ${row.count}`);
      });

      console.log('\n📊 Transfer Status Distribution:');
      const transferDist = await client.query(`
        SELECT transfer_status_new, COUNT(*) as count
        FROM bookings
        GROUP BY transfer_status_new
        ORDER BY count DESC;
      `);
      transferDist.rows.forEach(row => {
        console.log(`   ${row.transfer_status_new}: ${row.count}`);
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n✨ Migration script complete!');
  console.log('\nNext steps:');
  console.log('1. Uncomment new columns in src/lib/db/schema/drizzle.ts');
  console.log('2. Uncomment dual writes in backend files (search for TODO)');
  console.log('3. Run: pnpm run build');
  console.log('4. Deploy: pm2 restart zaur-app');
}

runMigration();

