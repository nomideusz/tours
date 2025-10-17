# Advanced Group-Based Pricing & Optional Add-ons - Feature Proposal

## Overview

This proposal addresses a critical pain point for private tour guides: **fair pricing for groups of varying sizes**. Based on direct feedback from a tour guide, we'll implement flexible group-based pricing tiers and optional add-ons to solve the private tour pricing dilemma.

---

## The Problem (Tour Guide's Perspective)

### Current Limitations
Private tours with vehicles (cars/minivans) face a pricing paradox:

1. **Price per person** → Too expensive for larger groups
   - Example: €50/person × 6 people = €300 (customer sees this as excessive)
   
2. **Fixed group price** → Too expensive for small groups
   - Example: €300/group ÷ 1 person = €300 (solo traveler pays full vehicle cost)

3. **No way to separate costs** → Unfair platform commissions
   - Tour guide pays 20% commission on fuel, parking, tolls, van rental
   - These are **hard costs**, not guiding fees
   - Zaur doesn't take commission (our advantage!), but guides still need transparent cost breakdown

### Real-World Example
A guide runs tours for 1-8 people:
- **Current workaround:** Create 2 separate tours (car vs minivan)
- **Desired solution:** One tour with smart pricing based on group size
- **Additional need:** Show transport/accommodation costs separately (not included in base guiding fee)

---

## Proposed Solution

### Part 1: Group-Size Based Pricing Tiers

#### Database Schema Changes

```typescript
// Update tours table schema
export const tours = pgTable('tours', {
  // ... existing fields ...
  
  // Pricing model selector
  pricingModel: pgEnum('pricing_model', [
    'per_person',      // Current: Price × Participants
    'adult_child',     // Current: Adult price + Child price
    'group_tiers',     // NEW: Price based on group size
    'hybrid'           // NEW: Group tiers + add-ons
  ]).default('per_person'),
  
  // Group-based pricing tiers (replaces simple adult/child model)
  groupPricingTiers: json('group_pricing_tiers').$type<{
    tiers: Array<{
      minParticipants: number;  // e.g., 1
      maxParticipants: number;  // e.g., 2
      price: number;            // e.g., 150.00
      label?: string;           // e.g., "Solo/Couple"
    }>;
  }>(),
  
  // Optional add-ons
  optionalAddons: json('optional_addons').$type<{
    addons: Array<{
      id: string;
      name: string;             // e.g., "Transport"
      description?: string;      // e.g., "Includes fuel, parking, tolls"
      price: number;            // e.g., 80.00
      required: boolean;        // Force selection (for mandatory extras)
      icon?: string;            // e.g., "car", "bed", "utensils"
    }>;
  }>(),
  
  // Existing pricing fields (for backward compatibility)
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  enablePricingTiers: boolean('enable_pricing_tiers').default(false),
  pricingTiers: json('pricing_tiers').$type<{
    adult: number;
    child?: number;
  }>(),
});
```

#### TypeScript Types

```typescript
// src/lib/types.d.ts

export type PricingModel = 'per_person' | 'adult_child' | 'group_tiers' | 'hybrid';

export interface GroupPricingTier {
  minParticipants: number;
  maxParticipants: number;
  price: number;
  label?: string;
}

export interface OptionalAddon {
  id: string;
  name: string;
  description?: string;
  price: number;
  required: boolean;
  icon?: string;
}

export interface Tour {
  // ... existing fields ...
  
  // Pricing model
  pricingModel?: PricingModel;
  
  // Group pricing tiers
  groupPricingTiers?: {
    tiers: GroupPricingTier[];
  };
  
  // Optional add-ons
  optionalAddons?: {
    addons: OptionalAddon[];
  };
}

export interface Booking {
  // ... existing fields ...
  
  // Selected add-ons for this booking
  selectedAddons?: Array<{
    addonId: string;
    name: string;
    price: number;
  }>;
  
  // Price breakdown
  priceBreakdown?: {
    basePrice: number;      // Tour guiding fee
    addonsTotal: number;    // Sum of selected add-ons
    totalAmount: number;    // Base + Add-ons
  };
}
```

---

### Part 2: Tour Creation/Edit UI

#### TourForm.svelte - New Pricing Section

