# Admin Beta User Creation Guide

## Overview
The admin panel now supports automatic application of the BETA_APPRECIATION promo code when creating beta tester accounts. This streamlines the process of setting up beta users with their special benefits.

## How to Create Beta Tester Accounts

### Step 1: Access Admin Panel
1. Log in as an admin user
2. Navigate to `/admin` 
3. Click the "Create User" button

### Step 2: Fill User Details
1. **Email Address**: Enter the beta tester's email
2. **Full Name**: Enter their full name
3. **Password**: Use a professional temporary password format:
   - Recommended: `BetaZaur2025!` + 4 random digits
   - Example: `BetaZaur2025!7392`
4. **Role**: Select "User (Tour Guide)" (unless they need admin access)
5. **✅ Beta Tester Account**: Check this checkbox

### Step 3: Automatic Benefits Application
When you check the "Beta Tester Account" checkbox, the system will:
- Automatically apply the BETA_APPRECIATION promo code
- Give the user 12 months free trial
- Set up 30% lifetime discount after the trial
- Show confirmation in the success message

### Step 4: Success Confirmation
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
4. Start creating your first tour

We value your feedback immensely. Please don't hesitate to reach out with any questions, suggestions, or issues you encounter.

Best regards,
The Zaur Team
```

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
