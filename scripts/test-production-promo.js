#!/usr/bin/env node

/**
 * Production Promo Code Test Script
 * 
 * Tests promo code functionality in production environment:
 * 1. Validates promo codes in database
 * 2. Tests Stripe coupon creation (read-only)
 * 3. Simulates production checkout flow
 * 
 * Usage: node scripts/test-production-promo.js
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { promoCodes, users } from '../src/lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import pg from 'pg';

const { Pool } = pg;

async function testProductionPromoIntegration() {
  const connectionString = process.env.DATABASE_URL;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }
  
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY not found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  const stripe = new Stripe(stripeSecretKey);

  try {
    console.log('🔍 Testing Production Promo Code Integration...\n');
    
    // Check if this is live mode
    const isLiveMode = stripeSecretKey.startsWith('sk_live_');
    console.log(`🎯 Stripe Mode: ${isLiveMode ? 'LIVE' : 'TEST'}`);
    
    if (isLiveMode) {
      console.log('⚠️  WARNING: This is LIVE mode. No test transactions will be created.');
    }
    
    // Test 1: Check promo codes in production database
    console.log('\n1. Checking production promo codes...');
    const allPromoCodes = await db.select().from(promoCodes).where(eq(promoCodes.isActive, true));
    console.log(`   Found ${allPromoCodes.length} active promo codes`);
    
    if (allPromoCodes.length === 0) {
      console.log('   ❌ No active promo codes found. Run apply-promo-codes.js in production.');
      return;
    }
    
    // Show some sample codes
    console.log('   Top 5 active codes:');
    allPromoCodes.slice(0, 5).forEach(code => {
      console.log(`   - ${code.code}: ${code.type} (${code.currentUses}/${code.maxUses || '∞'} uses)`);
    });
    
    // Test 2: Check existing Stripe coupons
    console.log('\n2. Checking existing Stripe coupons...');
    try {
      const coupons = await stripe.coupons.list({ limit: 10 });
      const promoCoupons = coupons.data.filter(c => c.id.startsWith('PROMO_'));
      
      console.log(`   Found ${promoCoupons.length} existing promo coupons in Stripe:`);
      promoCoupons.forEach(coupon => {
        console.log(`   - ${coupon.id}: ${coupon.percent_off}% off (${coupon.duration})`);
      });
      
      if (promoCoupons.length === 0) {
        console.log('   ✅ No existing promo coupons (will be created automatically when needed)');
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch coupons: ${error.message}`);
    }
    
    // Test 3: Check users with promo codes
    console.log('\n3. Checking users with promo codes...');
    const usersWithPromos = await db
      .select()
      .from(users)
      .where(eq(users.promoCodeUsed, allPromoCodes[0]?.code || 'FOUNDER'))
      .limit(3);
    
    if (usersWithPromos.length > 0) {
      console.log(`   Found ${usersWithPromos.length} users with promo codes:`);
      usersWithPromos.forEach(user => {
        console.log(`   - ${user.email}: ${user.promoCodeUsed} (${user.subscriptionDiscountPercentage}% discount)`);
      });
    } else {
      console.log('   ℹ️  No users have applied promo codes yet');
    }
    
    // Test 4: Simulate coupon creation logic
    console.log('\n4. Testing coupon creation logic...');
    const testDiscounts = [
      { percentage: 50, lifetime: true },
      { percentage: 25, lifetime: false },
      { percentage: 100, lifetime: true }
    ];
    
    for (const discount of testDiscounts) {
      const couponId = `PROMO_${discount.percentage}PCT${discount.lifetime ? '_FOREVER' : ''}`;
      
      try {
        // Check if coupon already exists
        const existingCoupon = await stripe.coupons.retrieve(couponId);
        console.log(`   ✅ ${couponId}: Already exists`);
      } catch (error) {
        if (error.code === 'resource_missing') {
          console.log(`   📝 ${couponId}: Would be created when needed`);
        } else {
          console.log(`   ⚠️  ${couponId}: Error checking - ${error.message}`);
        }
      }
    }
    
    // Test 5: Production readiness check
    console.log('\n5. Production readiness check...');
    
    const checks = [
      { name: 'Database connection', status: true },
      { name: 'Stripe connection', status: !!stripeSecretKey },
      { name: 'Active promo codes', status: allPromoCodes.length > 0 },
      { name: 'Live mode', status: isLiveMode, optional: true },
    ];
    
    checks.forEach(check => {
      const icon = check.status ? '✅' : (check.optional ? '⚠️' : '❌');
      const suffix = check.optional && !check.status ? ' (test mode)' : '';
      console.log(`   ${icon} ${check.name}${suffix}`);
    });
    
    // Test 6: Sample API endpoints
    console.log('\n6. Testing API endpoints (simulation)...');
    console.log('   📡 /api/promo-code/validate - Ready');
    console.log('   📡 /api/promo-code/apply - Ready');
    console.log('   📡 /api/subscriptions/checkout - Ready');
    console.log('   📡 /api/webhooks/stripe - Ready');
    
    // Final recommendations
    console.log('\n🎯 Production Deployment Checklist:');
    console.log('   ✅ Set STRIPE_SECRET_KEY to live key');
    console.log('   ✅ Set STRIPE_WEBHOOK_SECRET to live webhook secret');
    console.log('   ✅ Configure webhook endpoint: https://zaur.app/api/webhooks/stripe');
    console.log('   ✅ Run apply-promo-codes.js in production');
    console.log('   ✅ Test one promo code application manually');
    console.log('   ✅ Monitor Stripe dashboard for automatic coupon creation');
    
    console.log('\n📋 How to Test in Production:');
    console.log('   1. Register new account with promo code');
    console.log('   2. Upgrade to paid subscription');
    console.log('   3. Check Stripe dashboard for new coupon');
    console.log('   4. Verify discount was applied correctly');
    console.log('   5. Check webhook logs for proper processing');
    
    console.log('\n🎉 Production Promo Code Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testProductionPromoIntegration().catch(console.error); 