```svelte
<!-- Pricing Model Selection -->
<div class="space-y-4">
  <label class="form-label">Pricing Model</label>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <!-- Per Person (Simple) -->
    <button
      type="button"
      class="pricing-model-card {formData.pricingModel === 'per_person' ? 'selected' : ''}"
      onclick={() => formData.pricingModel = 'per_person'}
    >
      <User class="w-5 h-5" />
      <div>
        <div class="font-medium">Per Person</div>
        <div class="text-xs text-secondary">Same price for each participant</div>
      </div>
    </button>
    
    <!-- Adult/Child -->
    <button
      type="button"
      class="pricing-model-card {formData.pricingModel === 'adult_child' ? 'selected' : ''}"
      onclick={() => formData.pricingModel = 'adult_child'}
    >
      <Users class="w-5 h-5" />
      <div>
        <div class="font-medium">Adult / Child</div>
        <div class="text-xs text-secondary">Different prices by age</div>
      </div>
    </button>
    
    <!-- Group Tiers (NEW) -->
    <button
      type="button"
      class="pricing-model-card {formData.pricingModel === 'group_tiers' ? 'selected' : ''}"
      onclick={() => formData.pricingModel = 'group_tiers'}
    >
      <UsersIcon class="w-5 h-5" />
      <div>
        <div class="font-medium">Group Size Tiers</div>
        <div class="text-xs text-secondary">Price based on total group size</div>
        <span class="badge-new">New</span>
      </div>
    </button>
    
    <!-- Hybrid (NEW) -->
    <button
      type="button"
      class="pricing-model-card {formData.pricingModel === 'hybrid' ? 'selected' : ''}"
      onclick={() => formData.pricingModel = 'hybrid'}
    >
      <Settings class="w-5 h-5" />
      <div>
        <div class="font-medium">Group + Add-ons</div>
        <div class="text-xs text-secondary">Tiers + optional extras</div>
        <span class="badge-new">Recommended</span>
      </div>
    </button>
  </div>
</div>

{#if formData.pricingModel === 'group_tiers' || formData.pricingModel === 'hybrid'}
  <!-- Group Pricing Tiers Configuration -->
  <div class="space-y-4 mt-6">
    <div class="flex items-center justify-between">
      <h4 class="font-medium">Group Pricing Tiers</h4>
      <button 
        type="button" 
        onclick={addPricingTier}
        class="button-secondary button--small"
      >
        <Plus class="w-4 h-4" />
        Add Tier
      </button>
    </div>
    
    <!-- Pricing Tiers List -->
    {#each formData.groupPricingTiers?.tiers || [] as tier, index}
      <div class="tier-card">
        <div class="tier-header">
          <input
            type="text"
            placeholder="e.g., Solo/Couple"
            bind:value={tier.label}
            class="tier-label-input"
          />
          <button
            type="button"
            onclick={() => removePricingTier(index)}
            class="button-danger button--icon button--small"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
        
        <div class="tier-config">
          <!-- Group Size Range -->
          <div class="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="200"
              bind:value={tier.minParticipants}
              placeholder="Min"
              class="form-input tier-range-input"
            />
            <span class="text-secondary">to</span>
            <input
              type="number"
              min={tier.minParticipants}
              max="200"
              bind:value={tier.maxParticipants}
              placeholder="Max"
              class="form-input tier-range-input"
            />
            <span class="text-secondary">people</span>
          </div>
          
          <!-- Price for this tier -->
          <div class="flex items-center gap-2">
            <span class="text-secondary">Price:</span>
            <input
              type="number"
              min="0"
              step={priceStep}
              bind:value={tier.price}
              class="form-input tier-price-input"
            />
            <span class="currency-symbol">{currencySymbol}</span>
          </div>
        </div>
        
        <!-- Visual Preview -->
        <div class="tier-preview">
          {#if tier.minParticipants && tier.maxParticipants && tier.price}
            {#if tier.minParticipants === tier.maxParticipants}
              <span class="text-xs">{tier.minParticipants} {tier.minParticipants === 1 ? 'person' : 'people'}: <strong>{currencySymbol}{tier.price}</strong></span>
            {:else}
              <span class="text-xs">{tier.minParticipants}-{tier.maxParticipants} people: <strong>{currencySymbol}{tier.price}</strong></span>
            {/if}
            <span class="text-xs text-tertiary">
              ({currencySymbol}{(tier.price / ((tier.minParticipants + tier.maxParticipants) / 2)).toFixed(2)}/person avg)
            </span>
          {/if}
        </div>
      </div>
    {/each}
    
    <!-- Quick Setup Templates -->
    {#if !formData.groupPricingTiers?.tiers?.length}
      <div class="templates-section">
        <p class="text-sm text-secondary mb-2">Quick Start Templates:</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            type="button"
            onclick={() => applyTemplate('private_tour')}
            class="button-secondary button--small"
          >
            Private Tour (1-8 people)
          </button>
          <button
            type="button"
            onclick={() => applyTemplate('small_group')}
            class="button-secondary button--small"
          >
            Small Group (1-12 people)
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

{#if formData.pricingModel === 'hybrid'}
  <!-- Optional Add-ons Configuration -->
  <div class="space-y-4 mt-8">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-medium">Optional Add-ons</h4>
        <p class="text-xs text-secondary mt-1">Extras customers can add to their booking</p>
      </div>
      <button 
        type="button" 
        onclick={addAddon}
        class="button-secondary button--small"
      >
        <Plus class="w-4 h-4" />
        Add Add-on
      </button>
    </div>
    
    <!-- Add-ons List -->
    {#each formData.optionalAddons?.addons || [] as addon, index}
      <div class="addon-card">
        <div class="addon-header">
          <div class="addon-icon-selector">
            <select bind:value={addon.icon} class="icon-select">
              <option value="car">🚗 Transport</option>
              <option value="bed">🏨 Accommodation</option>
              <option value="utensils">🍽️ Meals</option>
              <option value="ticket">🎫 Entry Fees</option>
              <option value="camera">📷 Photos</option>
              <option value="other">➕ Other</option>
            </select>
          </div>
          <button
            type="button"
            onclick={() => removeAddon(index)}
            class="button-danger button--icon button--small"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
        
        <div class="addon-config">
          <input
            type="text"
            placeholder="Add-on name (e.g., Transport)"
            bind:value={addon.name}
            class="form-input"
          />
          
          <textarea
            placeholder="Description (e.g., Includes fuel, parking, tolls, vehicle rental)"
            bind:value={addon.description}
            rows="2"
            class="form-textarea"
          ></textarea>
          
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 flex-1">
              <label class="text-sm">Price:</label>
              <input
                type="number"
                min="0"
                step={priceStep}
                bind:value={addon.price}
                class="form-input"
              />
              <span class="currency-symbol">{currencySymbol}</span>
            </div>
            
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={addon.required}
              />
              <span class="text-sm">Required</span>
            </label>
          </div>
        </div>
        
        <!-- Preview -->
        <div class="addon-preview">
          {#if addon.name && addon.price}
            <span class="text-xs">
              {addon.required ? '✓ Required:' : '○ Optional:'} 
              <strong>{addon.name}</strong> +{currencySymbol}{addon.price}
            </span>
          {/if}
        </div>
      </div>
    {/each}
    
    <!-- Add-ons Help Text -->
    <div class="help-box">
      <Info class="w-4 h-4" />
      <div class="text-xs">
        <strong>Why use add-ons?</strong>
        <p>Separate your guiding fee from hard costs (transport, accommodation). This provides transparency and ensures fair pricing. Since Zaur doesn't take commission, you keep 100% of both!</p>
      </div>
    </div>
  </div>
{/if}
```

