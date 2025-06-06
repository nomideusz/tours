import { db, client } from '../src/lib/db/connection.js';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Simple query to test connection using sql`` syntax
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connection successful!');
    console.log('Current time from DB:', result[0]?.current_time);
    
    // Test if tables exist
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    tablesResult.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log(`\n📈 Found ${tablesResult.length} tables`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Make sure PostgreSQL is running and environment variables are set correctly');
    process.exit(1);
  }
}

testConnection(); 