import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Reading migration file...');
    const migrationSQL = readFileSync('./database-migration-incremental.sql', 'utf8');
    
    console.log('Running migration...');
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const result = await client.query(`
      SELECT 
        EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'generate_tour_qr_code') as func_exists,
        EXISTS(SELECT 1 FROM pg_views WHERE viewname = 'analytics_summary') as view_exists,
        EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'auto_tour_qr_trigger') as trigger_exists
    `);
    
    console.log('Verification results:', result.rows[0]);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration(); 