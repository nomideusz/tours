/**
 * Rollback booking status migration
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

async function rollback() {
  console.log('🔄 Rolling back booking status migration...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    const migrationPath = join(__dirname, '..', 'migrations', 'rollback_001.sql');
    const sqlContent = readFileSync(migrationPath, 'utf-8');
    
    const cleanSql = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .filter(line => !line.trim().startsWith('\\'))
      .join('\n');

    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    try {
      console.log('🚀 Running rollback...\n');
      
      await client.query(cleanSql);
      
      console.log('✅ Rollback completed successfully!\n');

      // Verify
      const check = await client.query(`
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = 'bookings' 
          AND column_name IN ('refund_status_new', 'transfer_status_new');
      `);

      if (check.rows.length === 0) {
        console.log('✅ New columns removed successfully');
        console.log('✅ System reverted to original state');
      } else {
        console.warn('⚠️  New columns still exist');
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n✨ Rollback complete!');
  console.log('\nRestart your application:');
  console.log('  pm2 restart zaur-app');
}

rollback();

