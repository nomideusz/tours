import { env as publicEnv } from '$env/dynamic/public';

// Public Stripe key for client-side
export const stripePublicKey = publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY || ''; 