import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Environment variables for database connection
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DATABASE_USER || 'zaur_dev'}:${process.env.DATABASE_PASSWORD || 'zaur_dev_password'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'zaur_local'}`;

console.log('Initializing database connection...');

// Create PostgreSQL connection with error handling
let client;
try {
  client = postgres(connectionString, {
    max: 10, // Reduced from 20 for production stability
    idle_timeout: 20, // Close connections after 20 seconds of inactivity
    connect_timeout: 10, // Reduced from 60 to fail faster
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    onnotice: () => {}, // Suppress notices
  });
} catch (error) {
  console.error('Failed to create database connection:', error);
  throw error;
}

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Export connection for raw queries if needed
export { client };

// Export schema for type safety
export * from './schema/index.js'; 