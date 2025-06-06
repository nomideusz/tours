import { db, client } from '../src/lib/db/connection.js';
import { sql } from 'drizzle-orm';

// Set environment variables based on your drizzle config
process.env.DATABASE_URL = 'postgresql://zaur_dev:zaur_dev_password@localhost:5432/zaur_local';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USER = 'zaur_dev';
process.env.DATABASE_PASSWORD = 'zaur_dev_password';
process.env.DATABASE_NAME = 'zaur_local';
process.env.DATABASE_SSL = 'false';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection with credentials:');
    console.log(`   Host: ${process.env.DATABASE_HOST}`);
    console.log(`   Port: ${process.env.DATABASE_PORT}`);
    console.log(`   User: ${process.env.DATABASE_USER}`);
    console.log(`   Database: ${process.env.DATABASE_NAME}`);
    console.log(`   SSL: ${process.env.DATABASE_SSL}`);
    
    // Simple query to test connection using sql`` syntax
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('\n✅ Database connection successful!');
    console.log('Current time from DB:', result[0]?.current_time);
    
    // Test if tables exist
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    if (tablesResult.length === 0) {
      console.log('   No tables found. You may need to run migrations first.');
    } else {
      tablesResult.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    console.log(`\n📈 Found ${tablesResult.length} tables`);
    
    // Close the connection
    await client.end();
    console.log('\n✨ Test completed successfully!');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Add these environment variables to your .env file:');
    console.log('   DATABASE_HOST=localhost');
    console.log('   DATABASE_PORT=5432');
    console.log('   DATABASE_USER=zaur_dev');
    console.log('   DATABASE_PASSWORD=zaur_dev_password');
    console.log('   DATABASE_NAME=zaur_local');
    console.log('   DATABASE_SSL=false');
    console.log('2. Run: pnpm drizzle-kit migrate (if tables not found)');
    console.log('3. Run: pnpm tsx scripts/migrate-from-pocketbase.js');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check if database "zaur_local" exists');
    console.error('3. Verify user "zaur_dev" has proper permissions');
    console.error('4. Check if password is correct');
    
    process.exit(1);
  }
}

testConnection(); 