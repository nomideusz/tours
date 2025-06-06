import postgres from 'postgres';

async function testDirectConnection() {
  const connectionString = 'postgresql://zaur_dev:zaur_dev_password@localhost:5432/zaur_local';
  
  console.log('🔍 Testing direct database connection...');
  console.log('Connection string:', connectionString.replace(/:[^:@]*@/, ':***@'));
  
  let client;
  try {
    // Create PostgreSQL connection
    client = postgres(connectionString, {
      max: 1,
      connect_timeout: 10,
      ssl: false,
    });

    // Test connection
    const result = await client`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current time from DB:', result[0]?.current_time);
    
    // Test if tables exist
    const tablesResult = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n📊 Tables in database:');
    if (tablesResult.length === 0) {
      console.log('   No tables found. You may need to run migrations first.');
    } else {
      tablesResult.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    console.log(`\n📈 Found ${tablesResult.length} tables`);
    
    if (tablesResult.length === 0) {
      console.log('\n🚀 Next steps:');
      console.log('1. Create your .env file with:');
      console.log('   DATABASE_URL=postgresql://zaur_dev:zaur_dev_password@localhost:5432/zaur_local');
      console.log('2. Run: pnpm drizzle-kit push:pg');
      console.log('   OR: pnpm drizzle-kit migrate');
      console.log('3. Then run the migration script');
    } else {
      console.log('\n✨ Database is ready! You can run the migration script now.');
    }
    
  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    console.error('\n🔧 Possible issues:');
    console.error('1. PostgreSQL server is not running');
    console.error('2. Database "zaur_local" does not exist');
    console.error('3. User "zaur_dev" does not exist or wrong password');
    console.error('4. User lacks permissions to access the database');
    
    console.error('\n💡 To fix:');
    console.error('1. Start PostgreSQL service');
    console.error('2. Create database and user:');
    console.error('   psql -U postgres');
    console.error('   CREATE DATABASE zaur_local;');
    console.error('   CREATE USER zaur_dev WITH PASSWORD \'zaur_dev_password\';');
    console.error('   GRANT ALL PRIVILEGES ON DATABASE zaur_local TO zaur_dev;');
    console.error('   \\q');
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}

testDirectConnection(); 