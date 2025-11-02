#!/usr/bin/env node

import { config } from 'dotenv';
import pg from 'pg';

const { Client } = pg;
config();

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check if column exists
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'tours' 
      AND column_name = 'location_place_id';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Migration verified! Column details:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ Column not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
