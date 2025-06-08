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

// Database configuration - use postgres superuser to add columns
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: 'zaur_local', // Target the database the app is using
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function addQrColumns() {
  console.log('➕ Adding QR Code Columns');
  console.log('=========================\n');
  
  console.log('📌 Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   Connecting as: ${dbConfig.user}`);
  console.log('');

  const client = new Client(dbConfig);

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the QR columns SQL file
    console.log('\n📄 Reading QR columns SQL...');
    const sqlFile = path.join(__dirname, 'add-qr-columns-simple.sql');
    const qrColumnsSQL = readFileSync(sqlFile, 'utf8');
    console.log('✅ SQL loaded');

    // Execute the QR columns SQL
    console.log('\n🔨 Adding QR code columns...');
    const result = await client.query(qrColumnsSQL);
    console.log('✅ QR columns added successfully');

    console.log('\n🎉 Success! QR code columns have been added to zaur_local database.');
    console.log('🚀 Registration should now work!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
addQrColumns(); 