---

### Part 3: Booking Page UI

#### /book/[code]/+page.svelte Changes

```svelte
<!-- Participant Selection (Group Tiers) -->
{#if tour.pricingModel === 'group_tiers' || tour.pricingModel === 'hybrid'}
  <div class="booking-section">
    <h3 class="section-title">How many people?</h3>
    
    <!-- Group Size Selector with Tier Cards -->
    <div class="tier-selector-grid">
      {#each tour.groupPricingTiers?.tiers || [] as tier}
        {@const isSelected = selectedTier?.minParticipants === tier.minParticipants}
        <button
          type="button"
          class="tier-selector-card {isSelected ? 'selected' : ''}"
          onclick={() => selectTier(tier)}
          disabled={!canSelectTier(tier, selectedTimeSlot)}
        >
          <div class="tier-icon">
            <Users class="w-6 h-6" />
          </div>
          <div class="tier-details">
            {#if tier.label}
              <div class="tier-label">{tier.label}</div>
            {/if}
            <div class="tier-range">
              {tier.minParticipants}
              {#if tier.maxParticipants !== tier.minParticipants}
                - {tier.maxParticipants}
              {/if}
              {tier.maxParticipants > 1 ? 'people' : 'person'}
            </div>
            <div class="tier-price">{formatCurrency(tier.price)}</div>
            <div class="tier-price-per-person">
              {formatCurrency(tier.price / ((tier.minParticipants + tier.maxParticipants) / 2))}/person avg
            </div>
          </div>
          {#if isSelected}
            <CheckCircle class="tier-check-icon" />
          {/if}
        </button>
      {/each}
    </div>
    
    <!-- Fine-tune participant count within selected tier -->
    {#if selectedTier}
      <div class="participant-fine-tune">
        <label class="text-sm font-medium">Exact number of participants</label>
        <select bind:value={participantCount} class="form-select">
          {#each Array.from(
            { length: selectedTier.maxParticipants - selectedTier.minParticipants + 1 },
            (_, i) => selectedTier.minParticipants + i
          ) as count}
            <option value={count}>{count} {count === 1 ? 'person' : 'people'}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>
{/if}

<!-- Optional Add-ons Selection -->
{#if tour.pricingModel === 'hybrid' && tour.optionalAddons?.addons?.length}
  <div class="booking-section">
    <h3 class="section-title">Add-ons (Optional)</h3>
    
    <div class="addons-list">
      {#each tour.optionalAddons.addons as addon}
        {@const isSelected = selectedAddons.some(a => a.id === addon.id)}
        <label class="addon-checkbox-card {isSelected ? 'selected' : ''}">
          <div class="addon-checkbox-input">
            <input
              type="checkbox"
              checked={isSelected}
              disabled={addon.required}
              onchange={(e) => toggleAddon(addon, e.target.checked)}
            />
          </div>
          
          <div class="addon-icon">
            {#if addon.icon === 'car'}
              <Car class="w-5 h-5" />
            {:else if addon.icon === 'bed'}
              <Bed class="w-5 h-5" />
            {:else if addon.icon === 'utensils'}
              <Utensils class="w-5 h-5" />
            {:else if addon.icon === 'ticket'}
              <Ticket class="w-5 h-5" />
            {:else if addon.icon === 'camera'}
              <Camera class="w-5 h-5" />
            {:else}
              <Plus class="w-5 h-5" />
            {/if}
          </div>
          
          <div class="addon-details">
            <div class="addon-name">
              {addon.name}
              {#if addon.required}
                <span class="addon-required-badge">Required</span>
              {/if}
            </div>
            {#if addon.description}
              <div class="addon-description">{addon.description}</div>
            {/if}
            <div class="addon-price">+{formatCurrency(addon.price)}</div>
          </div>
        </label>
      {/each}
    </div>
  </div>
{/if}

<!-- Price Summary with Breakdown -->
<div class="price-summary-card">
  <div class="price-breakdown">
    {#if tour.pricingModel === 'group_tiers' || tour.pricingModel === 'hybrid'}
      <div class="price-line">
        <span>Tour (guiding fee)</span>
        <span class="price-amount">{formatCurrency(selectedTier?.price || 0)}</span>
      </div>
      
      {#if selectedAddons.length > 0}
        {#each selectedAddons as addon}
          <div class="price-line price-line-addon">
            <span>{addon.name}</span>
            <span class="price-amount">+{formatCurrency(addon.price)}</span>
          </div>
        {/each}
      {/if}
      
      <div class="price-line-divider"></div>
      
      <div class="price-line price-line-total">
        <span class="font-semibold">Total</span>
        <span class="price-total">{formatCurrency(calculateTotalPrice())}</span>
      </div>
    {:else}
      <!-- Traditional pricing display -->
      <div class="price-line price-line-total">
        <span>Total</span>
        <span class="price-total">{formatCurrency(totalPrice)}</span>
      </div>
    {/if}
  </div>
  
  <!-- Breakdown explanation (optional) -->
  {#if tour.pricingModel === 'hybrid' && selectedTier}
    <div class="price-note">
      <Info class="w-4 h-4" />
      <span class="text-xs">
        Guiding fee covers the tour experience. Add-ons cover additional services and costs.
      </span>
    </div>
  {/if}
</div>
```

