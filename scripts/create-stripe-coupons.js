#!/usr/bin/env node

/**
 * Create Common Stripe Coupons Script
 * 
 * This script creates common promo code coupons in Stripe.
 * Use this if you want to pre-create coupons instead of automatic creation.
 * 
 * Usage: node scripts/create-stripe-coupons.js
 */

import 'dotenv/config';
import Stripe from 'stripe';

async function createStripeCoupons() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY not found');
    process.exit(1);
  }

  const stripe = new Stripe(stripeSecretKey);
  const isLiveMode = stripeSecretKey.startsWith('sk_live_');

  console.log(`🎯 Creating coupons in ${isLiveMode ? 'LIVE' : 'TEST'} mode...\n`);

  // Common coupon configurations
  const coupons = [
    {
      id: 'PROMO_50PCT_FOREVER',
      name: '50% Lifetime Discount',
      percent_off: 50,
      duration: 'forever',
      metadata: { type: 'promo_code_discount', source: 'manual_creation' }
    },
    {
      id: 'PROMO_25PCT_FOREVER',
      name: '25% Lifetime Discount',
      percent_off: 25,
      duration: 'forever',
      metadata: { type: 'promo_code_discount', source: 'manual_creation' }
    },
    {
      id: 'PROMO_100PCT_FOREVER',
      name: 'Free Forever',
      percent_off: 100,
      duration: 'forever',
      metadata: { type: 'promo_code_discount', source: 'manual_creation' }
    },
    {
      id: 'PROMO_50PCT',
      name: '50% Discount for 12 Months',
      percent_off: 50,
      duration: 'repeating',
      duration_in_months: 12,
      metadata: { type: 'promo_code_discount', source: 'manual_creation' }
    },
    {
      id: 'PROMO_30PCT',
      name: '30% Discount for 6 Months',
      percent_off: 30,
      duration: 'repeating',
      duration_in_months: 6,
      metadata: { type: 'promo_code_discount', source: 'manual_creation' }
    }
  ];

  let created = 0;
  let skipped = 0;

  for (const couponConfig of coupons) {
    try {
      // Check if coupon already exists
      await stripe.coupons.retrieve(couponConfig.id);
      console.log(`⚠️  ${couponConfig.id}: Already exists, skipping`);
      skipped++;
    } catch (error) {
      if (error.code === 'resource_missing') {
        // Coupon doesn't exist, create it
        try {
          await stripe.coupons.create(couponConfig);
          console.log(`✅ ${couponConfig.id}: Created successfully`);
          created++;
        } catch (createError) {
          console.log(`❌ ${couponConfig.id}: Failed to create - ${createError.message}`);
        }
      } else {
        console.log(`❌ ${couponConfig.id}: Error checking - ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created} coupons`);
  console.log(`   ⚠️  Skipped: ${skipped} coupons (already exist)`);
  console.log(`   🎯 Total: ${coupons.length} coupons processed`);

  if (created > 0) {
    console.log(`\n🎉 Successfully created ${created} new coupons in Stripe!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Check your Stripe dashboard to verify the coupons`);
    console.log(`   2. Test promo code application on your site`);
    console.log(`   3. Monitor webhook events for proper processing`);
  } else {
    console.log(`\n✅ All coupons already exist. Your Stripe account is ready!`);
  }

  console.log(`\n🔗 View coupons: https://dashboard.stripe.com/coupons`);
}

// Run the script
createStripeCoupons().catch(console.error); 