#!/usr/bin/env node

import { readFileSync } from 'fs';
import { glob } from 'glob';

console.log('🚀 Manual Migration Helper\n');

// Find the latest migration file
const migrationFiles = glob.sync('drizzle/migrations/*.sql');
if (migrationFiles.length === 0) {
  console.error('❌ No migration files found. Run: pnpm db:generate first');
  process.exit(1);
}

const latestMigration = migrationFiles[migrationFiles.length - 1];
console.log('📄 Found migration:', latestMigration);

// Create copy command
console.log('\n📋 Step 1: Copy and paste this command to upload the migration file:');
console.log('----------------------------------------');
console.log(`type "${latestMigration.replace(/\//g, '\\')}" | ssh root@38.242.141.113 "cat > /tmp/migration.sql"`);
console.log('----------------------------------------');

console.log('\n📋 Step 2: After uploading, run this command to execute the migration:');
console.log('----------------------------------------');
console.log(`ssh root@38.242.141.113 "docker exec -i 9508f2d239e4 psql -U nom -d postgres < /tmp/migration.sql"`);
console.log('----------------------------------------');

console.log('\n📋 Step 3: Check if tables were created:');
console.log('----------------------------------------');
console.log(`ssh root@38.242.141.113 "docker exec -i 9508f2d239e4 psql -U nom -d postgres -c '\\dt'"`);
console.log('----------------------------------------');

console.log('\n📋 Step 4: Clean up the temp file:');
console.log('----------------------------------------');
console.log(`ssh root@38.242.141.113 "rm /tmp/migration.sql"`);
console.log('----------------------------------------');

console.log('\n💡 Tip: Consider setting up SSH keys to avoid password prompts:');
console.log('   ssh-copy-id root@38.242.141.113'); 