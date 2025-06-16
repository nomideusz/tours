const { Client } = require('pg');
const fs = require('fs');

async function runFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/zaur'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync('./fix-participant-breakdown.sql', 'utf8');
    await client.query(sql);
    console.log('SQL executed successfully - participant_breakdown column added');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

runFix(); 