import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../src/lib/db/schema/index.js';
import { eq, isNull } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// Username generation function (copied from utils)
function generateUsername(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .slice(0, 50); // Limit to 50 characters
}

async function isUsernameAvailable(username) {
  if (!username || username.length < 2) return false;
  
  const existingUser = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
    
  return existingUser.length === 0;
}

async function generateUniqueUsername(name) {
  const baseUsername = generateUsername(name);
  
  if (await isUsernameAvailable(baseUsername)) {
    return baseUsername;
  }
  
  // Try with numbers appended
  for (let i = 1; i <= 999; i++) {
    const candidateUsername = `${baseUsername}${i}`;
    if (await isUsernameAvailable(candidateUsername)) {
      return candidateUsername;
    }
  }
  
  // Fallback: use timestamp
  return `${baseUsername}${Date.now()}`;
}

async function addUsernames() {
  try {
    console.log('🔍 Finding users without usernames...');
    
    // Get all users without usernames
    const usersWithoutUsernames = await db
      .select()
      .from(users)
      .where(isNull(users.username));
    
    console.log(`📊 Found ${usersWithoutUsernames.length} users without usernames`);
    
    if (usersWithoutUsernames.length === 0) {
      console.log('✅ All users already have usernames!');
      return;
    }
    
    // Generate and assign usernames
    for (const user of usersWithoutUsernames) {
      const username = await generateUniqueUsername(user.name || 'user');
      
      await db
        .update(users)
        .set({ username })
        .where(eq(users.id, user.id));
      
      console.log(`✅ Assigned username "${username}" to user ${user.name} (${user.email})`);
    }
    
    console.log(`🎉 Successfully added usernames to ${usersWithoutUsernames.length} users!`);
    
  } catch (error) {
    console.error('❌ Error adding usernames:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
addUsernames(); 