# Strategy: Extracting Reusable Parts to New shadcn-svelte Project

## Overview

This document outlines a strategy for starting a new project using **shadcn-svelte** (Svelte 5 runes) while reusing select parts from the current tours platform.

---

## 🎯 Project Analysis

### Current Stack
- **Framework**: SvelteKit 2.x with Svelte 5
- **Styling**: Tailwind CSS 4.x (custom components)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Lucia Auth
- **Forms**: Felte + Yup validation
- **State**: Svelte 5 runes + stores
- **UI**: Custom components (no component library)

### Target Stack
- **Framework**: SvelteKit 2.x with Svelte 5 runes
- **Styling**: Tailwind CSS + **shadcn-svelte**
- **Component System**: shadcn-svelte components
- **Everything else**: TBD based on needs

---

## 📋 Extraction Strategy

### Phase 1: Core Utilities (Highest Priority)

These are **framework-agnostic** and can be extracted immediately:

#### ✅ **Extract First** (Low Risk, High Value)

1. **Date & Time Utilities** (`src/lib/utils/date-helpers.ts`)
   - `formatDate()`, `formatTime()`, `formatDateTime()`
   - Framework-independent, pure functions
   - **Action**: Copy directly, minimal changes

2. **Currency Utilities** (`src/lib/utils/currency.ts`)
   - `formatEuro()`, `parseCurrency()`, `formatCurrency()`
   - Pure utility functions
   - **Action**: Copy directly

3. **Type Definitions** (`src/lib/types.d.ts`)
   - Shared TypeScript interfaces
   - **Action**: Extract relevant types only

4. **Validation Logic** (`src/lib/validation.ts`)
   - Form validation schemas
   - **Action**: Extract Yup schemas, adapt to new form library if needed

#### ⚠️ **Extract Carefully** (Requires Adaptation)

5. **Client-Side Tour Helpers** (`src/lib/utils/tour-helpers-client.ts`)
   - `formatDuration()`, `formatTourPrice()`
   - **Action**: Extract pure formatting functions, skip API calls

6. **Time Utilities** (`src/lib/components/time-slot-form/utils/time-utils.ts`)
   - `findNextAvailableTime()` - complex logic
   - **Action**: Extract if time slot logic is needed

---

### Phase 2: Reusable Components (Medium Priority)

#### 🎨 **Components to Adapt**

1. **Simple UI Components** (Easiest to migrate)
   - `LoadingSpinner.svelte` → Replace with shadcn-svelte `Spinner`
   - `EmptyState.svelte` → Replace with shadcn-svelte patterns
   - `ErrorAlert.svelte` → Replace with shadcn-svelte `Alert`

2. **Form Components** (Moderate effort)
   - `NumberInput.svelte` → Replace with shadcn-svelte `Input`
   - `TagsInput.svelte` → Use shadcn-svelte `Combobox` or `Select`
   - `DurationInput.svelte` → Build with shadcn-svelte primitives

3. **Complex Components** (High effort - consider rebuilding)
   - `LocationPicker.svelte` → Rebuild with shadcn-svelte `Dialog` + `DialogContent`
   - `TourForm.svelte` → Too complex, rebuild from scratch
   - `TimeSlotForm.svelte` → Rebuild with shadcn-svelte form components

#### ⚠️ **Components to Skip** (Too Domain-Specific)

- `TourCard.svelte` - Tour-specific
- `BookingCalendar.svelte` - Booking-specific
- `Pricing` components - Domain-specific business logic
- Weather components - Domain-specific

---

### Phase 3: Business Logic (Low Priority - Extract Only If Needed)

1. **Auth System** (`src/lib/auth/`)
   - Lucia Auth setup
   - **Decision**: Only if you need auth in the new project
   - **Action**: Copy structure, adapt to new project needs

2. **Database Schema** (`src/lib/db/schema/`)
   - Drizzle ORM schemas
   - **Decision**: Only if similar data model needed
   - **Action**: Extract relevant tables only

3. **API Patterns** (`src/routes/api/`)
   - Server-side API routes
   - **Decision**: Extract patterns, not implementations
   - **Action**: Use as reference for API structure

---

## 🛠️ Implementation Plan

### Step 1: Setup New Project

```bash
# Initialize new SvelteKit project
npm create svelte@latest new-project
cd new-project

# Install shadcn-svelte
npx shadcn-svelte@latest init

# Install core dependencies
pnpm add -D tailwindcss postcss autoprefixer
pnpm add date-fns yup  # If using these utilities
```

### Step 2: Extract Utilities

1. Create `src/lib/utils/` directory
2. Copy utility files:
   - `date-helpers.ts`
   - `currency.ts`
   - Extract relevant types from `types.d.ts`
3. Remove any domain-specific dependencies
4. Test utilities independently

### Step 3: Setup shadcn-svelte Components

```bash
# Install commonly needed components
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add input
npx shadcn-svelte@latest add select
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add alert
npx shadcn-svelte@latest add form
npx shadcn-svelte@latest add card
npx shadcn-svelte@latest add table
```

### Step 4: Rebuild Components with shadcn-svelte

For each component you need:

1. **Identify the equivalent shadcn-svelte component**
2. **Extract the logic** (not the UI)
3. **Rebuild the UI** using shadcn-svelte primitives
4. **Keep the extracted utility functions**

Example:
- Old: `LoadingSpinner.svelte` (custom)
- New: shadcn-svelte `Spinner` or `Loader2` icon
- Logic: Keep any loading state management utilities

