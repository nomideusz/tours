# Group Pricing & Add-ons - Code Examples

Quick reference for implementing the most critical parts of the group pricing feature.

---

## 1. Database Schema (Drizzle)

```typescript
// src/lib/db/schema/drizzle.ts

// Pricing model enum
export const pricingModelEnum = pgEnum('pricing_model', [
  'per_person',
  'adult_child',
  'group_tiers',
  'hybrid'
]);

// Updated tours table
export const tours = pgTable('tours', {
  // ... existing fields ...
  
  // Pricing model
  pricingModel: pricingModelEnum('pricing_model').default('per_person'),
  
  // Group pricing tiers
  groupPricingTiers: json('group_pricing_tiers').$type<{
    tiers: Array<{
      minParticipants: number;
      maxParticipants: number;
      price: number;
      label?: string;
    }>;
  }>(),
  
  // Optional add-ons
  optionalAddons: json('optional_addons').$type<{
    addons: Array<{
      id: string;
      name: string;
      description?: string;
      price: number;
      required: boolean;
      icon?: string;
    }>;
  }>(),
  
  // ... rest of fields ...
});

// Updated bookings table
export const bookings = pgTable('bookings', {
  // ... existing fields ...
  
  // Selected add-ons
  selectedAddons: json('selected_addons').$type<Array<{
    addonId: string;
    name: string;
    price: number;
  }>>(),
  
  // Price breakdown
  priceBreakdown: json('price_breakdown').$type<{
    basePrice: number;
    addonsTotal: number;
    totalAmount: number;
  }>(),
  
  // ... rest of fields ...
});
```

---

## 2. Price Calculation Logic

```typescript
// src/lib/utils/pricing-calculations.ts

import type { Tour, Booking } from '$lib/types';

export interface PriceCalculation {
  basePrice: number;
  addonsTotal: number;
  totalAmount: number;
  selectedTier?: {
    minParticipants: number;
    maxParticipants: number;
    price: number;
    label?: string;
  };
}

/**
 * Calculate booking price based on tour pricing model
 */
export function calculateBookingPrice(
  tour: Tour,
  participants: number,
  selectedAddonIds: string[] = [],
  adultCount?: number,
  childCount?: number
): PriceCalculation {
  let basePrice = 0;
  let selectedTier = undefined;
  
  // Calculate base price based on pricing model
  switch (tour.pricingModel) {
    case 'group_tiers':
    case 'hybrid':
      // Find applicable tier
      const tier = findTierForGroupSize(tour, participants);
      if (!tier) {
        throw new Error(`No pricing tier available for ${participants} participants`);
      }
      basePrice = tier.price;
      selectedTier = tier;
      break;
      
    case 'adult_child':
      if (!tour.pricingTiers?.adult) {
        throw new Error('Adult price not configured');
      }
      const adults = adultCount ?? participants;
      const children = childCount ?? 0;
      basePrice = (adults * tour.pricingTiers.adult) + 
                  (children * (tour.pricingTiers.child ?? 0));
      break;
      
    case 'per_person':
    default:
      basePrice = participants * parseFloat(tour.price);
      break;
  }
  
  // Calculate add-ons total
  let addonsTotal = 0;
  if (tour.pricingModel === 'hybrid' && tour.optionalAddons?.addons) {
    const selectedAddons = tour.optionalAddons.addons.filter(addon =>
      selectedAddonIds.includes(addon.id)
    );
    addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  }
  
  return {
    basePrice,
    addonsTotal,
    totalAmount: basePrice + addonsTotal,
    selectedTier
  };
}

/**
 * Find pricing tier for given group size
 */
export function findTierForGroupSize(
  tour: Tour,
  participants: number
): { minParticipants: number; maxParticipants: number; price: number; label?: string } | null {
  if (!tour.groupPricingTiers?.tiers) return null;
  
  return tour.groupPricingTiers.tiers.find(tier =>
    participants >= tier.minParticipants &&
    participants <= tier.maxParticipants
  ) || null;
}

/**
 * Validate required add-ons are selected
 */
export function validateRequiredAddons(
  tour: Tour,
  selectedAddonIds: string[]
): { valid: boolean; missingAddons: string[] } {
  if (tour.pricingModel !== 'hybrid' || !tour.optionalAddons?.addons) {
    return { valid: true, missingAddons: [] };
  }
  
  const requiredAddons = tour.optionalAddons.addons.filter(addon => addon.required);
  const missingAddons = requiredAddons.filter(addon =>
    !selectedAddonIds.includes(addon.id)
  ).map(addon => addon.name);
  
  return {
    valid: missingAddons.length === 0,
    missingAddons
  };
}

/**
 * Validate pricing tiers don't overlap
 */
export function validatePricingTiers(tiers: Array<{
  minParticipants: number;
  maxParticipants: number;
  price: number;
}>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check each tier is valid
  tiers.forEach((tier, index) => {
    if (tier.minParticipants > tier.maxParticipants) {
      errors.push(`Tier ${index + 1}: Min participants (${tier.minParticipants}) cannot be greater than max (${tier.maxParticipants})`);
    }
    if (tier.minParticipants < 1) {
      errors.push(`Tier ${index + 1}: Min participants must be at least 1`);
    }
    if (tier.price < 0) {
      errors.push(`Tier ${index + 1}: Price cannot be negative`);
    }
  });
  
  // Check for overlaps
  for (let i = 0; i < tiers.length; i++) {
    for (let j = i + 1; j < tiers.length; j++) {
      const tier1 = tiers[i];
      const tier2 = tiers[j];
      
      // Check if ranges overlap
      if (
        (tier1.minParticipants <= tier2.maxParticipants && tier1.maxParticipants >= tier2.minParticipants) ||
        (tier2.minParticipants <= tier1.maxParticipants && tier2.maxParticipants >= tier1.minParticipants)
      ) {
        errors.push(`Tiers ${i + 1} and ${j + 1} overlap (${tier1.minParticipants}-${tier1.maxParticipants} vs ${tier2.minParticipants}-${tier2.maxParticipants})`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 3. Booking API Endpoint

```typescript
// src/routes/api/bookings/+server.ts

