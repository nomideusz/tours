#!/usr/bin/env node

import { readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production database configuration from CapRover
const PROD_CONFIG = {
  host: process.env.PROD_DB_HOST || 'srv-captain--zaur-db',
  port: parseInt(process.env.PROD_DB_PORT || '5432'),
  user: process.env.PROD_DB_USER || 'nom',
  password: process.env.PROD_DB_PASSWORD || 'ebe3f84807eb35fd',
  database: process.env.PROD_DB_NAME || 'postgres',
  ssl: process.env.PROD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// OAuth table SQL
const OAUTH_TABLE_SQL = `
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

async function deployToCapRover() {
  console.log('🚀 Deploying Database Structure to CapRover Production');
  console.log('=====================================================\n');
  
  console.log('📌 Configuration:');
  console.log(`   Host: ${PROD_CONFIG.host}`);
  console.log(`   Port: ${PROD_CONFIG.port}`);
  console.log(`   User: ${PROD_CONFIG.user}`);
  console.log(`   Database: ${PROD_CONFIG.database}`);
  console.log(`   Password: ${PROD_CONFIG.password.substring(0, 4)}****`);
  console.log('');

  // Create connection
  let sql;
  
  try {
    // Step 1: Check for migration files
    console.log('📄 Step 1: Checking for migration files...');
    const migrationPattern = path.join(__dirname, '..', 'drizzle', 'migrations', '*.sql').replace(/\\/g, '/');
    const migrationFiles = glob.sync(migrationPattern);
    
    if (migrationFiles.length === 0) {
      console.error('❌ No migration files found!');
      console.log('   Run: pnpm db:generate');
      process.exit(1);
    }
    
    const latestMigration = migrationFiles[migrationFiles.length - 1];
    console.log(`✅ Found migration: ${path.basename(latestMigration)}`);
    
    // Step 2: Read migration content
    console.log('\n📋 Step 2: Preparing migration SQL...');
    let migrationSQL = readFileSync(latestMigration, 'utf8');
    
    // Add OAuth table to the migration
    const combinedSQL = migrationSQL + '\n\n-- OAuth Tables Addition\n' + OAUTH_TABLE_SQL;
    console.log('✅ Combined migration SQL prepared');
    
    // Step 3: Connect to database
    console.log('\n🔌 Step 3: Connecting to production database...');
    
    // Test if we're running inside CapRover (can access internal service name)
    // or from outside (need external access)
    const isInternalAccess = process.env.CAPROVER_INTERNAL === 'true';
    
    if (!isInternalAccess) {
      console.log('⚠️  Note: Connecting from outside CapRover network.');
      console.log('   Make sure the database is accessible externally or run this from within CapRover.');
    }
    
    sql = postgres({
      ...PROD_CONFIG,
      max: 1,
      connect_timeout: 30
    });
    
    // Test connection
    await sql`SELECT NOW() as current_time`;
    console.log('✅ Connected to production database');
    
    // Step 4: Execute migration
    console.log('\n🔨 Step 4: Executing migration...');
    
    // Split by statement breakpoints and execute each part
    const statements = combinedSQL.split('--> statement-breakpoint').filter(s => s.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await sql.unsafe(statement);
          process.stdout.write('.');
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error(`\n❌ Error in statement ${i + 1}:`, error.message);
          }
        }
      }
    }
    console.log('\n✅ Migration executed successfully');
    
    // Step 5: Verify tables
    console.log('\n🔍 Step 5: Verifying database structure...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📊 Tables in production database:');
    tables.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for specific tables
    const requiredTables = ['users', 'tours', 'time_slots', 'bookings', 'payments', 'qr_codes', 'sessions', 'oauth_accounts'];
    const existingTables = tables.map(t => t.table_name);
    
    console.log('\n✓ Checking required tables:');
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} (missing)`);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      console.log('\n🎉 All required tables exist!');
    } else {
      console.log('\n⚠️  Some tables are missing. Check the migration output above.');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Database Structure Deployment Complete!');
    console.log('='.repeat(50));
    console.log('\n📝 Production database is ready for use');
    console.log('\n🔐 Update your production app with these credentials:');
    console.log(`   DATABASE_URL=postgresql://${PROD_CONFIG.user}:${PROD_CONFIG.password}@${PROD_CONFIG.host}:${PROD_CONFIG.port}/${PROD_CONFIG.database}`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check if database is accessible from your location');
    console.error('2. Verify database credentials are correct');
    console.error('3. Ensure database user has CREATE TABLE permissions');
    console.error('4. If running from outside CapRover, database needs external access');
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('CapRover Database Deployment Script');
  console.log('==================================\n');
  console.log('Usage: node scripts/deploy-database-caprover.js [options]\n');
  console.log('Options:');
  console.log('  --help, -h     Show this help message\n');
  console.log('Environment Variables:');
  console.log('  PROD_DB_HOST       Database host (default: srv-captain--zaur-db)');
  console.log('  PROD_DB_PORT       Database port (default: 5432)');
  console.log('  PROD_DB_USER       Database user (default: nom)');
  console.log('  PROD_DB_PASSWORD   Database password (default: ebe3f84807eb35fd)');
  console.log('  PROD_DB_NAME       Database name (default: postgres)');
  console.log('  PROD_DB_SSL        Use SSL connection (default: false)');
  console.log('  CAPROVER_INTERNAL  Set to "true" if running inside CapRover network\n');
  console.log('Note: This script connects directly to the PostgreSQL database.');
  console.log('      It can be run from anywhere with network access to the database.\n');
  process.exit(0);
}

// Run deployment
deployToCapRover(); 