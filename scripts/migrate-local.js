import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🚀 Running migrations on local PostgreSQL...\n');
  
  // Use postgres superuser for migrations
  const connectionString = `postgresql://postgres:${process.env.LOCAL_PG_PASSWORD || 'postgres'}@localhost:5432/zaur_local`;
  
  console.log('📌 Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));
  
  const sql = postgres(connectionString, {
    max: 1,
    onnotice: () => {} // Suppress notices
  });
  
  const db = drizzle(sql);
  
  try {
    console.log('🔨 Running migrations...');
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, '..', 'drizzle', 'migrations') 
    });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
  
  console.log('\n🎉 Local database is ready!');
  console.log('You can now run: pnpm run admin:local');
}

runMigrations().catch(console.error); 