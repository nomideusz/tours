import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config();

const sql = postgres({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'zaur_dev',
  password: process.env.DATABASE_PASSWORD || 'zaur_dev_password',
  database: process.env.DATABASE_NAME || 'zaur_local',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function addOAuthTable() {
  try {
    console.log('Adding OAuth accounts table...');
    
    // Make hashedPassword nullable for OAuth users
    await sql`
      ALTER TABLE users 
      ALTER COLUMN hashed_password DROP NOT NULL;
    `;
    console.log('✓ Made hashedPassword nullable');
    
    // Create OAuth accounts table
    await sql`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(provider, provider_user_id)
      );
    `;
    console.log('✓ Created oauth_accounts table');
    
    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_user 
      ON oauth_accounts(provider, provider_user_id);
    `;
    console.log('✓ Created index on oauth_accounts');
    
    console.log('OAuth table setup complete!');
    
  } catch (error) {
    console.error('Error setting up OAuth table:', error);
  } finally {
    await sql.end();
  }
}

addOAuthTable(); 