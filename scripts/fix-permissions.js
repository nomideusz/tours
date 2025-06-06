import pkg from 'pg';
const { Client } = pkg;

const PASSWORD = process.env.LOCAL_PG_PASSWORD || 'postgres';

async function fixPermissions() {
  console.log('🔐 Fixing database permissions...\n');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: PASSWORD,
    database: 'zaur_local'
  });

  try {
    await client.connect();
    console.log('✅ Connected as postgres superuser');

    // Grant all privileges on existing tables
    console.log('🔑 Granting table privileges...');
    await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zaur_dev;');
    
    // Grant all privileges on existing sequences
    console.log('🔑 Granting sequence privileges...');
    await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zaur_dev;');
    
    // Grant usage and create on schema
    console.log('🔑 Granting schema privileges...');
    await client.query('GRANT USAGE, CREATE ON SCHEMA public TO zaur_dev;');
    
    // Set default privileges for future tables
    console.log('🔑 Setting default privileges...');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zaur_dev;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zaur_dev;');
    
    // Make zaur_dev owner of all tables for full access
    console.log('🔑 Setting table ownership...');
    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    
    for (const row of tables.rows) {
      const tableName = row.tablename;
      await client.query(`ALTER TABLE public.${tableName} OWNER TO zaur_dev;`);
      console.log(`   ✓ ${tableName} ownership transferred`);
    }
    
    console.log('\n✅ Permissions fixed successfully!');
    console.log('🎉 zaur_dev now has full access to all tables');
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error.message);
    console.error('\n💡 Make sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. You have the correct postgres password');
    console.error('3. Run with: LOCAL_PG_PASSWORD=yourpassword node scripts/fix-permissions.js');
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixPermissions(); 