---

### Part 4: Migration Strategy

#### Database Migration

```sql
-- migration: add_group_pricing_and_addons.sql

-- Add pricing model enum
CREATE TYPE pricing_model AS ENUM (
  'per_person',
  'adult_child',
  'group_tiers',
  'hybrid'
);

-- Add new columns to tours table
ALTER TABLE tours
  ADD COLUMN pricing_model pricing_model DEFAULT 'per_person',
  ADD COLUMN group_pricing_tiers JSON,
  ADD COLUMN optional_addons JSON;

-- Migrate existing tours to appropriate pricing models
UPDATE tours
SET pricing_model = CASE
  WHEN enable_pricing_tiers = true THEN 'adult_child'::pricing_model
  ELSE 'per_person'::pricing_model
END;

-- Add columns to bookings table for add-on tracking
ALTER TABLE bookings
  ADD COLUMN selected_addons JSON,
  ADD COLUMN price_breakdown JSON;

-- Update existing bookings with simple breakdown
UPDATE bookings
SET price_breakdown = json_build_object(
  'basePrice', total_amount,
  'addonsTotal', 0,
  'totalAmount', total_amount
);

-- Create index for pricing model queries
CREATE INDEX idx_tours_pricing_model ON tours(pricing_model);

COMMENT ON COLUMN tours.group_pricing_tiers IS 'Group-based pricing tiers: { tiers: [{ minParticipants, maxParticipants, price, label }] }';
COMMENT ON COLUMN tours.optional_addons IS 'Optional add-ons: { addons: [{ id, name, description, price, required, icon }] }';
COMMENT ON COLUMN bookings.selected_addons IS 'Add-ons selected for this booking: [{ addonId, name, price }]';
COMMENT ON COLUMN bookings.price_breakdown IS 'Price breakdown: { basePrice, addonsTotal, totalAmount }';
```

