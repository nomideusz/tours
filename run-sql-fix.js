import { readFileSync } from 'fs';
import pg from 'pg';

// Read database URL from environment or use default
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/zaur';

async function runSqlFix() {
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the SQL file
    const sql = readFileSync('./fix-participant-breakdown.sql', 'utf8');
    
    // Execute the SQL
    const result = await client.query(sql);
    console.log('SQL executed successfully');
    console.log('Result:', result);

  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runSqlFix(); 