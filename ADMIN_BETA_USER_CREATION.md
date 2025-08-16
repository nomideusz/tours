# Admin Beta User Creation Guide

## Overview
The admin panel now supports two methods for creating beta tester accounts with automatic BETA_APPRECIATION promo code application. The new streamlined method allows creating accounts directly from beta applications, making the process much more efficient.

### ✨ Advantages of the New Beta Applications Method:
- **Pre-filled data**: All user information automatically populated from application
- **One-click creation**: No manual form filling required
- **Automatic password generation**: Professional passwords generated automatically
- **Application tracking**: Account creation automatically logged in application notes
- **Context-aware**: See full application details while creating account
- **Faster workflow**: Go from application review to account creation in seconds

## How to Create Beta Tester Accounts

### 🚀 Method 1: From Beta Applications (Recommended)

#### Step 1: Access Beta Applications
1. Log in as an admin user
2. Navigate to `/admin/beta-applications`
3. Find an **accepted** application

#### Step 2: Create Account Directly
1. **Click on the accepted application** to open details modal
2. **Click "Create Beta Account"** button (only visible for accepted applications)
3. **System automatically:**
   - Generates professional password (`BetaZaur2025!` + 4 digits)
   - Creates user account with application data
   - Applies BETA_APPRECIATION promo code
   - Shows success message with temporary password

#### Step 3: Copy Password & Send Email
1. **Copy the temporary password** from the success message
2. **Send professional email** to the beta tester (template below)
3. **Application is automatically updated** with account creation notes

### 📝 Method 2: Manual Creation (Alternative)

#### Step 1: Access Admin Panel
1. Log in as an admin user
2. Navigate to `/admin` 
3. Click the "Create User" button

#### Step 2: Fill User Details
1. **Email Address**: Enter the beta tester's email
2. **Full Name**: Enter their full name
3. **Password**: Use a professional temporary password format:
   - Recommended: `BetaZaur2025!` + 4 random digits
   - Example: `BetaZaur2025!7392`
4. **Role**: Select "User (Tour Guide)" (unless they need admin access)
5. **✅ Beta Tester Account**: Check this checkbox

#### Step 3: Automatic Benefits Application
When you check the "Beta Tester Account" checkbox, the system will:
- Automatically apply the BETA_APPRECIATION promo code
- Give the user 12 months free trial
- Set up 30% lifetime discount after the trial
- Show confirmation in the success message

#### Step 4: Success Confirmation
After creation, you'll see a message like:
```
User account created successfully for john@example.com. 
Beta benefits applied: 12 months free + 30% lifetime discount.
```

## Professional Email Template for Beta Testers

```
Subject: Welcome to Zaur Beta - Your Early Access Account

Hi [Name],

Welcome to the Zaur beta program! We're excited to have you as one of our founding users.

Your beta access credentials:
• Email: [email]
• Temporary Password: BetaZaur2025!7392
• Login: https://zaur.app/auth/login

IMPORTANT: Please change your password after first login for security.

🎉 Beta Tester Benefits (Already Applied):
• 12 months completely FREE
• 30% lifetime discount after the free period
• Early access to all new features
• Direct line to our development team

Your beta benefits are already active - no promo code needed!

Getting Started:
1. Log in with the credentials above
2. Change your password for security
3. Complete your profile setup
4. Upgrade to Professional plan (you'll pay €0 for 12 months!)
5. Start creating your first tour

Note: You'll need to go through our secure checkout process to activate your Professional plan, but you won't be charged anything for the first 12 months. A payment method is required for future billing after your free trial ends.

We value your feedback immensely. Please don't hesitate to reach out with any questions, suggestions, or issues you encounter.

Best regards,
The Zaur Team
```

## Important: Beta Users Still Need Stripe Checkout

### Why Checkout is Required
Even though beta users get 12 months free, they still need to:
1. **Go through Stripe checkout** to create the subscription
2. **Provide a payment method** for future billing (after trial ends)
3. **See €0.00 charge** during the 12-month trial period