---

### Part 5: Backend API Changes

#### Booking Creation Endpoint

```typescript
// src/routes/api/bookings/+server.ts

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  
  // ... existing validation ...
  
  // Calculate price based on pricing model
  let basePrice = 0;
  let selectedAddons: any[] = [];
  let addonsTotal = 0;
  
  if (tour.pricingModel === 'group_tiers' || tour.pricingModel === 'hybrid') {
    // Find applicable tier
    const tier = tour.groupPricingTiers?.tiers?.find(t => 
      data.participants >= t.minParticipants && 
      data.participants <= t.maxParticipants
    );
    
    if (!tier) {
      return json({ error: 'No pricing tier found for this group size' }, { status: 400 });
    }
    
    basePrice = tier.price;
    
    // Process add-ons if hybrid model
    if (tour.pricingModel === 'hybrid' && data.selectedAddonIds?.length) {
      selectedAddons = tour.optionalAddons?.addons?.filter(addon =>
        data.selectedAddonIds.includes(addon.id)
      ) || [];
      
      addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    }
    
    // Ensure all required add-ons are selected
    const requiredAddons = tour.optionalAddons?.addons?.filter(a => a.required) || [];
    const missingRequired = requiredAddons.filter(addon => 
      !selectedAddons.some(selected => selected.id === addon.id)
    );
    
    if (missingRequired.length > 0) {
      return json({ 
        error: `Required add-ons missing: ${missingRequired.map(a => a.name).join(', ')}` 
      }, { status: 400 });
    }
  } else if (tour.pricingModel === 'adult_child') {
    // Existing adult/child logic
    basePrice = (data.adults * tour.pricingTiers.adult) + 
                (data.children * (tour.pricingTiers.child || 0));
  } else {
    // per_person
    basePrice = data.participants * tour.price;
  }
  
  const totalAmount = basePrice + addonsTotal;
  
  // Create booking
  const booking = await db.insert(bookings).values({
    tourId: tour.id,
    userId: tour.userId,
    timeSlotId: data.timeSlotId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    participants: data.participants,
    totalAmount,
    selectedAddons: selectedAddons.map(a => ({
      addonId: a.id,
      name: a.name,
      price: a.price
    })),
    priceBreakdown: {
      basePrice,
      addonsTotal,
      totalAmount
    },
    status: 'pending',
    paymentStatus: 'pending'
  });
  
  // ... rest of booking logic ...
};
```

