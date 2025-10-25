# Zaur.app Beta 2 Launch - Complete Implementation Plan

## 🎯 Executive Summary

**Launch Goal:** Open Beta 2 registration for 100 new tour guides with compelling pricing that validates willingness-to-pay before public launch in March 2026.

**Key Differentiators:**
- Beta 1 (50 users): 1 year free + 30% off forever
- Early Access (5 users): Same as Beta 1 (reward for earliest belief)
- **Beta 2 (100 users): 6 months free + 20% off forever** ⬅️ NEW
- Public Launch (Nov 2025): 14-30 day trial + full price

---

## 📊 Beta 2 Pricing Structure

### Essential
- **Public Price:** €25/month
- **Beta 2 Price:** €20/month (20% off forever)
- **Trial Period:** 6 months free
- **5-Year Savings:** ~€420

**Features:**
- 60 bookings/month
- 5 tour types
- Remove Zaur branding
- Priority discovery ranking
- Basic analytics
- QR code customization (Soon)
- Custom logo & colors (Soon)
- Review collection prompts (Soon)
- Email support

### Premium
- **Public Price:** €49/month
- **Beta 2 Price:** €39.20/month (20% off forever)
- **Trial Period:** 6 months free
- **5-Year Savings:** ~€764

**Features:**
- Unlimited bookings
- Unlimited tour types
- Featured discovery listings
- "Verified Operator" badge
- Discovery analytics
- Advanced analytics & insights
- WhatsApp notifications ✅
- Weather integration ✅
- Cancellation management ✅
- Customer database export
- Calendar sync (Soon)
- Review automation (Soon)
- Multi-language booking pages (Soon)
- Priority support (24h response)

### Free Starter - REMOVED for Beta 2
❌ Temporarily hidden during Beta 2 to ensure committed testers
✅ Will return at public launch (November 2025)

---

## 🛠️ Technical Implementation

### 1. Database Schema Updates

**Add beta_group field to users table:**

```sql
-- Migration: Add beta cohort tracking
ALTER TABLE users ADD COLUMN beta_group VARCHAR(20);

-- Possible values: 'beta_1', 'beta_2', 'early_access', null (for public launch users)

-- Update existing Beta 1 users (requires manual identification)
UPDATE users 
SET beta_group = 'beta_1' 
WHERE subscription_discount_percentage = 30 
  AND is_lifetime_discount = true 
  AND subscription_free_until > NOW();

-- Update Early Access users (first 5 signups - requires manual identification)
UPDATE users 
SET beta_group = 'early_access' 
WHERE id IN (
  -- SELECT first 5 users by created_at
  SELECT id FROM users 
  ORDER BY created_at ASC 
  LIMIT 5
);
```

**Create index for beta_group:**
```sql
CREATE INDEX idx_users_beta_group ON users(beta_group);
```

### 2. Promo Code System

**Create Beta 2 Promo Codes:**

```typescript
// Script: scripts/create-beta2-promo-codes.js
import { db } from '../src/lib/db/connection.js';
import { promoCodes } from '../src/lib/db/schema/index.js';

const beta2Codes = [
  {
    code: 'BETA2_GUIDE',
    type: 'beta_2',
    discountPercentage: 20,
    freeMonths: 6,
    isLifetime: true,
    maxUses: 60, // Allow some buffer for 50 target
    description: 'Beta 2 - Essential: 6 months free + 20% off forever',
    validFrom: new Date('2025-10-24'),
    validUntil: null, // No expiry
  },
  {
    code: 'BETA2_PRO',
    type: 'beta_2',
    discountPercentage: 20,
    freeMonths: 6,
    isLifetime: true,
    maxUses: 60,
    description: 'Beta 2 - Premium: 6 months free + 20% off forever',
    validFrom: new Date('2025-10-24'),
    validUntil: null,
  }
];

// Insert codes
for (const code of beta2Codes) {
  await db.insert(promoCodes).values(code);
  console.log(`✅ Created promo code: ${code.code}`);
}
```

### 3. Update Pricing Configuration

**File: `src/lib/utils/pricing-config.ts`**

