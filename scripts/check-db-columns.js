import { db } from '../src/lib/db/connection.ts';
import { sql } from 'drizzle-orm';

try {
  console.log('🔍 Checking database columns...');
  
  // Check what database we're connected to
  const dbName = await db.execute(sql`SELECT current_database() as db_name`);
  console.log('Connected to database:', dbName[0].db_name);
  
  // Check columns in users table
  const result = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'public' 
    ORDER BY column_name
  `);
  
  console.log('\n📊 Columns in users table:');
  if (result.length === 0) {
    console.log('   No columns found - table may not exist');
  } else {
    result.forEach(row => console.log('  -', row.column_name));
  }
  
  // Check if main_qr_code exists
  const hasMainQr = result.some(row => row.column_name === 'main_qr_code');
  console.log(`\n🎯 main_qr_code column exists: ${hasMainQr ? '✅ YES' : '❌ NO'}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} 