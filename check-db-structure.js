import { db } from './src/lib/db/connection.ts';
import { sql } from 'drizzle-orm';

async function checkDatabaseStructure() {
  try {
    console.log('Checking bookings table structure...');
    
    // Check if bookings table exists and its columns
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Bookings table columns:');
    result.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if participant_breakdown column exists
    const participantBreakdownExists = result.some(row => row.column_name === 'participant_breakdown');
    console.log(`\nparticipant_breakdown column exists: ${participantBreakdownExists}`);
    
    // Check if qr_code_id column exists
    const qrCodeIdExists = result.some(row => row.column_name === 'qr_code_id');
    console.log(`qr_code_id column exists: ${qrCodeIdExists}`);
    
    // Check if qr_codes table exists
    const qrCodesTableResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'qr_codes';
    `);
    
    console.log(`qr_codes table exists: ${qrCodesTableResult.length > 0}`);
    
  } catch (error) {
    console.error('Error checking database structure:', error);
  }
  
  process.exit(0);
}

checkDatabaseStructure(); 