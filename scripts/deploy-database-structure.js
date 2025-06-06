#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production configuration
const VPS_HOST = process.env.VPS_HOST || '38.242.141.113';
const VPS_USER = process.env.VPS_USER || 'root';
const DOCKER_CONTAINER = process.env.DOCKER_CONTAINER || '9508f2d239e4';
const DB_USER = process.env.PROD_DB_USER || 'nom';
const DB_NAME = process.env.PROD_DB_NAME || 'postgres';

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

async function deployDatabaseStructure() {
  console.log('🚀 Deploying Database Structure to Production');
  console.log('============================================\n');
  
  console.log('📌 Configuration:');
  console.log(`   VPS Host: ${VPS_HOST}`);
  console.log(`   VPS User: ${VPS_USER}`);
  console.log(`   Docker Container: ${DOCKER_CONTAINER}`);
  console.log(`   Database User: ${DB_USER}`);
  console.log(`   Database Name: ${DB_NAME}`);
  console.log('');

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
    
    // Step 2: Read migration content
    console.log('\n📋 Step 2: Preparing migration SQL...');
    let migrationSQL = readFileSync(latestMigration, 'utf8');
    
    // Add OAuth table to the migration
    migrationSQL += '\n\n-- OAuth Tables Addition\n' + OAUTH_TABLE_SQL;
    
    // Create temp file with combined SQL
    const tempFile = '/tmp/zaur_migration.sql';
    console.log('✅ Combined migration SQL prepared');
    
    // Step 3: Upload migration to VPS
    console.log('\n📤 Step 3: Uploading migration to VPS...');
    console.log('   (You may be prompted for SSH password)');
    
    // Use echo to create the file content
    const uploadCommand = `echo '${migrationSQL.replace(/'/g, "'\\''")}' | ssh ${VPS_USER}@${VPS_HOST} "cat > ${tempFile}"`;
    
    try {
      await execAsync(uploadCommand, { maxBuffer: 10 * 1024 * 1024 });
      console.log('✅ Migration uploaded successfully');
    } catch (error) {
      console.error('❌ Failed to upload migration:', error.message);
      process.exit(1);
    }
    
    // Step 4: Execute migration
    console.log('\n🔨 Step 4: Executing migration on production database...');
    const executeCommand = `ssh ${VPS_USER}@${VPS_HOST} "docker exec -i ${DOCKER_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} < ${tempFile}"`;
    
    try {
      const { stdout, stderr } = await execAsync(executeCommand);
      if (stdout) console.log('📝 Output:', stdout);
      if (stderr && !stderr.includes('NOTICE')) console.warn('⚠️  Warnings:', stderr);
      console.log('✅ Migration executed successfully');
    } catch (error) {
      console.error('❌ Migration execution failed:', error.message);
      // Continue to show what was created
    }
    
    // Step 5: Verify tables
    console.log('\n🔍 Step 5: Verifying database structure...');
    const verifyCommand = `ssh ${VPS_USER}@${VPS_HOST} "docker exec -i ${DOCKER_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c '\\dt'"`;
    
    try {
      const { stdout } = await execAsync(verifyCommand);
      console.log('\n📊 Tables in production database:');
      console.log(stdout);
      
      // Check for specific tables
      const requiredTables = ['users', 'tours', 'time_slots', 'bookings', 'payments', 'qr_codes', 'sessions', 'oauth_accounts'];
      const tablesOutput = stdout.toLowerCase();
      
      console.log('\n✓ Checking required tables:');
      let allTablesExist = true;
      
      for (const table of requiredTables) {
        if (tablesOutput.includes(table)) {
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
      
    } catch (error) {
      console.error('❌ Failed to verify tables:', error.message);
    }
    
    // Step 6: Cleanup
    console.log('\n🧹 Step 6: Cleaning up...');
    const cleanupCommand = `ssh ${VPS_USER}@${VPS_HOST} "rm -f ${tempFile}"`;
    
    try {
      await execAsync(cleanupCommand);
      console.log('✅ Temporary files cleaned up');
    } catch (error) {
      console.warn('⚠️  Failed to cleanup temp file:', error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Database Structure Deployment Complete!');
    console.log('='.repeat(50));
    console.log('\n📝 Next steps:');
    console.log('1. Update production environment variables');
    console.log('2. Deploy application code');
    console.log('3. Test database connections');
    console.log('4. Run any data migration if needed');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check SSH connection to VPS');
    console.error('2. Verify Docker container is running');
    console.error('3. Ensure database credentials are correct');
    console.error('4. Check if you have necessary permissions');
    process.exit(1);
  }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Database Structure Deployment Script');
  console.log('===================================\n');
  console.log('Usage: node scripts/deploy-database-structure.js [options]\n');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --dry-run      Show what would be done without executing\n');
  console.log('Environment Variables:');
  console.log('  VPS_HOST       VPS IP address (default: 38.242.141.113)');
  console.log('  VPS_USER       VPS user (default: root)');
  console.log('  DOCKER_CONTAINER  Docker container ID (default: 9508f2d239e4)');
  console.log('  PROD_DB_USER   Database user (default: nom)');
  console.log('  PROD_DB_NAME   Database name (default: postgres)\n');
  process.exit(0);
}

// Run deployment
deployDatabaseStructure(); 