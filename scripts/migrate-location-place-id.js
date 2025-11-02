#!/usr/bin/env node

/**
 * Migration script: Add location_place_id to tours table
 * Runs directly via Node.js using pg library
 */

import { config } from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

// Load environment variables
config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function runMigration() {
  console.log('🔧 Running migration: Add location_place_id to tours table');
  console.log('');

  // Check for DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL not found in environment');
    console.error('Please set DATABASE_URL in your .env file');
    process.exit(1);
  }

  console.log('✅ Database connection found');
  console.log('');

  // Create database client
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');
    console.log('');

    // Read migration SQL
    const sqlFile = join(projectRoot, 'drizzle', 'migrations', '0034_add_location_place_id.sql');
    const sql = readFileSync(sqlFile, 'utf8');

    // Execute migration
    console.log('📝 Executing SQL migration...');
    await client.query(sql);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your dev server: npm run dev');
    console.log('2. Test by creating a new tour with a Places API location');
    console.log('3. Verify location_place_id is saved in the database');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:');
    console.error(error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

