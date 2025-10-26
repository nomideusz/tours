#!/usr/bin/env node

/**
 * Stripe Beta 2 Price Setup Script
 * 
 * Creates products and prices for the three-tier pricing cohort system:
 * - Beta 1: 1 year free + 30% lifetime discount
 * - Beta 2: 4 months free + 20% lifetime discount  
 * - Public: Full price with 14-day trial
 * 
 * Run this script once to set up all pricing in Stripe, then copy the
 * outputted price IDs to your .env file.
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

async function setupStripeForBeta2() {
  console.log('🚀 Starting Stripe Beta 2 setup...\n');

  try {
    // ================================
    // STEP 1: CREATE PRODUCTS
    // ================================
    console.log('📦 Creating products...');

    const essentialProduct = await stripe.products.create({
      name: 'Essential',
      description: 'Perfect for independent guides getting started',
      metadata: {
        tier: 'essential',
        created_for: 'beta_2_launch'
      }
    });
    console.log(`✓ Created Essential product: ${essentialProduct.id}`);

    const premiumProduct = await stripe.products.create({
      name: 'Premium',
      description: 'For guides who want to scale their business',
      metadata: {
        tier: 'premium',
        created_for: 'beta_2_launch'
      }
    });
    console.log(`✓ Created Premium product: ${premiumProduct.id}\n`);

    // ================================
    // STEP 2: CREATE BETA 1 PRICES
    // (Keep for existing ~50 users)
    // ================================
    console.log('💎 Creating Beta 1 prices (30% lifetime discount)...');

    const beta1Prices = {
      essential_monthly: await stripe.prices.create({
        product: essentialProduct.id,
        unit_amount: 1120, // €11.20
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: {
          cohort: 'beta_1',
          tier: 'essential',
          billing: 'monthly',
          discount: '30_percent_lifetime',
          original_base: '16.00'
        }
      }),
      essential_annual: await stripe.prices.create({
        product: essentialProduct.id,
        unit_amount: 10920, // €109.20
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: {
          cohort: 'beta_1',
          tier: 'essential',
          billing: 'annual',
          discount: '30_percent_lifetime',
          marketing_label: '30% off forever'
        }
      }),
      premium_monthly: await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 2450, // €24.50
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: {
          cohort: 'beta_1',
          tier: 'premium',
          billing: 'monthly',
          discount: '30_percent_lifetime',
          original_base: '35.00'
        }
      }),
      premium_annual: await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 31080, // €310.80
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: {
          cohort: 'beta_1',
          tier: 'premium',
          billing: 'annual',
          discount: '30_percent_lifetime',
          marketing_label: '30% off forever'
        }
      })
    };

    console.log('✓ Beta 1 prices created\n');

    // ================================
    // STEP 3: CREATE BETA 2 PRICES
    // ================================
    console.log('🔥 Creating Beta 2 prices (20% lifetime discount)...');

    const beta2Prices = {
      essential_monthly: await stripe.prices.create({
        product: essentialProduct.id,
        unit_amount: 2000, // €20
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: {
          cohort: 'beta_2',
          tier: 'essential',
          billing: 'monthly',
          base_price: '25.00',
          discount: '20_percent_lifetime'
        }
      }),
      essential_annual: await stripe.prices.create({
        product: essentialProduct.id,
        unit_amount: 20000, // €200
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: {
          cohort: 'beta_2',
          tier: 'essential',
          billing: 'annual',
          base_price: '250.00',
          discount: '20_percent_lifetime',
          marketing_label: 'Pay 10 months, get 12!'
        }
      }),
      premium_monthly: await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 3900, // €39
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: {
          cohort: 'beta_2',
          tier: 'premium',
          billing: 'monthly',
          base_price: '49.00',
          discount: '20_percent_lifetime'
        }
      }),
      premium_annual: await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 39000, // €390
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: {
          cohort: 'beta_2',
          tier: 'premium',
          billing: 'annual',
          base_price: '49.00',
          discount: '20_percent_lifetime',
          marketing_label: 'Pay 10 months, get 12!'
        }
      })
    };

    console.log('✓ Beta 2 prices created\n');

    // ================================
    // STEP 4: CREATE PUBLIC PRICES
    // ================================
    console.log('🌍 Creating Public prices (full price, 14-day trial)...');

    const publicPrices = {
      essential_monthly: await stripe.prices.create({
        product: essentialProduct.id,
        unit_amount: 2500, // €25
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: {
          cohort: 'public',
          tier: 'essential',
          billing: 'monthly',
          trial_days: '14'
        }
      }),
      essential_annual: await stripe.prices.create({
        product: essentialProduct.id,
        unit_amount: 25000, // €250
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: {
          cohort: 'public',
          tier: 'essential',
          billing: 'annual',
          trial_days: '14',
          marketing_label: 'Pay 10 months, get 12!'
        }
      }),
      premium_monthly: await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 4900, // €49
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: {
          cohort: 'public',
          tier: 'premium',
          billing: 'monthly',
          trial_days: '14'
        }
      }),
      premium_annual: await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 49000, // €490
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: {
          cohort: 'public',
          tier: 'premium',
          billing: 'annual',
          trial_days: '14',
          marketing_label: 'Pay 10 months, get 12!'
        }
      })
    };

    console.log('✓ Public prices created\n');

    // ================================
    // STEP 5: OUTPUT PRICE IDs
    // ================================
    console.log('📋 SAVE THESE PRICE IDs IN YOUR .env FILE:\n');
    console.log('=' .repeat(80));
    
    const priceIds = {
      beta1: {
        essential_monthly: beta1Prices.essential_monthly.id,
        essential_annual: beta1Prices.essential_annual.id,
        premium_monthly: beta1Prices.premium_monthly.id,
        premium_annual: beta1Prices.premium_annual.id,
      },
      beta2: {
        essential_monthly: beta2Prices.essential_monthly.id,
        essential_annual: beta2Prices.essential_annual.id,
        premium_monthly: beta2Prices.premium_monthly.id,
        premium_annual: beta2Prices.premium_annual.id,
      },
      public: {
        essential_monthly: publicPrices.essential_monthly.id,
        essential_annual: publicPrices.essential_annual.id,
        premium_monthly: publicPrices.premium_monthly.id,
        premium_annual: publicPrices.premium_annual.id,
      },
    };

    // Generate .env format
    const envContent = `
# Beta 1 Cohort (30% lifetime discount + 1 year free)
STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=${priceIds.beta1.essential_monthly}
STRIPE_ESSENTIAL_BETA1_YEARLY_PRICE_ID=${priceIds.beta1.essential_annual}
STRIPE_PREMIUM_BETA1_MONTHLY_PRICE_ID=${priceIds.beta1.premium_monthly}
STRIPE_PREMIUM_BETA1_YEARLY_PRICE_ID=${priceIds.beta1.premium_annual}

# Beta 2 Cohort (20% lifetime discount + 4 months free)
STRIPE_ESSENTIAL_BETA2_MONTHLY_PRICE_ID=${priceIds.beta2.essential_monthly}
STRIPE_ESSENTIAL_BETA2_YEARLY_PRICE_ID=${priceIds.beta2.essential_annual}
STRIPE_PREMIUM_BETA2_MONTHLY_PRICE_ID=${priceIds.beta2.premium_monthly}
STRIPE_PREMIUM_BETA2_YEARLY_PRICE_ID=${priceIds.beta2.premium_annual}

# Public Cohort (full price + 14 day trial)
STRIPE_ESSENTIAL_PUBLIC_MONTHLY_PRICE_ID=${priceIds.public.essential_monthly}
STRIPE_ESSENTIAL_PUBLIC_YEARLY_PRICE_ID=${priceIds.public.essential_annual}
STRIPE_PREMIUM_PUBLIC_MONTHLY_PRICE_ID=${priceIds.public.premium_monthly}
STRIPE_PREMIUM_PUBLIC_YEARLY_PRICE_ID=${priceIds.public.premium_annual}
`;

    console.log(envContent);
    console.log('=' .repeat(80));
    
    // Save to file
    const outputPath = path.join(__dirname, 'stripe-price-ids-output.txt');
    fs.writeFileSync(outputPath, envContent.trim());
    console.log(`\n💾 Price IDs saved to: ${outputPath}`);
    
    console.log('\n✅ Stripe setup complete!\n');
    console.log('Next steps:');
    console.log('1. Copy the environment variables above to your .env file');
    console.log('2. Restart your application to load the new price IDs');
    console.log('3. Test checkout for each cohort (Beta 1, Beta 2, Public)');
    
    return {
      products: {
        essential: essentialProduct.id,
        premium: premiumProduct.id
      },
      prices: priceIds
    };

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Authentication failed. Please check your STRIPE_SECRET_KEY in .env');
    }
    throw error;
  }
}

// ================================
// RUN THE SETUP
// ================================
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.error('Please set STRIPE_SECRET_KEY in your .env file');
  process.exit(1);
}

setupStripeForBeta2()
  .then(result => {
    console.log('\n🎉 Setup successful! Products and prices created in Stripe.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });

