import { db } from '../src/lib/db/connection.js';
import { sql } from 'drizzle-orm';

async function addCountryField() {
  try {
    console.log('Adding country field to users table if it doesn\'t exist...');
    
    // SQL to add the country field if it doesn't exist
    const query = sql`
      DO $$ 
      BEGIN
        -- Check if the column exists
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'country'
        ) THEN
          -- Add the column if it doesn't exist
          ALTER TABLE "users" ADD COLUMN "country" text;
          RAISE NOTICE 'Added country column to users table';
        ELSE
          RAISE NOTICE 'Country column already exists in users table';
        END IF;
      END $$;
    `;
    
    await db.execute(query);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    process.exit(0);
  }
}

addCountryField(); 