import { calculateBookingPrice, validateRequiredAddons } from '$lib/utils/pricing-calculations';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await request.json();
  const {
    tourId,
    timeSlotId,
    participants,
    adultCount,
    childCount,
    selectedAddonIds = [],
    customerName,
    customerEmail,
    customerPhone
  } = data;
  
  // Fetch tour
  const tour = await db.query.tours.findFirst({
    where: eq(tours.id, tourId)
  });
  
  if (!tour) {
    return json({ error: 'Tour not found' }, { status: 404 });
  }
  
  // Validate required add-ons
  const addonValidation = validateRequiredAddons(tour, selectedAddonIds);
  if (!addonValidation.valid) {
    return json({
      error: `Required add-ons not selected: ${addonValidation.missingAddons.join(', ')}`
    }, { status: 400 });
  }
  
  // Calculate price
  let priceCalculation;
  try {
    priceCalculation = calculateBookingPrice(
      tour,
      participants,
      selectedAddonIds,
      adultCount,
      childCount
    );
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
  
  // Get selected add-ons details
  const selectedAddons = tour.optionalAddons?.addons
    ?.filter(addon => selectedAddonIds.includes(addon.id))
    .map(addon => ({
      addonId: addon.id,
      name: addon.name,
      price: addon.price
    })) || [];
  
  // Create booking
  const [booking] = await db.insert(bookings).values({
    id: createId(),
    tourId,
    userId: tour.userId,
    timeSlotId,
    customerName,
    customerEmail,
    customerPhone,
    participants,
    totalAmount: priceCalculation.totalAmount,
    selectedAddons,
    priceBreakdown: {
      basePrice: priceCalculation.basePrice,
      addonsTotal: priceCalculation.addonsTotal,
      totalAmount: priceCalculation.totalAmount
    },
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date()
  }).returning();
  
  // ... rest of booking logic (payment, notifications, etc.)
  
  return json({ booking }, { status: 201 });
};
```

---

## 4. Tour Form Component (Tier Management)

```svelte
<!-- src/lib/components/TourForm.svelte (excerpt) -->

