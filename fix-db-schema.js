import { db } from './src/lib/db/connection.js';
import { sql } from 'drizzle-orm';

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Checking database schema...');
    
    // Check if qr_code_id column exists in bookings table
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'qr_code_id'
    `);
    
    if (result.length > 0) {
      console.log('⚠️ Found qr_code_id column in bookings table, removing...');
      
      // Drop the foreign key constraint first
      try {
        await db.execute(sql`
          ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_qr_code_id_qr_codes_id_fk
        `);
        console.log('✅ Dropped foreign key constraint');
      } catch (error) {
        console.log('⚠️ Foreign key constraint may not exist:', error.message);
      }
      
      // Drop the column
      await db.execute(sql`
        ALTER TABLE bookings DROP COLUMN IF EXISTS qr_code_id
      `);
      console.log('✅ Dropped qr_code_id column');
    } else {
      console.log('✅ qr_code_id column does not exist, schema is clean');
    }
    
    // Check if qr_codes table exists and drop it if it does
    const qrCodesTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'qr_codes'
    `);
    
    if (qrCodesTable.length > 0) {
      console.log('⚠️ Found qr_codes table, dropping...');
      await db.execute(sql`DROP TABLE IF EXISTS qr_codes CASCADE`);
      console.log('✅ Dropped qr_codes table');
    }
    
    console.log('🎉 Database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
  }
}

fixDatabaseSchema(); 