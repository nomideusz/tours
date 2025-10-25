import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DATABASE_USER || 'zaur_dev'}:${process.env.DATABASE_PASSWORD || 'zaur_dev_password'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'zaur_db_local'}`;
  
  console.log('Using database connection:', connectionString.replace(/:[^:@]*@/, ':***@'));

  const pool = new Pool({ connectionString });

  try {
    console.log('🚀 Running beta_group migration...\n');
    
    // Add beta_group column
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_group VARCHAR(20)
    `);
    console.log('✅ Added beta_group column to users table');
    
    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_beta_group ON users(beta_group)
    `);
    console.log('✅ Created index on beta_group column');
    
    // Add comment
    await pool.query(`
      COMMENT ON COLUMN users.beta_group IS 'Beta cohort identifier: beta_1 (30% lifetime discount), beta_2 (20% lifetime discount), early_access (30% lifetime discount), or NULL for public users'
    `);
    console.log('✅ Added column comment');
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);

