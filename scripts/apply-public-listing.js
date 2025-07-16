import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

async function applyPublicListingColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tours' 
      AND column_name = 'public_listing'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✓ Column public_listing already exists');
      return;
    }
    
    // Add the column
    console.log('Adding public_listing column...');
    await client.query(`
      ALTER TABLE tours 
      ADD COLUMN public_listing BOOLEAN DEFAULT true NOT NULL
    `);
    console.log('✓ Successfully added public_listing column');
    
    // Add index
    console.log('Adding index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tours_public_listing 
      ON tours(public_listing, status) 
      WHERE public_listing = true AND status = 'active'
    `);
    console.log('✓ Successfully added index');
    
    console.log('\n✅ All changes applied successfully!');
    
  } catch (error) {
    console.error('Error applying changes:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

applyPublicListingColumn(); 