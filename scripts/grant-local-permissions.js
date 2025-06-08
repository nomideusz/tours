#!/usr/bin/env node

import { readFileSync } from 'fs';
import pg from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const { Client } = pg;

// Database configuration - use postgres superuser for granting permissions
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: 'postgres', // Use postgres superuser to grant permissions
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'zaur_db_local',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function grantPermissions() {
  console.log('🔐 Granting Database Permissions');
  console.log('================================\n');
  
  console.log('📌 Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   Connecting as: ${dbConfig.user}`);
  console.log(`   Granting permissions to: zaur_dev`);
  console.log('');

  const client = new Client(dbConfig);

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the permissions SQL file
    console.log('\n📄 Reading permissions SQL...');
    const sqlFile = path.join(__dirname, 'grant-permissions.sql');
    const permissionsSQL = readFileSync(sqlFile, 'utf8');
    console.log('✅ SQL loaded');

    // Execute the permissions SQL
    console.log('\n🔨 Executing permissions grant...');
    const result = await client.query(permissionsSQL);
    console.log('✅ Permissions granted successfully');

    // Show the results if there are any
    if (result.rows && result.rows.length > 0) {
      console.log('\n📊 Current table permissions:');
      console.table(result.rows);
    }

    console.log('\n🎉 Success! zaur_dev user now has permissions to access all tables.');
    console.log('🚀 You can now run: pnpm db:studio');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check if the database exists');
      console.error('3. Verify connection settings in .env');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed:');
      console.error('1. Check postgres user password');
      console.error('2. Try: POSTGRES_PASSWORD=your_postgres_password node scripts/grant-local-permissions.js');
    } else if (error.code === '42P01') {
      console.error('\n💡 Table does not exist:');
      console.error('1. Run database migrations first: pnpm db:push');
      console.error('2. Make sure tables are created before granting permissions');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Show help
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Local Database Permissions Script');
  console.log('=================================\n');
  console.log('This script grants necessary permissions to zaur_dev user for Drizzle Studio access.\n');
  console.log('Usage: node scripts/grant-local-permissions.js\n');
  console.log('Environment Variables:');
  console.log('  DATABASE_HOST      Database host (default: localhost)');
  console.log('  DATABASE_PORT      Database port (default: 5432)');
  console.log('  DATABASE_NAME      Database name (default: zaur_db_local)');
  console.log('  POSTGRES_PASSWORD  PostgreSQL superuser password (default: postgres)\n');
  console.log('Examples:');
  console.log('  node scripts/grant-local-permissions.js');
  console.log('  POSTGRES_PASSWORD=mypassword node scripts/grant-local-permissions.js\n');
  process.exit(0);
}

// Run the script
grantPermissions(); 