```typescript
// Update base prices to reflect public launch pricing
export const PRICING_PLANS: PricingPlan[] = [
  // Remove or comment out Free Starter during Beta 2
  // {
  //   id: 'free',
  //   ...
  // },
  {
    id: 'starter_pro',
    name: 'Essential',
    description: 'Perfect for independent guides',
    monthlyBookingLimit: 60,
    tourLimit: 5,
    basePrice: { 
      monthly: 25,  // Updated pricing
      yearly: 20.83 // Annual with 2 months free
    },
    // ... features
  },
  {
    id: 'professional',
    name: 'Premium',
    description: 'Scale your tour business',
    monthlyBookingLimit: null,
    tourLimit: null,
    basePrice: { 
      monthly: 49,  // Updated pricing
      yearly: 40.83 // Annual with 2 months free
    },
    // ... features
  }
];

// Add Beta 2 discount constant
export const BETA_2_DISCOUNT = 0.20; // 20% lifetime discount

// Add helper to calculate Beta 2 prices
export function calculateBeta2Price(basePrice: number): number {
  return Math.round(basePrice * (1 - BETA_2_DISCOUNT) * 100) / 100;
}
```

### 4. Marketing Pages

**File: `src/lib/components/marketing/BetaPricingSection.svelte`**

Key changes:
- Filter out Free Starter tier during Beta 2
- Show "6 months free + 20% off forever" badge
- Add urgency messaging: "Limited to 50-100 guides only"
- Add spot counter (fetch from API)
- Update CTA to "Claim Your Beta 2 Spot"

**File: `src/routes/(marketing)/beta-2/+page.svelte` (NEW)**

Create dedicated Beta 2 landing page with:
- Hero section: "Beta 2 Final Spots - Last Chance Before Public Launch"
- Pricing comparison table (Beta 1 vs Beta 2 vs Public Launch)
- Countdown timer (visual urgency)
- Spot counter: "X of 100 spots remaining"
- Feature highlights with checkmarks for implemented features
- Application form (simplified from Beta 1)
- FAQ section addressing common questions

### 5. Beta Applications API

**File: `src/routes/api/beta-applications/+server.ts`**

Update the POST handler to:
- Re-enable applications (remove the 403 block)
- Add spot limit check (query count of Beta 2 users)
- Validate against 50-100 limit
- Automatically tag new users with `beta_group = 'beta_2'`
- Apply Beta 2 promo code automatically upon approval

```typescript
export const POST: RequestHandler = async ({ request }) => {
  // Check if Beta 2 is still open
  const beta2Count = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.beta_group, 'beta_2'));
  
  if (beta2Count[0].count >= 100) {
    return json({
      success: false,
      error: 'Beta 2 is now full. Please join our early access waitlist.'
    }, { status: 403 });
  }
  
  // Rest of application logic...
};
```

### 6. Admin Tools

**File: `src/routes/(app)/admin/beta-2/+page.svelte` (NEW)**

Admin dashboard for Beta 2 management:
- Current Beta 2 registration count
- List of Beta 2 applications (pending/accepted/rejected)
- Bulk approval tool
- Email notification tool
- Analytics: conversion funnel, application sources

**File: `scripts/notify-early-access-users.js` (NEW)**

Script to identify and email 5 Early Access users:

```javascript
import { db } from '../src/lib/db/connection.js';
import { users } from '../src/lib/db/schema/index.js';
import { sendEmail } from '../src/lib/email/sender.js';

// Get first 5 users by created_at
const earlyAccessUsers = await db
  .select()
  .from(users)
  .orderBy(asc(users.createdAt))
  .limit(5);

// Update their beta_group
for (const user of earlyAccessUsers) {
  await db
    .update(users)
    .set({ 
      beta_group: 'early_access',
      earlyAccessMember: true 
    })
    .where(eq(users.id, user.id));
  
  // Send email notification
  await sendEmail({
    to: user.email,
    subject: 'You\'re an Early Access Member - Special Beta 1 Pricing!',
    template: 'early-access-notification',
    data: {
      name: user.name,
      discount: '30% off forever',
      freeMonths: 12,
      monthlyPrice: {
        soloGuide: 11.90,
        professional: 25.90
      }
    }
  });
  
  console.log(`✅ Updated and notified Early Access user: ${user.email}`);
}
```

### 7. Email Templates

**File: `src/lib/email/templates/beta2-welcome.ts` (NEW)**

Welcome email for Beta 2 applicants with:
- Congratulations message
- Trial details (6 months free)
- Lifetime discount explanation (20% off forever)
- Getting started guide
- Link to dashboard

**File: `src/lib/email/templates/early-access-notification.ts` (NEW)**

Email for 5 Early Access users informing them of Beta 1 pricing.

---

## 🚀 Launch Checklist

