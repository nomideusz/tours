# Payment System Setup Guide

This guide will help you set up the Stripe payment system for Zaur.

## Prerequisites

- Stripe account (create one at https://stripe.com)
- Access to your Stripe dashboard

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Getting Your Stripe Keys

1. **Publishable Key & Secret Key**:
   - Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to "Developers" → "API keys"
   - Copy the "Publishable key" (starts with `pk_`)
   - Copy the "Secret key" (starts with `sk_`)

2. **Webhook Secret**:
   - In Stripe Dashboard, go to "Developers" → "Webhooks"
   - Click "Add endpoint"
   - Set the endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
   - Select the following events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
   - After creating the endpoint, copy the "Signing secret" (starts with `whsec_`)

## Testing the Payment Flow

1. **Test Cards**: Use these test card numbers in development:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

2. **Test Flow**:
   - Scan a QR code or visit `/book/[qr-code]`
   - Fill in booking details
   - Click "Continue to Payment"
   - Enter test card details
   - Complete payment
   - Verify booking status is updated in PocketBase

## Production Checklist

Before going live:

1. [ ] Switch to live Stripe keys (remove `test_` from keys)
2. [ ] Update webhook endpoint to production URL
3. [ ] Test with a real card (you can refund it)
4. [ ] Enable Stripe fraud protection rules
5. [ ] Configure payment method types you want to accept
6. [ ] Set up proper error monitoring for payment failures

## Payment Flow Architecture

1. **Booking Creation**: Customer fills form → Booking created with "pending" status
2. **Payment Intent**: Payment page creates Stripe PaymentIntent
3. **Payment Processing**: Customer enters card → Stripe processes payment
4. **Webhook Confirmation**: Stripe webhook updates booking to "confirmed"
5. **Success Page**: Customer sees confirmation with booking reference

## Troubleshooting

### Common Issues:

1. **"Payment system not configured"**: Check that Stripe keys are in `.env`
2. **Webhook not working**: Verify webhook secret and endpoint URL
3. **Payment fails silently**: Check browser console and server logs
4. **Booking not updating**: Ensure webhook events are properly configured

### Testing Webhooks Locally:

Use Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:5173/api/webhooks/stripe
```

## PocketBase Configuration

For webhooks to work properly, you need to configure PocketBase API rules:

1. **Bookings Collection**: Allow API access to update booking status
   - Go to PocketBase Admin → Collections → bookings → API Rules
   - Add a rule for Update: `@request.auth.id != ""`
   - Or create a service account for webhooks

2. **Payments Collection**: Allow API access to update payment records
   - Go to PocketBase Admin → Collections → payments → API Rules  
   - Add a rule for Update: `@request.auth.id != ""`

3. **QR Codes Collection**: Scan tracking requires authenticated access
   - Scans are only tracked when tour guides are logged in
   - Anonymous users can still book tours without tracking

## Security Considerations

- Never expose your Secret Key or Webhook Secret
- Always verify webhook signatures to prevent fraud
- Use HTTPS in production
- Implement rate limiting on payment endpoints
- Log all payment attempts for audit trail

## Support

For Stripe-specific issues: https://support.stripe.com
For Zaur implementation: Create an issue in the repository 