---

## 📦 What to Extract Checklist

### ✅ **Safe to Extract** (Pure Utilities)
- [x] `src/lib/utils/date-helpers.ts`
- [x] `src/lib/utils/currency.ts`
- [x] `src/lib/utils/tour-helpers-client.ts` (formatting functions only)
- [x] Pure TypeScript utility functions
- [x] Type definitions (extract relevant ones)

### ⚠️ **Extract with Caution** (Requires Adaptation)
- [ ] Form validation schemas (`src/lib/validation.ts`)
- [ ] Time calculation utilities (`time-utils.ts`)
- [ ] Client-side stores patterns (`src/lib/stores/`) - adapt to runes
- [ ] Email utilities (`src/lib/email/`) - if email needed

### ❌ **Don't Extract** (Domain-Specific or Too Complex)
- [ ] Tour-specific components (`TourForm.svelte`, `TourCard.svelte`)
- [ ] Booking-specific components
- [ ] Database schemas (unless needed)
- [ ] API routes (use as reference only)
- [ ] Weather/maps integrations (unless needed)
- [ ] Payment integrations (Stripe-specific)
- [ ] Complex business logic tied to tours domain

---

## 🎨 Component Migration Strategy

### Pattern: Extract Logic, Rebuild UI

**Before (Custom Component):**
```svelte
<!-- NumberInput.svelte -->
<script>
  export let value;
  export let label;
</script>
<input type="number" bind:value />
```

**After (shadcn-svelte):**
```svelte
<!-- NumberInput.svelte -->
<script>
  import { Input } from '$lib/components/ui/input';
  export let value;
  export let label;
</script>
<Input type="number" bind:value />
```

### Pattern: Complex Components → Composition

**Before:** Monolithic `TourForm.svelte` (2700+ lines)

**After:** 
- Extract form logic to utilities
- Rebuild with shadcn-svelte `Form`, `Input`, `Select`, `Dialog`
- Use composition pattern

---

## 📁 Recommended New Project Structure

```
new-project/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── ui/          # shadcn-svelte components
│   │   ├── utils/
│   │   │   ├── date-helpers.ts    # Extracted
│   │   │   ├── currency.ts        # Extracted
│   │   │   └── validation.ts      # Adapted from original
│   │   └── types.ts               # Extracted types
│   └── routes/
└── components.json               # shadcn-svelte config
```

---

## 🔄 Migration Workflow

### For Each Component:

1. **Analyze**: What does it do? (logic vs. UI)
2. **Extract**: Move pure logic to utilities
3. **Identify**: Which shadcn-svelte component(s) match?
4. **Rebuild**: Create new component using shadcn-svelte
5. **Test**: Verify functionality matches

### Example: Migrating `DurationInput`

1. **Analyze**: 
   - UI: Number input + dropdown for units
   - Logic: Convert between minutes/hours

2. **Extract Logic**:
   ```typescript
   // src/lib/utils/duration.ts
   export function minutesToHours(minutes: number): number { ... }
   export function hoursToMinutes(hours: number): number { ... }
   ```

3. **Rebuild with shadcn-svelte**:
   ```svelte
   <script>
     import { Input } from '$lib/components/ui/input';
     import { Select } from '$lib/components/ui/select';
     import { minutesToHours, hoursToMinutes } from '$lib/utils/duration';
   </script>
   ```

---

## 🚀 Quick Start Commands

```bash
# 1. Create new project
npm create svelte@latest new-project
cd new-project

# 2. Setup shadcn-svelte
npx shadcn-svelte@latest init

# 3. Copy utilities (from current project)
mkdir -p src/lib/utils
cp ../tours/src/lib/utils/date-helpers.ts src/lib/utils/
cp ../tours/src/lib/utils/currency.ts src/lib/utils/

# 4. Install common shadcn components
npx shadcn-svelte@latest add button input select dialog form card

# 5. Start building with shadcn components
```

---

## 💡 Best Practices

1. **Start Small**: Extract utilities first, then rebuild components
2. **Don't Copy Large Components**: Rebuild them with shadcn-svelte patterns
3. **Extract Logic Separately**: Keep business logic separate from UI
4. **Test Utilities Independently**: Ensure they work without dependencies
5. **Use shadcn-svelte Patterns**: Follow their composition patterns
6. **Adapt, Don't Copy**: Customize for your new project's needs

---

## 🎯 Decision Framework

**Should I extract this?**

- ✅ **Yes** if: Pure utility function, no dependencies, framework-agnostic
- ⚠️ **Maybe** if: Requires minor adaptation, useful logic but tied to UI
- ❌ **No** if: Domain-specific, too complex, tightly coupled to tours logic

---

## 📚 Resources

- [shadcn-svelte Documentation](https://www.shadcn-svelte.com/)
- [Svelte 5 Runes Guide](https://svelte.dev/docs/svelte/runes)
- Current project utilities: `src/lib/utils/README.md`

---

## Summary

**Extract (Safe):**
- Pure utility functions (date, currency, formatting)
- Type definitions
- Simple validation logic

**Rebuild (Better Approach):**
- All UI components → Use shadcn-svelte instead
- Complex components → Extract logic, rebuild UI

**Skip (Domain-Specific):**
- Tour/booking-specific components
- Business logic tied to tours domain
- Database schemas (unless needed)

**Key Principle**: Extract logic, rebuild UI with shadcn-svelte.

