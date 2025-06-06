import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

// Local PostgreSQL configuration
const LOCAL_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',  // Default PostgreSQL superuser
  password: process.env.LOCAL_PG_PASSWORD || 'postgres',  // You'll need to set this
  database: 'postgres'  // Connect to default database first
};

const NEW_DB_NAME = 'zaur_local';
const NEW_USER = 'zaur_dev';
const NEW_PASSWORD = 'zaur_dev_password';

async function setupLocalDatabase() {
  console.log('🚀 Setting up local PostgreSQL database for development...\n');
  
  const client = new Client(LOCAL_DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create or recreate database
    console.log(`\n📦 Creating database: ${NEW_DB_NAME}`);
    
    // Force disconnect all connections to the database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${NEW_DB_NAME}'
        AND pid <> pg_backend_pid();
    `);
    
    await client.query(`DROP DATABASE IF EXISTS ${NEW_DB_NAME}`);
    await client.query(`CREATE DATABASE ${NEW_DB_NAME}`);
    console.log('✅ Database created');
    
    // Create user and grant privileges
    console.log('\n🔐 Creating user: zaur_dev');
    await client.query(`DROP USER IF EXISTS ${NEW_USER}`);
    await client.query(`CREATE USER ${NEW_USER} WITH PASSWORD '${NEW_PASSWORD}'`);
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${NEW_DB_NAME} TO ${NEW_USER}`);
    console.log('✅ User created and granted privileges');
    
    await client.end();
    
    // Connect to the new database
    const newDbClient = new Client({
      ...LOCAL_DB_CONFIG,
      database: NEW_DB_NAME,
      user: NEW_USER,
      password: NEW_PASSWORD
    });
    
    await newDbClient.connect();
    console.log(`\n✅ Connected to new database: ${NEW_DB_NAME}`);
    
    // Grant schema privileges
    console.log('\n🔐 Granting schema privileges...');
    await newDbClient.query(`GRANT USAGE ON SCHEMA public TO ${NEW_USER};`);
    await newDbClient.query(`GRANT CREATE ON SCHEMA public TO ${NEW_USER};`);
    await newDbClient.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO ${NEW_USER};`);
    await newDbClient.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${NEW_USER};`);
    await newDbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${NEW_USER};`);
    await newDbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${NEW_USER};`);
    console.log('✅ Schema privileges granted');
    
    // Run migrations
    console.log('\n🔨 Running migrations...');
    const migrationPath = join(__dirname, '..', 'drizzle', '0000_initial_migration.sql');
    
    try {
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      await newDbClient.query(migrationSQL);
      console.log('✅ Migrations completed');
    } catch (error) {
      console.log('⚠️  No migration file found or migration failed');
      console.log('   You may need to run: npm run db:generate && npm run db:push');
    }
    
    await newDbClient.end();
    
    // Print connection details
    console.log('\n🎉 Local database setup complete!\n');
    console.log('📝 Add these to your .env.local file:');
    console.log('----------------------------------------');
    console.log(`DATABASE_HOST=localhost`);
    console.log(`DATABASE_PORT=5432`);
    console.log(`DATABASE_USER=${NEW_USER}`);
    console.log(`DATABASE_PASSWORD=${NEW_PASSWORD}`);
    console.log(`DATABASE_NAME=${NEW_DB_NAME}`);
    console.log(`DATABASE_URL=postgresql://${NEW_USER}:${NEW_PASSWORD}@localhost:5432/${NEW_DB_NAME}`);
    console.log('----------------------------------------\n');
    
    console.log('🚀 Next steps:');
    console.log('1. Update your .env.local with the above values');
    console.log('2. Run: npm run db:push (if migrations failed)');
    console.log('3. Run: npm run db:seed (to seed sample data)');
    console.log('4. Start AdminJS: node src/admin/admin-sql.js');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check your postgres user password');
    console.log('3. Set LOCAL_PG_PASSWORD environment variable if needed');
    console.log('   Example: LOCAL_PG_PASSWORD=yourpassword node scripts/setup-local-db.js');
  }
}

setupLocalDatabase(); 