#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OAuth table SQL
const OAUTH_TABLE_SQL = `
-- OAuth Tables Addition
-- Make hashedPassword nullable for OAuth users
ALTER TABLE users 
ALTER COLUMN hashed_password DROP NOT NULL;

-- Create OAuth accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_user 
ON oauth_accounts(provider, provider_user_id);
`;

function exportDatabaseStructure() {
  console.log('📦 Exporting Database Structure for Production');
  console.log('=============================================\n');

  try {
    // Step 1: Check for migration files
    console.log('📄 Step 1: Checking for migration files...');
    const migrationPattern = path.join(__dirname, '..', 'drizzle', 'migrations', '*.sql').replace(/\\/g, '/');
    const migrationFiles = glob.sync(migrationPattern);
    
    if (migrationFiles.length === 0) {
      console.error('❌ No migration files found!');
      console.log(`   Searched in: ${migrationPattern}`);
      console.log('   Run: pnpm db:generate');
      process.exit(1);
    }
    
    const latestMigration = migrationFiles[migrationFiles.length - 1];
    console.log(`✅ Found migration: ${path.basename(latestMigration)}`);
    
    // Step 2: Create export directory
    const exportDir = path.join(__dirname, '..', 'database-export');
    mkdirSync(exportDir, { recursive: true });
    console.log(`\n📁 Created export directory: ${exportDir}`);
    
    // Step 3: Read and combine migrations
    console.log('\n📋 Step 3: Preparing combined migration SQL...');
    let migrationSQL = readFileSync(latestMigration, 'utf8');
    
    // Add OAuth table to the migration
    const combinedSQL = migrationSQL + '\n\n' + OAUTH_TABLE_SQL;
    
    // Step 4: Write files
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Write combined file
    const combinedFile = path.join(exportDir, `zaur_complete_structure_${timestamp}.sql`);
    writeFileSync(combinedFile, combinedSQL);
    console.log(`✅ Written: ${path.basename(combinedFile)}`);
    
    // Write separate files for clarity
    const baseStructureFile = path.join(exportDir, `01_base_structure_${timestamp}.sql`);
    writeFileSync(baseStructureFile, migrationSQL);
    console.log(`✅ Written: ${path.basename(baseStructureFile)}`);
    
    const oauthFile = path.join(exportDir, `02_oauth_tables_${timestamp}.sql`);
    writeFileSync(oauthFile, OAUTH_TABLE_SQL);
    console.log(`✅ Written: ${path.basename(oauthFile)}`);
    
    // Step 5: Create deployment instructions
    const instructions = `Database Structure Deployment Instructions
==========================================

Generated on: ${new Date().toISOString()}

Production Configuration:
- VPS Host: 38.242.141.113
- Docker Container: 9508f2d239e4
- Database User: nom
- Database Name: postgres

Files Generated:
1. zaur_complete_structure_${timestamp}.sql - Complete database structure (all-in-one)
2. 01_base_structure_${timestamp}.sql - Base tables and relationships
3. 02_oauth_tables_${timestamp}.sql - OAuth authentication tables

Deployment Options:
==================

Option 1: Automated Deployment (Recommended)
--------------------------------------------
Run: node scripts/deploy-database-structure.js

Option 2: Manual Deployment via SSH
-----------------------------------
1. Upload the SQL file to VPS:
   scp ${path.basename(combinedFile)} root@38.242.141.113:/tmp/

2. Execute the migration:
   ssh root@38.242.141.113 "docker exec -i 9508f2d239e4 psql -U nom -d postgres < /tmp/${path.basename(combinedFile)}"

3. Verify tables were created:
   ssh root@38.242.141.113 "docker exec -i 9508f2d239e4 psql -U nom -d postgres -c '\\dt'"

4. Clean up:
   ssh root@38.242.141.113 "rm /tmp/${path.basename(combinedFile)}"

Option 3: Manual Deployment via Database Client
----------------------------------------------
1. Connect to your production database using a PostgreSQL client
2. Execute the SQL from zaur_complete_structure_${timestamp}.sql
3. Verify all tables were created successfully

Expected Tables After Deployment:
================================
- users (with nullable hashed_password for OAuth)
- tours
- time_slots
- bookings
- payments
- qr_codes
- sessions
- oauth_accounts (new)

Post-Deployment Checklist:
=========================
[ ] All tables created successfully
[ ] Foreign key constraints are in place
[ ] Indexes are created
[ ] OAuth tables are present
[ ] Application can connect to database
[ ] Test user registration/login
[ ] Test OAuth login flow

Rollback Instructions:
=====================
If you need to rollback, you can drop all tables:
DROP TABLE IF EXISTS payments, bookings, qr_codes, time_slots, tours, sessions, oauth_accounts, users CASCADE;

Note: This will delete ALL data. Only use in emergencies or initial setup.
`;

    const instructionsFile = path.join(exportDir, 'DEPLOYMENT_INSTRUCTIONS.txt');
    writeFileSync(instructionsFile, instructions);
    console.log(`✅ Written: ${path.basename(instructionsFile)}`);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Database Structure Export Complete!');
    console.log('='.repeat(50));
    console.log(`\n📁 Files exported to: ${exportDir}`);
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated SQL files');
    console.log('2. Read DEPLOYMENT_INSTRUCTIONS.txt');
    console.log('3. Choose your deployment method');
    console.log('4. Deploy to production');
    
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run export
exportDatabaseStructure(); 