<script lang="ts">
  import { createId } from '@paralleldrive/cuid2';
  import type { GroupPricingTier, OptionalAddon } from '$lib/types';
  
  // ... existing props ...
  
  // Tier management
  function addPricingTier() {
    if (!formData.groupPricingTiers) {
      formData.groupPricingTiers = { tiers: [] };
    }
    
    formData.groupPricingTiers.tiers.push({
      minParticipants: 1,
      maxParticipants: 10,
      price: 0,
      label: ''
    });
    
    formData.groupPricingTiers = formData.groupPricingTiers; // Trigger reactivity
  }
  
  function removePricingTier(index: number) {
    if (formData.groupPricingTiers?.tiers) {
      formData.groupPricingTiers.tiers.splice(index, 1);
      formData.groupPricingTiers = formData.groupPricingTiers; // Trigger reactivity
    }
  }
  
  // Add-on management
  function addAddon() {
    if (!formData.optionalAddons) {
      formData.optionalAddons = { addons: [] };
    }
    
    formData.optionalAddons.addons.push({
      id: createId(),
      name: '',
      description: '',
      price: 0,
      required: false,
      icon: 'other'
    });
    
    formData.optionalAddons = formData.optionalAddons; // Trigger reactivity
  }
  
  function removeAddon(index: number) {
    if (formData.optionalAddons?.addons) {
      formData.optionalAddons.addons.splice(index, 1);
      formData.optionalAddons = formData.optionalAddons; // Trigger reactivity
    }
  }
  
  // Quick templates
  function applyTemplate(templateName: 'private_tour' | 'small_group') {
    if (templateName === 'private_tour') {
      formData.groupPricingTiers = {
        tiers: [
          { minParticipants: 1, maxParticipants: 2, price: 150, label: 'Solo/Couple' },
          { minParticipants: 3, maxParticipants: 4, price: 250, label: 'Small Group' },
          { minParticipants: 5, maxParticipants: 8, price: 400, label: 'Family' }
        ]
      };
    } else if (templateName === 'small_group') {
      formData.groupPricingTiers = {
        tiers: [
          { minParticipants: 1, maxParticipants: 3, price: 180, label: 'Mini Group' },
          { minParticipants: 4, maxParticipants: 8, price: 320, label: 'Small Group' },
          { minParticipants: 9, maxParticipants: 12, price: 480, label: 'Standard Group' }
        ]
      };
    }
  }
</script>

