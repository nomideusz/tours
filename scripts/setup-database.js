#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Setting up PostgreSQL database for Zaur Tours...');

async function setupDatabase() {
  try {
    console.log('📋 Installing dependencies...');
    await execAsync('pnpm install');
    
    console.log('📊 Generating database migrations...');
    await execAsync('pnpm db:generate');
    
    console.log('🔄 Running migrations...');
    await execAsync('pnpm db:migrate');
    
    console.log('✅ Database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run data migration from PocketBase');
    console.log('2. Update authentication flows');
    console.log('3. Test the application');
    console.log('');
    console.log('Available commands:');
    console.log('- pnpm db:studio    # Open Drizzle Studio');
    console.log('- pnpm db:push      # Push schema changes');
    console.log('- pnpm db:generate  # Generate new migrations');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 