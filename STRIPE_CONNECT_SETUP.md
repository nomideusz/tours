# Stripe Connect Payment System

This document explains how the direct payment system works for tour guides using Stripe Connect.

## Overview

The payment system allows customers to pay for tours directly, with payments automatically transferred to tour guides minus a platform fee. This is implemented using Stripe Connect Express accounts.

## How It Works

### 1. Customer Payment Flow
1. Customer books a tour and proceeds to payment
2. Payment is processed through Stripe to your main account
3. Upon successful payment:
   - Booking is confirmed
   - Platform fee (10%) is automatically deducted
   - Remaining amount is transferred to tour guide's Stripe account
   - Confirmation emails are sent

### 2. Tour Guide Onboarding
1. Tour guide goes to Profile → Payment Setup
2. Clicks "Setup Payment Account" 
3. Redirected to Stripe Express onboarding
4. Completes identity verification and banking details
5. Can start receiving payments immediately after approval

### 3. Platform Fees
- **Platform Fee**: 10% of each booking
- **Stripe Fees**: ~2.9% + €0.30 per transaction (deducted from platform portion)
- **Tour Guide Receives**: 90% of booking amount
- **Payout Schedule**: 2-7 business days (configurable in Stripe)

## Implementation Details

### API Endpoints

#### `/api/payments/connect/setup` (POST)
Creates or manages Stripe Connect Express accounts for tour guides.

**Request Body:**
```json
{
  "userId": "user_id",
  "email": "guide@example.com", 
  "businessName": "Guide Business Name"
}
```

**Response:**
```json
{
  "accountLink": "https://connect.stripe.com/setup/..."
}
```

#### `/api/payments/connect/status` (GET)
Retrieves Stripe Connect account status for a user.

**Query Parameters:**
- `userId`: User ID to check status for

**Response:**
```json
{
  "hasAccount": true,
  "isSetupComplete": true,
  "canReceivePayments": true,
  "accountInfo": {
    "country": "DE",
    "businessName": "Guide Business",
    "payoutsEnabled": true,
    "requiresAction": false
  }
}
```

### Database Schema

The `users` collection includes:
- `stripeAccountId`: Stores the Stripe Connect account ID

### Webhook Processing

When a payment succeeds (`payment_intent.succeeded`):

1. **Payment Record Updated**: Status set to 'succeeded', fees calculated
2. **Booking Confirmed**: Status updated, ticket QR code generated
3. **Payment Transfer**: 90% transferred to tour guide's Stripe account
4. **Emails Sent**: Confirmation and ticket emails dispatched

### Error Handling

- **No Stripe Account**: Payment succeeds, but no transfer occurs (admin notification recommended)
- **Transfer Failure**: Booking remains valid, transfer can be retried manually
- **Incomplete Onboarding**: Prevents new tour creation until setup complete

## Configuration

### Environment Variables
```env
# Your main Stripe account keys
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Dashboard Setup

1. **Enable Stripe Connect**:
   - Go to Connect → Get started
   - Choose "Express" accounts
   - Configure branding and settings

2. **Webhook Configuration**:
   - Add webhook endpoint: `https://zaur.app/api/webhooks/stripe`
   - Enable events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

3. **Platform Settings**:
   - Set up your platform profile
   - Configure payout schedules
   - Review fee structures

## Testing

### Test Mode Setup
1. Use Stripe test keys during development
2. Create test Express accounts using test onboarding
3. Use test card: `4242 4242 4242 4242` for payments
4. Test transfers appear in Stripe Connect dashboard

### Production Checklist
- [ ] Switch to live Stripe keys
- [ ] Complete Stripe platform verification
- [ ] Test end-to-end payment flow
- [ ] Configure webhook monitoring
- [ ] Set up fraud protection rules
- [ ] Review payout schedules with guides

## Monitoring & Support

### Stripe Dashboard
- Monitor transfers in Connect → Transfers
- View account statuses in Connect → Accounts  
- Track platform fees in Payments → Fees

### Common Issues

**Tour Guide Can't Receive Payments**:
- Check if Stripe account setup is complete
- Verify account is not restricted
- Ensure all required documents uploaded

**Transfer Failures**:
- Check account status and restrictions
- Verify transfer amounts don't exceed account limits
- Review Stripe logs for specific error messages

**Delayed Payouts**:
- Standard payout schedule is 2-7 business days
- First payouts may take longer for verification
- Weekend and holidays affect processing times

## Security Considerations

- Never store banking information directly
- Stripe handles all compliance (PCI, KYC, AML)
- All transfers are logged and auditable
- Use webhook signature verification
- Implement rate limiting on payment endpoints

## Support Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Express Accounts Guide](https://stripe.com/docs/connect/express-accounts)
- [Platform Fees Documentation](https://stripe.com/docs/connect/pricing)
- [Webhook Security](https://stripe.com/docs/webhooks/signatures) 