---

### Part 6: Email & Confirmation Updates

#### Booking Confirmation Email

```typescript
// Update email templates to show price breakdown

export function generateBookingConfirmationEmail(booking: Booking, tour: Tour) {
  // ... existing template ...
  
  const priceSection = booking.priceBreakdown ? `
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px;">Price Breakdown</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Tour (guiding fee)</span>
        <span style="font-weight: 500;">${formatCurrency(booking.priceBreakdown.basePrice)}</span>
      </div>
      
      ${booking.selectedAddons?.map(addon => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #6b7280;">
          <span>${addon.name}</span>
          <span>+${formatCurrency(addon.price)}</span>
        </div>
      `).join('') || ''}
      
      <div style="border-top: 2px solid #e5e7eb; margin: 12px 0; padding-top: 12px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 18px;">Total</span>
          <span style="font-weight: 600; font-size: 18px; color: #059669;">
            ${formatCurrency(booking.priceBreakdown.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  ` : `
    <!-- Fallback to simple total -->
    <div style="font-size: 24px; font-weight: bold; margin: 16px 0;">
      Total: ${formatCurrency(booking.totalAmount)}
    </div>
  `;
  
  return template.replace('{{PRICE_SECTION}}', priceSection);
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Database schema updates
- [ ] Migration scripts
- [ ] TypeScript type definitions
- [ ] Backend API updates for new pricing models

### Phase 2: Tour Management UI (Week 2)
- [ ] TourForm.svelte pricing model selector
- [ ] Group tier configuration UI
- [ ] Add-ons configuration UI
- [ ] Template presets for common use cases
- [ ] Validation logic

### Phase 3: Booking Flow (Week 3)
- [ ] Booking page tier selector
- [ ] Add-ons selection UI
- [ ] Price breakdown display
- [ ] Validation & error handling
- [ ] Mobile responsiveness

### Phase 4: Integration & Polish (Week 4)
- [ ] Email templates with breakdowns
- [ ] Dashboard analytics for tiers/add-ons
- [ ] Tour guide analytics (which tiers sell best)
- [ ] Documentation & help content
- [ ] Testing & bug fixes

---

## Success Metrics

### For Tour Guides
- **Pricing Flexibility:** Ability to create fair pricing for 1-8+ person groups
- **Transparency:** Clear separation of guiding fees vs. hard costs
- **Conversion:** Increased booking conversion due to fair pricing
- **Simplification:** Reduce need for duplicate tours (car vs. minivan)

### For Customers
- **Fairness:** Pay appropriate price for group size
- **Clarity:** Understand what's included vs. optional
- **Choice:** Select add-ons based on preferences/budget
- **Trust:** See transparent cost breakdown

### For Platform (Zaur)
- **Differentiation:** Feature no other platform offers this way
- **Indie Guide Appeal:** Solves real pain point for target market
- **No Commission Advantage:** Highlighted by separating base vs. add-ons
- **Retention:** Guides stay because platform solves their needs

---

## Competitive Advantage

### What Makes This Different

1. **Flexible Tiers (Not Fixed)**
   - Other platforms: Fixed per-person or fixed group price
   - Zaur: Unlimited custom tiers (1-2, 3-4, 5-8, etc.)

2. **Add-ons Separated from Base**
   - Other platforms: All-inclusive pricing (guides pay commission on costs)
   - Zaur: Optional add-ons + no commission = guides keep 100%

3. **Built for Indie Guides**
   - Other platforms: One-size-fits-all pricing
   - Zaur: Flexible models that match real-world tour economics

4. **Transparency First**
   - Customers see exactly what they're paying for
   - Guides control pricing strategy
   - Platform doesn't extract hidden fees

---

## Example Use Cases

### Use Case 1: Private Walking Tour with Transport Options

**Tour:** Historic Prague Walking Tour

**Pricing Model:** Hybrid (Group Tiers + Add-ons)

**Group Tiers:**
- 1-2 people (Solo/Couple): €120
- 3-4 people (Small Group): €200  
- 5-6 people (Family): €280
- 7-8 people (Large Group): €350

**Optional Add-ons:**
- 🚗 Transport (car, 1-4 people): €60
- 🚐 Transport (minivan, 5-8 people): €100
- 🍽️ Traditional Lunch: €25/person
- 📷 Professional Photos: €40

**Customer Experience:**
- Select: 6 people → Sees €280 base price
- Adds: Minivan transport → +€100
- Adds: Lunch for 6 → +€150
- **Total: €530** (fair for family of 6, guide keeps 100%)

---

### Use Case 2: Multi-Day Tour with Accommodation

**Tour:** 3-Day Transylvania Adventure

**Pricing Model:** Hybrid

**Group Tiers:**
- 1 person: €450
- 2 people: €650
- 3-4 people: €900
- 5-6 people: €1,100

**Required Add-ons:**
- 🚗 Transport & Fuel (all 3 days): €180

**Optional Add-ons:**
- 🏨 Accommodation (2 nights, per person): €120
- 🍽️ All Meals Included: €80/person
- 🎫 Castle Entry Fees: €30/person

**Customer Experience:**
- 2 people booking
- Base: €650
- Transport (required): €180
- Accommodation for 2: €240
- Meals for 2: €160
- Entry fees for 2: €60
- **Total: €1,290** → Clear breakdown, guide doesn't pay commission on hotels/fuel

---

## Future Enhancements (Post-MVP)

### Advanced Features (V2)
- **Dynamic Pricing:** Seasonal tiers, weekday vs. weekend
- **Bulk Discounts:** Automatic discounts for 10+ people
- **Package Deals:** "Add accommodation + meals" bundle discount
- **Variable Capacity:** Different tier maximums based on vehicle availability
- **Multi-currency Add-ons:** Add-ons in different currencies (for international bookings)

### Analytics & Insights (V2)
- **Tier Performance:** Which group sizes book most often
- **Add-on Adoption:** Which add-ons sell best
- **Revenue Optimization:** Suggest optimal tier structure based on booking data
- **Competitor Comparison:** Compare pricing to similar tours

---

## Technical Considerations

### Performance
- JSON columns are indexed and optimized
- Tier calculation is O(n) where n = number of tiers (typically < 10)
- Add-on selection is client-side until booking submission

### Backward Compatibility
- Existing tours default to `per_person` model
- Tours with `enablePricingTiers` migrate to `adult_child`
- Old booking records work with new schema (null add-ons = empty array)
- No breaking changes to public API

### Data Validation
- Min participants ≤ Max participants
- No overlapping tiers
- Required add-ons must be selected
- Tier prices must be ≥ minimum charge amount
- Add-on prices can be 0 (free extras)

### Edge Cases Handled
- No tier matches group size → Error with suggestion
- Capacity exceeded → Prevent tier selection
- Required add-on deselected → Re-select automatically
- Tier deleted with active bookings → Keep booking data intact
- Tour pricing model changed → Warn about existing bookings

---

## Questions for Stakeholders

1. **Pricing Limits:** Should we limit number of tiers (e.g., max 10)?
2. **Add-on Limits:** Max number of add-ons per tour (e.g., max 8)?
3. **Subscription Tiers:** Should group pricing be available on all plans or Professional+ only?
4. **Template Library:** Should we provide industry-specific templates (walking tours, driving tours, multi-day)?
5. **Commission Model:** If we ever add commissions, should they apply to add-ons or only base price?

---

## Conclusion

This feature directly solves a **critical pain point** expressed by our target market (indie tour guides). By implementing flexible group-based pricing and transparent add-ons, Zaur becomes the **only platform** that truly understands and supports the economics of private tours.

The combination of:
- No commission (existing advantage)
- Flexible group pricing (new feature)
- Transparent add-ons (new feature)

Creates an **unbeatable value proposition** for independent tour guides running private and semi-private experiences.

---

**Recommended Decision:** ✅ Implement this feature as a major release (v2.0) given its strategic importance and competitive differentiation.