### What Beta Users Experience
1. **Login** → See "FREE during trial" on subscription page
2. **Click "Upgrade to Professional"** → Redirected to Stripe checkout
3. **Stripe shows:**
   - Today's charge: €0.00
   - Trial period: 12 months
   - After trial: €20.30/month (30% off €29)
4. **Enter payment method** → Required but not charged during trial
5. **Subscription activated** → Immediate access to Professional features

### This is Normal Stripe Behavior
- Stripe requires payment method collection even for free trials
- This ensures seamless transition when trial ends
- Users can cancel anytime during the trial with no charges

## Technical Details

### Database Requirements
Before creating beta users, ensure the BETA_APPRECIATION promo code exists:

```sql
-- Run this SQL in your database first
UPDATE promo_codes 
SET 
  description = 'Beta user appreciation - 30% lifetime discount + 12 months free',
  type = 'early_access',
  discount_percentage = 30,
  free_months = 12,
  is_lifetime = true,
  updated_at = NOW()
WHERE id = 'cc15b7db-63d5-45cc-ab93-f4f5ac4ac2f9';
```

### What Happens Behind the Scenes
1. User account is created with `emailVerified: true`
2. System checks if "Beta Tester" checkbox was selected
3. If yes, system looks up BETA_APPRECIATION promo code
4. `applyPromoCodeToUser()` function is called
5. User profile is updated with:
   - `promoCodeUsed`: 'BETA_APPRECIATION'
   - `subscriptionFreeUntil`: [12 months from now]
   - `subscriptionDiscountPercentage`: 30
   - `isLifetimeDiscount`: true
   - `earlyAccessMember`: true

### Error Handling
If the promo code application fails, the user account is still created, but you'll see a note in the success message:
- `(Note: Beta promo code not found - please apply manually)`
- `(Note: Beta promo code could not be applied automatically)`

In these cases, you can manually apply the promo code through the regular promo code system.

## Password Recommendations

### Option 1: Branded Temporary Passwords (Recommended)
- Format: `BetaZaur2025!` + 4 random digits
- Examples: `BetaZaur2025!7392`, `BetaZaur2025!8156`
- Professional, secure, easy to communicate

### Option 2: Personalized Passwords
- Format: `[FirstName]Beta2025!`
- Examples: `JohnBeta2025!`, `SarahBeta2025!`
- Personal touch, memorable

### Option 3: Random Secure Passwords
- 12+ characters with mixed case, numbers, symbols
- Maximum security but harder to communicate

## Verification Checklist

After creating a beta user account:
- [ ] User account created successfully
- [ ] Beta benefits confirmation message appeared
- [ ] Email sent to beta tester with credentials
- [ ] User can log in with temporary password
- [ ] User sees beta benefits in their subscription page
- [ ] Pricing shows "FREE during trial" for 12 months
- [ ] After trial, pricing shows 30% discount

## Troubleshooting

### Issue: "Beta promo code not found"
**Solution**: Run the SQL script to create the BETA_APPRECIATION promo code

### Issue: "Beta promo code could not be applied"
**Solution**: Check server logs for specific error, or apply manually via promo code system

### Issue: User doesn't see beta benefits
**Solution**: Check user's profile in admin panel for promo code fields

### Issue: Pricing not showing correctly
**Solution**: Verify `subscriptionFreeUntil` and `subscriptionDiscountPercentage` fields

## Benefits Summary

Beta testers get:
1. **Immediate**: 12 months completely free (€0/month)
2. **After trial**: 30% lifetime discount (€20.30 instead of €29 for Professional)
3. **Forever**: Discount never expires, even if they cancel and resubscribe
4. **Early access**: First to see new features and updates
5. **Direct feedback channel**: Priority support and feature requests

This creates a win-win: beta testers get exceptional value, and Zaur gets committed early adopters who help shape the product.
