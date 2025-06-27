import { db } from '../src/lib/db/connection.js';
import { users } from '../src/lib/db/schema/index.js';
import { isNotNull } from 'drizzle-orm';
import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment variables
config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

async function registerDomainsForExistingAccounts() {
  console.log('🚀 Starting domain registration for existing accounts...');
  
  try {
    // Get all users with Stripe accounts
    const usersWithStripe = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      stripeAccountId: users.stripeAccountId
    })
    .from(users)
    .where(isNotNull(users.stripeAccountId));
    
    console.log(`Found ${usersWithStripe.length} users with Stripe accounts`);
    
    let successCount = 0;
    let alreadyExistsCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithStripe) {
      try {
        // Check if domain already exists
        const existingDomains = await stripe.paymentMethodDomains.list(
          {
            domain_name: 'zaur.app',
            limit: 1
          },
          {
            stripeAccount: user.stripeAccountId,
          }
        );
        
        if (existingDomains.data.length > 0) {
          console.log(`✓ Domain already registered for ${user.email} (${user.stripeAccountId})`);
          alreadyExistsCount++;
          continue;
        }
        
        // Register the domain
        await stripe.paymentMethodDomains.create(
          {
            domain_name: 'zaur.app',
          },
          {
            stripeAccount: user.stripeAccountId,
          }
        );
        
        console.log(`✅ Registered domain for ${user.email} (${user.stripeAccountId})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error for ${user.email} (${user.stripeAccountId}):`, error.message);
        errorCount++;
        
        // If it's a rate limit error, wait a bit
        if (error.code === 'rate_limit') {
          console.log('Rate limited, waiting 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully registered: ${successCount}`);
    console.log(`ℹ️  Already registered: ${alreadyExistsCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${usersWithStripe.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    // Close database connection
    process.exit();
  }
}

// Run the script
registerDomainsForExistingAccounts(); 