<!-- Pricing Model Selector -->
<div class="space-y-4">
  <label class="form-label">Pricing Model</label>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <button
      type="button"
      class="pricing-model-card {formData.pricingModel === 'group_tiers' ? 'selected' : ''}"
      onclick={() => formData.pricingModel = 'group_tiers'}
    >
      <Users class="w-5 h-5" />
      <div>
        <div class="font-medium">Group Size Tiers</div>
        <div class="text-xs text-secondary">Price based on total group size</div>
        <span class="badge-new">New</span>
      </div>
    </button>
    
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
  <!-- Group Pricing Tiers -->
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
        
        <div class="tier-preview">
          {#if tier.minParticipants && tier.maxParticipants && tier.price}
            {tier.minParticipants}-{tier.maxParticipants} people: 
            <strong>{currencySymbol}{tier.price}</strong>
            <span class="text-xs text-tertiary">
              ({currencySymbol}{(tier.price / ((tier.minParticipants + tier.maxParticipants) / 2)).toFixed(2)}/person avg)
            </span>
          {/if}
        </div>
      </div>
    {/each}
    
    <!-- Quick Templates -->
    {#if !formData.groupPricingTiers?.tiers?.length}
      <div class="templates-section">
        <p class="text-sm text-secondary mb-2">Quick Start:</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            type="button"
            onclick={() => applyTemplate('private_tour')}
            class="button-secondary button--small"
          >
            Private Tour (1-8)
          </button>
          <button
            type="button"
            onclick={() => applyTemplate('small_group')}
            class="button-secondary button--small"
          >
            Small Group (1-12)
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- Hidden input for form submission -->
<input 
  type="hidden" 
  name="pricingModel" 
  value={formData.pricingModel} 
/>
<input 
  type="hidden" 
  name="groupPricingTiers" 
  value={JSON.stringify(formData.groupPricingTiers || null)} 
/>
```

---

## 5. Booking Page Component (Tier Selection)

```svelte
<!-- src/routes/(public)/book/[code]/+page.svelte (excerpt) -->

<script lang="ts">
  import { calculateBookingPrice } from '$lib/utils/pricing-calculations';
  
  let selectedTier = $state<any>(null);
  let participantCount = $state(1);
  let selectedAddonIds = $state<string[]>([]);
  
  // Calculate total price reactively
  let totalPrice = $derived(() => {
    if (!tour) return 0;
    
    try {
      const calculation = calculateBookingPrice(
        tour,
        participantCount,
        selectedAddonIds
      );
      return calculation.totalAmount;
    } catch {
      return 0;
    }
  });
  
  // Select a tier
  function selectTier(tier: any) {
    selectedTier = tier;
    // Default to minimum participants in tier
    participantCount = tier.minParticipants;
  }
  
  // Toggle add-on selection
  function toggleAddon(addon: any, checked: boolean) {
    if (checked) {
      selectedAddonIds = [...selectedAddonIds, addon.id];
    } else {
      // Don't allow deselecting required add-ons
      if (addon.required) {
        return;
      }
      selectedAddonIds = selectedAddonIds.filter(id => id !== addon.id);
    }
  }
  
  // Check if tier can be selected (based on availability)
  function canSelectTier(tier: any, timeSlot: any): boolean {
    if (!timeSlot) return false;
    const availableSpots = timeSlot.availableSpots - (timeSlot.bookedSpots || 0);
    return tier.minParticipants <= availableSpots;
  }
</script>

{#if tour.pricingModel === 'group_tiers' || tour.pricingModel === 'hybrid'}
  <!-- Tier Selection -->
  <div class="booking-section">
    <h3 class="section-title">How many people?</h3>
    
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
    
    <!-- Fine-tune participant count -->
    {#if selectedTier}
      <div class="participant-fine-tune">
        <label class="text-sm font-medium">Exact number:</label>
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

{#if tour.pricingModel === 'hybrid' && tour.optionalAddons?.addons?.length}
  <!-- Add-ons Selection -->
  <div class="booking-section">
    <h3 class="section-title">Add-ons (Optional)</h3>
    
    <div class="addons-list">
      {#each tour.optionalAddons.addons as addon}
        {@const isSelected = selectedAddonIds.includes(addon.id)}
        <label class="addon-checkbox-card {isSelected ? 'selected' : ''}">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={addon.required}
            onchange={(e) => toggleAddon(addon, e.currentTarget.checked)}
          />
          
          <div class="addon-icon">
            {#if addon.icon === 'car'}
              <Car class="w-5 h-5" />
            {:else if addon.icon === 'bed'}
              <Bed class="w-5 h-5" />
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

<!-- Price Summary -->
<div class="price-summary-card">
  <div class="price-breakdown">
    <div class="price-line">
      <span>Tour (guiding fee)</span>
      <span class="price-amount">{formatCurrency(selectedTier?.price || 0)}</span>
    </div>
    
    {#if selectedAddonIds.length > 0}
      {#each tour.optionalAddons?.addons?.filter(a => selectedAddonIds.includes(a.id)) || [] as addon}
        <div class="price-line price-line-addon">
          <span>{addon.name}</span>
          <span class="price-amount">+{formatCurrency(addon.price)}</span>
        </div>
      {/each}
    {/if}
    
    <div class="price-line-divider"></div>
    
    <div class="price-line price-line-total">
      <span class="font-semibold">Total</span>
      <span class="price-total">{formatCurrency(totalPrice())}</span>
    </div>
  </div>
</div>

<!-- Hidden form inputs -->
<input type="hidden" name="participants" value={participantCount} />
<input type="hidden" name="selectedAddonIds" value={JSON.stringify(selectedAddonIds)} />
```

---

## 6. Migration Script

```sql
-- migration: 0023_add_group_pricing.sql

-- Create pricing model enum
DO $$ BEGIN
  CREATE TYPE pricing_model AS ENUM ('per_person', 'adult_child', 'group_tiers', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to tours table
ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS pricing_model pricing_model DEFAULT 'per_person',
  ADD COLUMN IF NOT EXISTS group_pricing_tiers JSON,
  ADD COLUMN IF NOT EXISTS optional_addons JSON;

-- Migrate existing tours
UPDATE tours
SET pricing_model = CASE
  WHEN enable_pricing_tiers = true THEN 'adult_child'::pricing_model
  ELSE 'per_person'::pricing_model
END;

-- Add columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS selected_addons JSON,
  ADD COLUMN IF NOT EXISTS price_breakdown JSON;

-- Update existing bookings with simple breakdown
UPDATE bookings
SET price_breakdown = json_build_object(
  'basePrice', total_amount,
  'addonsTotal', 0,
  'totalAmount', total_amount
)
WHERE price_breakdown IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tours_pricing_model ON tours(pricing_model);

-- Add comments
COMMENT ON COLUMN tours.pricing_model IS 'Pricing model: per_person, adult_child, group_tiers, or hybrid';
COMMENT ON COLUMN tours.group_pricing_tiers IS 'Group-based pricing tiers';
COMMENT ON COLUMN tours.optional_addons IS 'Optional add-ons';
COMMENT ON COLUMN bookings.selected_addons IS 'Add-ons selected for this booking';
COMMENT ON COLUMN bookings.price_breakdown IS 'Price breakdown';
```

---

These code examples provide a solid foundation for implementing the group pricing feature. Adapt them based on your specific requirements and coding standards!

