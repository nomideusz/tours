import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DATABASE_USER || 'nom'}:${process.env.DATABASE_PASSWORD || 'ebe3f84807eb35fd'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5433'}/${process.env.DATABASE_NAME || 'postgres'}`;

console.log('Testing connection to:', connectionString);

const pool = new Pool({
  connectionString: connectionString,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time from DB:', result.rows[0].now);
    
    // List tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log('\nTables in database:');
    tables.rows.forEach(row => console.log('  -', row.tablename));
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection(); 