### Pre-Launch (Before Going Live)
- [ ] Update database schema with `beta_group` field
- [ ] Create Beta 2 promo codes in production database
- [ ] Update pricing config with new base prices
- [ ] Update all marketing pages to hide Free Starter
- [ ] Create Beta 2 landing page with application form
- [ ] Set up email templates for Beta 2 confirmation
- [ ] Create admin dashboard for Beta 2 management
- [ ] Test full registration flow end-to-end
- [ ] Identify and tag 50 Beta 1 users with `beta_group = 'beta_1'`
- [ ] Identify and tag 5 Early Access users with `beta_group = 'early_access'`
- [ ] Send notification emails to Early Access users
- [ ] Verify Stripe products have correct prices set

### Launch Day
- [ ] Deploy Beta 2 changes to production
- [ ] Enable Beta 2 applications API endpoint
- [ ] Announce Beta 2 on social media
- [ ] Send email to waitlist (if you have one)
- [ ] Monitor application rate and spot counter
- [ ] Respond to initial applications within 24 hours

### Post-Launch (Ongoing)
- [ ] Daily: Review and approve/reject applications
- [ ] Daily: Monitor spot counter (close at 100)
- [ ] Weekly: Check in with Beta 2 users for feedback
- [ ] Monthly: Analyze Beta 2 vs Beta 1 metrics
- [ ] Prepare for public launch messaging (November 2025)

---

## 💬 Marketing Messages

### For Beta 2 Landing Page

**Hero:**
```
🚀 Beta 2 Final Spots
Last Chance Before Public Launch

TRY FREE FOR 6 MONTHS
Then lock in 20% off forever

✓ No credit card required
✓ Full access to all features
✓ Cancel anytime during trial
✓ Limited to 50-100 guides only

After Beta 2 closes, everyone pays full price.
```

**Pricing Cards:**
```
Essential
€20/month (save €5/month forever)

Premium
€39.20/month (save €9.80/month forever)

[Claim Your Spot →]
```

**Value Comparison Table:**
```
| What You Get        | Beta 1      | Beta 2      | Public Launch |
|---------------------|-------------|-------------|---------------|
| Free Trial          | 12 months   | 6 months    | 30 days       |
| Lifetime Discount   | 30% off     | 20% off     | None          |
| Essential Price     | €17.50/mo   | €20/mo      | €25/mo        |
| Premium Price       | €34.30/mo   | €39.20/mo   | €49/mo        |
| 5-Year Savings      | ~€750-1293  | ~€420-764   | €0            |
```

### For Beta 1 Users Message
```
💙 Thank You, Beta 1 Testers

Your feedback has been invaluable. As our earliest believers, 
your deal remains the best we'll ever offer:

✓ 1 year free (already active)
✓ 30% off forever
✓ Priority support
✓ Early access to all new features

You're locked in at Beta 1 pricing - no action needed.
```

### For Early Access Users Email
```
Subject: You're an Early Access Member - Special Beta 1 Pricing Unlocked!

Hi [Name],

Thank you for being one of our first 5 sign-ups! As a reward for 
your early belief in Zaur, you're receiving the same exclusive 
deal as our Beta 1 testers:

🎉 YOUR BENEFITS:
✓ 1 year free (starts when you're ready)
✓ 30% off forever
✓ Essential: €17.50/month (instead of €25)
✓ Premium: €34.30/month (instead of €49)

This is better than our new Beta 2 pricing (6 months free + 20% off), 
and MUCH better than public launch pricing (30 days + full price).

No action needed - your account is already tagged with these benefits.

[Get Started on Dashboard →]

Warm regards,
The Zaur Team
```

---

## 📊 Success Metrics

### Primary Metrics
- **Registration Rate:** Target 50-100 Beta 2 signups within 30 days
- **Application Quality:** % of approved applications (target >70%)
- **Conversion to Paid:** % of Beta 2 users who convert after 6-month trial
- **Trial Engagement:** % of Beta 2 users who create at least 1 tour
- **Booking Volume:** Average bookings per Beta 2 user per month

### Secondary Metrics
- **Referral Rate:** % of Beta 2 users who refer others
- **Feature Feedback:** # of feature requests from Beta 2 users
- **Support Tickets:** Average support tickets per Beta 2 user
- **Churn Rate:** % of Beta 2 users who cancel during trial
- **Geographic Distribution:** Countries represented in Beta 2

---

## 🎓 Key Learnings to Track

