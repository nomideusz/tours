import { db } from '../src/lib/db/connection.js';
import { sql } from 'drizzle-orm';

async function testConnectionWithEnv() {
  console.log('🔍 Testing database connection through connection.ts...');
  
  try {
    // Test using the connection from our module
    const result = await db.execute(sql`SELECT NOW() as current_time, current_database() as db_name`);
    console.log('✅ Database connection through connection.ts successful!');
    console.log('Current time from DB:', result[0]?.current_time);
    console.log('Connected to database:', result[0]?.db_name);
    
    // Test a simple query to our migrated data
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log(`📊 Found ${userCount[0]?.count} users in the database`);
    
    const tourCount = await db.execute(sql`SELECT COUNT(*) as count FROM tours`);
    console.log(`🎯 Found ${tourCount[0]?.count} tours in the database`);
    
    console.log('\n✨ Connection module is working correctly!');
    console.log('The .env variables are now being loaded properly.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnectionWithEnv(); 