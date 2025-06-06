#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';

const execAsync = promisify(exec);

console.log('🚀 Running migration (simple approach)...\n');

async function runMigration() {
  try {
    // Find the latest migration file
    const migrationFiles = glob.sync('drizzle/migrations/*.sql');
    if (migrationFiles.length === 0) {
      console.error('❌ No migration files found. Run: pnpm db:generate first');
      process.exit(1);
    }
    
    const latestMigration = migrationFiles[migrationFiles.length - 1];
    console.log('📄 Found migration:', latestMigration);
    
    // Simple approach: cat the file and pipe through SSH
    const command = `cat "${latestMigration}" | ssh root@38.242.141.113 "docker exec -i 9508f2d239e4 psql -U nom -d postgres"`;
    
    console.log('🔄 Running migration...');
    console.log('📋 Command:', command);
    console.log('\n⏳ Enter SSH password when prompted...\n');
    
    const { stdout, stderr } = await execAsync(command, {
      stdio: 'inherit',
      maxBuffer: 1024 * 1024 * 10
    });
    
    if (stdout) console.log('✅ Output:', stdout);
    if (stderr && !stderr.includes('NOTICE')) console.warn('⚠️ Warnings:', stderr);
    
    console.log('\n✅ Migration completed!');
    
    // Check tables
    console.log('\n🧪 Checking tables...');
    const checkCommand = `ssh root@38.242.141.113 "docker exec -i 9508f2d239e4 psql -U nom -d postgres -c '\\dt'"`;
    const { stdout: tables } = await execAsync(checkCommand);
    console.log('📋 Tables:', tables);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration(); 