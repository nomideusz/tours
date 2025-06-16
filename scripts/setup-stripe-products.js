#!/usr/bin/env node

/**
 * Stripe Products and Prices Setup Script
 * 
 * This script creates the necessary Stripe products and prices for Zaur's subscription plans.
 * Run this once to set up your Stripe account with the correct pricing structure.
 * 
 * Usage: node scripts/setup-stripe-products.js
 * 
 * Make sure to set your STRIPE_SECRET_KEY environment variable first.
 */

import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment variables
config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

const PRODUCTS = [
  {
    id: 'starter_pro',
    name: 'Starter Pro',
    description: 'Great for getting started with 15 bookings/month and 3 tour types',
    prices: [
      { amount: 1200, interval: 'month' }, // €12/month
      { amount: 1000, interval: 'year' },  // €10/month billed annually (€120/year)
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Everything you need to grow with unlimited bookings and advanced features',
    prices: [
      { amount: 2900, interval: 'month' }, // €29/month
      { amount: 2400, interval: 'year' },  // €24/month billed annually (€288/year)
    ]
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'For tour companies with team management and white-label options',
    prices: [
      { amount: 7900, interval: 'month' }, // €79/month
      { amount: 6500, interval: 'year' },  // €65/month billed annually (€780/year)
    ]
  }
];

async function createProducts() {
  console.log('🚀 Setting up Stripe products and prices for Zaur...\n');

  const results = {};

  for (const productConfig of PRODUCTS) {
    console.log(`📦 Creating product: ${productConfig.name}`);
    
    try {
      // Create product
      const product = await stripe.products.create({
        id: `zaur_${productConfig.id}`,
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          plan: productConfig.id,
          app: 'zaur'
        }
      });

      console.log(`✅ Product created: ${product.id}`);
      results[productConfig.id] = { product: product.id, prices: {} };

      // Create prices
      for (const priceConfig of productConfig.prices) {
        const billingInterval = priceConfig.interval === 'year' ? 'yearly' : 'monthly';
        const displayAmount = priceConfig.interval === 'year' 
          ? `€${priceConfig.amount / 100}/month (billed annually)`
          : `€${priceConfig.amount / 100}/month`;

        console.log(`  💰 Creating ${billingInterval} price: ${displayAmount}`);

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceConfig.amount,
          currency: 'eur',
          recurring: {
            interval: priceConfig.interval === 'year' ? 'year' : 'month',
          },
          metadata: {
            plan: productConfig.id,
            billing_interval: billingInterval,
            app: 'zaur'
          }
        });

        console.log(`  ✅ Price created: ${price.id}`);
        results[productConfig.id].prices[billingInterval] = price.id;
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Error creating product ${productConfig.name}:`, error.message);
      
      if (error.code === 'resource_already_exists') {
        console.log(`⚠️  Product ${productConfig.name} already exists, skipping...\n`);
        continue;
      }
      
      throw error;
    }
  }

  console.log('🎉 All products and prices created successfully!\n');
  console.log('📋 Add these environment variables to your .env file:\n');

  // Generate environment variables
  for (const [planId, data] of Object.entries(results)) {
    const envPrefix = `STRIPE_${planId.toUpperCase()}`;
    console.log(`${envPrefix}_MONTHLY_PRICE_ID="${data.prices.monthly}"`);
    console.log(`${envPrefix}_YEARLY_PRICE_ID="${data.prices.yearly}"`);
  }

  console.log('\n🔗 Next steps:');
  console.log('1. Add the environment variables above to your .env file');
  console.log('2. Update your Stripe webhook to handle subscription events');
  console.log('3. Test the subscription flow in your application');
  console.log('\n✨ Your Stripe subscription system is ready!');
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is required');
    console.log('Please set your Stripe secret key in your .env file or environment');
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ Invalid STRIPE_SECRET_KEY format');
    console.log('Make sure you are using a valid Stripe secret key (starts with sk_)');
    process.exit(1);
  }

  try {
    await createProducts();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main(); 