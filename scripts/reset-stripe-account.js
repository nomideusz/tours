import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../src/lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

// Get user email from command line
const userEmail = process.argv[2];
if (!userEmail) {
    console.error('❌ Please provide user email as argument');
    console.error('Usage: node scripts/reset-stripe-account.js your-email@example.com');
    process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function resetStripeAccount() {
    try {
        console.log(`🔍 Looking for user with email: ${userEmail}`);
        
        // Find user
        const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
        
        if (user.length === 0) {
            console.error('❌ User not found');
            return;
        }
        
        const currentUser = user[0];
        console.log(`✅ Found user: ${currentUser.name}`);
        console.log(`   Current Stripe Account: ${currentUser.stripeAccountId || 'None'}`);
        console.log(`   Current Country: ${currentUser.country || 'Not set'}`);
        
        if (!currentUser.stripeAccountId) {
            console.log('ℹ️ User does not have a Stripe account set up');
            return;
        }
        
        // Confirm before proceeding
        console.log('\n⚠️  WARNING: This will remove your Stripe account connection.');
        console.log('You will need to set up payments again with the correct country.');
        console.log('This action cannot be undone!\n');
        
        // Clear Stripe account ID
        await db.update(users)
            .set({
                stripeAccountId: null,
                updatedAt: new Date()
            })
            .where(eq(users.id, currentUser.id));
            
        console.log('✅ Stripe account has been reset');
        console.log('📝 Next steps:');
        console.log('   1. Go to your dashboard');
        console.log('   2. Make sure your location is set correctly');
        console.log('   3. Click "Setup Payments" to create a new payment account');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.end();
    }
}

resetStripeAccount(); 