### Questions to Answer During Beta 2
1. **Willingness to Pay:** Are users willing to pay at Beta 2 prices?
2. **Feature Gaps:** What features are most requested by Beta 2 users?
3. **Onboarding:** What % of Beta 2 users complete onboarding?
4. **Time to First Tour:** Average time from signup to first tour created
5. **Booking Success Rate:** % of tours that receive at least 1 booking
6. **Support Burden:** Can we handle 100+ active users with current support setup?
7. **Pricing Sweet Spot:** Would users pay more? Less? Just right?
8. **Retention Signals:** What behaviors correlate with long-term usage?

### Data to Collect
- Onboarding completion rates
- Feature usage patterns (which features are most used?)
- Support ticket topics (what confuses users?)
- Booking conversion rates (QR scans → bookings)
- User interviews (schedule with willing Beta 2 users)
- NPS scores (Net Promoter Score survey)

---

## 🔄 Transition Plan to Public Launch

### November 2025 - Public Launch
1. **Re-enable Free Starter tier** for new signups
2. **Close Beta 2 applications** (set to 403 status)
3. **Update marketing pages** to show full pricing
4. **Launch public trial** (14-30 days for new users)
5. **Grandfather existing users:**
   - Beta 1: Keep 30% lifetime discount
   - Early Access: Keep 30% lifetime discount
   - Beta 2: Keep 20% lifetime discount
6. **Email all beta users** thanking them and reminding them of their locked-in pricing
7. **Case studies:** Feature successful Beta users in marketing
8. **Referral program:** Offer Beta users incentives for referrals

---

## 🛡️ Risk Mitigation

### Risk 1: Not Enough Beta 2 Signups
**Mitigation:**
- Lower barrier: Remove application screening, offer instant access
- Extend timeline: Keep Beta 2 open longer than planned
- Increase marketing: Paid ads, partnerships, influencer outreach

### Risk 2: Too Many Beta 2 Signups (>100)
**Mitigation:**
- Waitlist: Create waitlist for spots 101+
- Soft close: Stop accepting at 100, but create "Beta 2.5" with slightly less favorable terms
- Priority queue: Accept high-quality applicants first

### Risk 3: Low Conversion After Trial
**Mitigation:**
- Engagement campaigns: Email users not actively using platform
- Feature education: Showcase underutilized features
- Win-back offers: Small additional incentives for those considering cancellation

### Risk 4: Support Overwhelm
**Mitigation:**
- Self-service docs: Comprehensive documentation and video tutorials
- Community forum: Peer-to-peer support
- Office hours: Scheduled weekly Q&A sessions
- Prioritization: Triage system for support tickets

---

## 📅 Timeline

### Week 1 (Oct 24-31, 2025)
- Implement database changes
- Create promo codes
- Update pricing config
- Build Beta 2 landing page

### Week 2 (Nov 1-7, 2025)
- Email Early Access users
- Launch Beta 2 applications
- Monitor initial signups
- Iterate on messaging based on feedback

### Week 3-4 (Nov 8-21, 2025)
- Continue accepting applications
- Onboard Beta 2 users in batches
- Collect initial feedback
- Adjust features/support as needed

### Week 5-8 (Nov 22 - Dec 19, 2025)
- Monitor Beta 2 engagement
- Conduct user interviews
- Fix bugs and iterate on features
- Plan public launch messaging

### Public Launch (November 2025)
- Close Beta 2
- Enable Free Starter tier
- Launch public trial
- Full marketing push

---

## ✅ Next Steps

### Immediate Actions (This Week)
1. **Get your approval** on this plan
2. **Identify Beta 1 users** - manually review and tag 50 users
3. **Identify Early Access users** - tag first 5 signups
4. **Create database migration** for `beta_group` field
5. **Create promo codes** for Beta 2

### Short-Term Actions (Next 2 Weeks)
1. Update all code (pricing, marketing pages, APIs)
2. Build Beta 2 landing page
3. Create email templates
4. Test entire flow end-to-end
5. Deploy to production

### Medium-Term Actions (Next 4 Weeks)
1. Launch Beta 2 publicly
2. Monitor applications and engagement
3. Onboard users in manageable batches
4. Collect feedback and iterate
5. Plan public launch campaign

---

## 📞 Support Needed

### From You (Zaur Team)
- Final approval on pricing structure
- Beta 1 user identification criteria
- Early Access user identification (first 5 signups?)
- Marketing channel strategy for Beta 2 launch
- Budget for paid marketing (if any)

### From Development (Me)
- Implement all technical changes
- Create admin tools for Beta 2 management
- Set up email templates
- Deploy to production
- Monitor and fix bugs

---

This plan sets you up for a successful Beta 2 launch that validates pricing, gathers feedback, and builds momentum toward your November public launch. Let me know if you want to proceed with implementation! 🚀

