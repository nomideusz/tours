import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

// Server-side Stripe instance - lazy loaded
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    });
  }
  return stripeInstance;
}

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
  const stripe = getStripe();
  return await stripe.paymentIntents.create({
    amount: formatAmountForStripe(amount, currency),
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
} 