import { spawn } from 'child_process';

console.log('🚀 Starting Drizzle Studio for local development...\n');

// Set environment variables for local database
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USER = 'zaur_dev';
process.env.DATABASE_PASSWORD = 'zaur_dev_password';
process.env.DATABASE_NAME = 'zaur_local';

console.log('📌 Using local database: zaur_local');
console.log('📌 User: zaur_dev');
console.log('📌 Host: localhost:5432\n');

// Start Drizzle Studio
const studio = spawn('npx', ['drizzle-kit', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

studio.on('close', (code) => {
  console.log('\n📊 Drizzle Studio closed');
  process.exit(code);
});

studio.on('error', (error) => {
  console.error('❌ Error starting Drizzle Studio:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Drizzle Studio...');
  studio.kill('SIGINT');
});

console.log('✨ Drizzle Studio should open at: https://local.drizzle.studio');
console.log('⏳ Starting database admin interface...\n'); 