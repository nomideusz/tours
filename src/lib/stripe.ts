import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Server-side Stripe instance
export const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

// Public Stripe key for client-side
export const stripePublicKey = publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Helper function to format amount for Stripe (convert to cents)
export function formatAmountForStripe(amount: number, currency: string = 'eur'): number {
  const currencyMultipliers: Record<string, number> = {
    // Add more currencies as needed
    eur: 100,
    usd: 100,
    gbp: 100,
    jpy: 1, // Japanese yen doesn't have subunits
  };
  
  const multiplier = currencyMultipliers[currency.toLowerCase()] || 100;
  return Math.round(amount * multiplier);
}

// Helper function to format amount from Stripe (convert from cents)
export function formatAmountFromStripe(amount: number, currency: string = 'eur'): number {
  const currencyDivisors: Record<string, number> = {
    eur: 100,
    usd: 100,
    gbp: 100,
    jpy: 1,
  };
  
  const divisor = currencyDivisors[currency.toLowerCase()] || 100;
  return amount / divisor;
}

// Create a payment intent for a booking
export async function createPaymentIntent(
  amount: number,
  currency: string = 'eur',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: formatAmountForStripe(amount, currency),
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
} 