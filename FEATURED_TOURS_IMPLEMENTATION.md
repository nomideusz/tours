# Featured Tours Implementation

## Overview

We've implemented a "Try the Booking Experience" section that showcases:
1. **Your Berlin demo tour** (when configured)
2. **Real tours from Beta 1 testers** (automatically selected by quality)

This rewards your Beta 1 community and promotes their tours immediately on your marketing page!

---

## ✅ What Was Implemented

### 1. New API Endpoint: `/api/public/featured-tours`

**Location:** `src/routes/api/public/featured-tours/+server.ts`

**Selection Criteria:**
- ✅ **Demo Tour:** Your Berlin Walking Tour (when DEMO_TOUR_ID is set)
- ✅ **Beta 1 Tours:** From users with `beta_group = 'beta_1'`
- ✅ **Quality Filters:**
  - Must have images (at least 1)
  - Status = 'active'
  - public_listing = true
  - Has upcoming time slots available
- ✅ **Sorting:** By popularity (qr_conversions) then newest first
- ✅ **Limit:** Max 6 tours total (1 demo + 5 Beta 1)

### 2. Updated Component

**Location:** `src/lib/components/marketing/BookingDemoSection.svelte`

**Changes:**
- Now fetches from `/api/public/featured-tours` instead of generic tours API
- Displays "Featuring real tours from our Beta 1 community" when Beta 1 tours are shown
- Shows all featured tours (not just 3)
- Better copy acknowledging Beta 1 contributors

---

## 🚀 How to Complete Setup

### Step 1: Run SQL Queries (if not already done)

Run these in pgweb in order:

1. **Add beta_group field:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_group VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_beta_group ON users(beta_group);
```

2. **Create Beta 2 promo codes:**
```sql
-- (See previous SQL query I provided)
```

3. **Create demo tour:**
```sql
-- (See previous SQL query I provided with your user ID)
```

### Step 2: Get Your Demo Tour ID

After creating the demo tour, run this query in pgweb:

```sql
SELECT id, name, qr_code 
FROM tours 
WHERE name = 'Historic Berlin Walking Tour' 
  AND user_id = '5nkwfm5j5725wuc3jkaiisap7'
LIMIT 1;
```

Copy the `id` value (it will look something like: `demo_tour_20241025105048592`)

### Step 3: Update the API with Your Demo Tour ID

Open: `src/routes/api/public/featured-tours/+server.ts`

Find line 16 and update it:

```typescript
// Change from:
const DEMO_TOUR_ID = null;

// To (use your actual tour ID):
const DEMO_TOUR_ID = 'your_demo_tour_id_here';
```

### Step 4: Commit and Push

```bash
git add src/routes/api/public/featured-tours/+server.ts src/lib/components/marketing/BookingDemoSection.svelte FEATURED_TOURS_IMPLEMENTATION.md
git commit -m "feat: Add featured tours showcasing demo + Beta 1 community tours"
git push origin master
```

---

## 🎯 How It Works

### For Beta 1 Testers:
1. Their tours are automatically considered if:
   - They have `beta_group = 'beta_1'` in users table
   - Tour has images
   - Tour is active and public
   - Tour has upcoming time slots

2. Most popular tours (by QR conversions) show first
3. Up to 5 Beta 1 tours displayed
4. Gives them immediate exposure on your marketing page!

### For Your Demo Tour:
- Always shows first (when configured)
- Perfect for demonstrations
- Showcases all the features

---

## 📊 What Visitors See

**Section Title:** "Try the Booking Experience"

**Subtitle:** "See how your customers will discover and book your tours. Click any tour to experience the complete booking flow. Featuring real tours from our Beta 1 community."

**Tour Cards Show:**
- Tour image
- Tour name
- Description (first 120 characters)
- Location
- Duration  
- Capacity
- Price
- "Try Live Demo" button
- Opens in new tab to `/book/{qrCode}`

**Bottom Text:** "These are real booking pages from our Beta 1 community, powered by Zaur. Your customers get the same seamless experience."

---

## 🔧 How to Tag Beta 1 Users

If you need to tag existing users as Beta 1, run this in pgweb:

```sql
-- Option 1: Tag by subscription discount (if they have 30% lifetime discount)
UPDATE users
SET beta_group = 'beta_1'
WHERE subscription_discount_percentage = 30
  AND is_lifetime_discount = true
  AND beta_group IS NULL;

-- Option 2: Tag specific users by ID
UPDATE users
SET beta_group = 'beta_1'
WHERE id IN (
  'user_id_1',
  'user_id_2',
  'user_id_3'
);

-- Option 3: Tag by email
UPDATE users
SET beta_group = 'beta_1'
WHERE email IN (
  'beta1user@example.com',
  'anotherbeta@example.com'
);

-- Verify Beta 1 users
SELECT id, email, name, beta_group, subscription_discount_percentage
FROM users
WHERE beta_group = 'beta_1'
ORDER BY created_at;
```

---

## 📈 Benefits

### For Beta 1 Testers:
✅ Immediate exposure on main marketing page
✅ Their tours shown to all visitors
✅ Rewards early adopters
✅ Drives bookings to their tours
✅ Shows they're part of an active community

### For You (Zaur):
✅ Real content on marketing page (social proof)
✅ Shows the platform is active and working
✅ Demonstrates variety of tour types
✅ Rewards loyalty to beta testers
✅ No manual curation needed (automatic quality filter)

---

## 🎨 Future Enhancements (Optional)

Want to add more features later? Here are some ideas:

1. **Badge for Beta 1 Tours:**
   - Add a "Beta 1 Member" badge on their tour cards
   - Show since when they've been a member

2. **Rotation:**
   - Rotate which Beta 1 tours are shown
   - Give all Beta 1 testers equal exposure over time

3. **Stats:**
   - Track clicks from featured tours
   - Show Beta 1 testers their featured tour performance

4. **Filters:**
   - Allow filtering by category
   - Show Beta 1 tours by location

---

## 🐛 Troubleshooting

**No Beta 1 tours showing?**
1. Check if any users have `beta_group = 'beta_1'`:
   ```sql
   SELECT COUNT(*) FROM users WHERE beta_group = 'beta_1';
   ```

2. Check if Beta 1 users have qualifying tours:
   ```sql
   SELECT t.id, t.name, t.status, t.public_listing, 
          jsonb_array_length(t.images::jsonb) as image_count,
          u.email, u.beta_group
   FROM tours t
   JOIN users u ON t.user_id = u.id
   WHERE u.beta_group = 'beta_1'
     AND t.status = 'active'
     AND t.public_listing = true;
   ```

3. Check if tours have time slots:
   ```sql
   SELECT t.name, COUNT(ts.id) as slot_count
   FROM tours t
   LEFT JOIN time_slots ts ON t.id = ts.tour_id 
     AND ts.start_time >= NOW()
     AND ts.status = 'available'
   JOIN users u ON t.user_id = u.id
   WHERE u.beta_group = 'beta_1'
     AND t.status = 'active'
   GROUP BY t.id, t.name;
   ```

**Demo tour not showing?**
1. Make sure you set the DEMO_TOUR_ID in the API file
2. Check the tour exists and is active/public:
   ```sql
   SELECT id, name, status, public_listing 
   FROM tours 
   WHERE name = 'Historic Berlin Walking Tour';
   ```

---

## 📝 Summary

You now have a dynamic featured tours section that:
- Shows your demo tour first
- Automatically features high-quality Beta 1 tours
- Rewards your early adopters
- Provides social proof
- Requires minimal maintenance

Just update the DEMO_TOUR_ID after creating your demo tour and you're all set! 🎉

