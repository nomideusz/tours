# TourForm.svelte - Comprehensive Refactoring Analysis

**File:** `/home/user/tours/src/lib/components/TourForm.svelte`  
**Total Lines:** 2,722  
**Current Status:** Large monolithic component that needs modularization

---

## SECTION BREAKDOWN

### 1. BASIC INFORMATION SECTION
**Lines:** 989-1266  
**Size:** ~277 lines  
**Section Marker:** HTML comments at lines 989-991

**Contains:**
- Name field (lines 1003-1034)
- Description field with Tipex rich text editor (lines 1036-1097)
- Meeting Point location picker (lines 1099-1134)
- Duration input (lines 1139-1162)
- Categories selector (lines 1164-1187)
- Languages selector (lines 1189-1212)
- What's Included chip input (lines 1214-1237)
- Requirements chip input (lines 1239-1262)

**Dependencies/Props Used:**
- `formData` (bindable): name, description, location, locationPlaceId, duration, categories, languages, includedItems, requirements
- `hideLabels` (prop)
- `descriptionEditor` (state)
- `descriptionCharCount` (state)
- `MAX_DESCRIPTION_LENGTH` (const)
- `allErrors` (derived)
- `shouldShowError()` (function)
- `getFieldError()` (function)
- `hasFieldError()` (function)
- `handleFieldInput()` (function)
- `validateField()` (function)
- Various icons: Edit, FileText, MapPin, Calendar, Palette, Globe, Package, AlertCircle

**Extracted Components Used:**
- LocationPicker (line 1109)
- DurationInput (line 1148)
- CategorySelector (line 1173)
- LanguageSelector (line 1198)
- ChipInput x2 (lines 1223, 1248)
- TourDescriptionControls (line 1076)

**Shared State/Complex Interactions:**
- Description editor state management with Tipex (multiline effect at 311-325, 1052-1064, 1065-1071)
- Character count tracking for description
- Field-level validation tied to blur/input events
- Multi-field validation orchestration

**Extraction Difficulty:** **MEDIUM**
- Already uses extracted components for some fields (LocationPicker, DurationInput, CategorySelector, LanguageSelector)
- Rich text editor (Tipex) requires careful state management
- ChipInput components are already extracted
- Would need to pass: formData (via binding), validation state, error handlers, icons

**Recommendation:** ✅ **EXTRACT to `BasicInformationSection.svelte`**
- Rationale: Can group all basic tour details together
- Already uses extracted sub-components
- Self-contained with clear data dependencies
- Would reduce main file by ~277 lines

---

### 2. TOUR IMAGES SECTION
**Lines:** 1268-1415  
**Size:** ~147 lines  
**Section Marker:** HTML comments at lines 1268-1270

**Contains:**
- Existing images display grid (lines 1275-1319)
- Image upload area with file input (lines 1321-1348)
- Image upload error display (lines 1350-1365)
- Image preview grid (lines 1367-1412)

**Dependencies/Props Used:**
- `onImageUpload` (prop)
- `onImageRemove` (prop)
- `existingImages` (prop)
- `onExistingImageRemove` (prop)
- `getExistingImageUrl` (prop)
- `uploadedImages` (bindable)
- `imageUploadErrors` (prop)
- `isEdit` (prop)
- `getImagePreview()` (function)

**Shared State/Complex Interactions:**
- Image file handling with preview generation
- Multiple callback handlers for different image operations
- Responsive grid layout with conditional rendering
- Mobile/desktop optimized upload UI

**Extraction Difficulty:** **EASY**
- Self-contained with clear inputs/outputs
- Minimal interaction with other form sections
- All callbacks clearly defined
- No complex state interdependencies

**Recommendation:** ✅ **EXTRACT to `TourImagesSection.svelte`**
- Rationale: Completely independent functionality
- Clear prop interface
- Would reduce main file by ~147 lines
- Easy to test in isolation

---

### 3. PRICING SECTION
**Lines:** 1417-1553  
**Size:** ~136 lines  
**Section Marker:** HTML comments at lines 1417-1419

**Contains:**
- SimplifiedPricingSection component (lines 1422-1532)
- Hidden form inputs for submission (lines 1534-1551)

**Dependencies/Props Used:**
- `formData` (bindable): pricingModel, participantCategories, privateTour, groupDiscounts, optionalAddons, guidePaysStripeFee, countInfantsTowardCapacity, capacity, duration
- SimplifiedPricingSection sub-component with many callbacks:
  - `onModelChange`
  - `onParticipantCategoriesUpdate`
  - `onPrivateTourUpdate`
  - `onGroupDiscountsUpdate`
  - `onAddonsUpdate`
  - `onStripeFeeUpdate`
  - `onPriceUpdate`
  - `onValidate`
- `allErrors` (derived)
- `savedPerPersonPrice` (state)
- `validateField()` (function)
- `getFieldError()` (function)

**Shared State/Complex Interactions:**
- `savedPerPersonPrice` state is referenced in pricing model initialization effects (lines 516-518, 564, 594, 1442, 1466)
- Complex callback handlers for model switching and data updates
- Tight coupling with form-level validation

**Extraction Difficulty:** **HARD**
- Already partially extracted (SimplifiedPricingSection)
- Heavy reliance on formData binding and multiple callbacks
- `savedPerPersonPrice` state needs to be accessible for pricing initialization
- Complex pricing model migration logic in the main component

**Recommendation:** ⚠️ **KEEP IN MAIN or REFACTOR CAREFULLY**
- Rationale: Already uses extracted pricing component, but main form orchestrates pricing logic
- Could consider extracting a wrapper component that manages pricing state
- The SimplifiedPricingSection handles most UI/UX, but main component controls pricing model

---

### 4. CANCELLATION POLICY SECTION
**Lines:** 1555-1725  
**Size:** ~170 lines  
**Section Marker:** HTML comments at lines 1555-1557

**Contains:**
- Collapsible header with policy summary badge (lines 1560-1584)
- Policy template options radio buttons (lines 1589-1617)
- Custom policy option (lines 1619-1642)
- Custom policy editor with:
  - Full refund window hours input (lines 1651-1677)
  - Policy preview (lines 1679-1686)
  - Optional custom notes textarea (lines 1688-1703)
  - Payment schedule info (lines 1707-1711)
  - Reminder about refund policies (lines 1712-1716)

**Dependencies/Props Used:**
- `formData` (bindable): cancellationPolicy, cancellationPolicyId
- `showCancellationPolicy` (state)
- `showCustomPolicy` (state)
- `selectedPolicyTemplate` (state)
- `customPolicyHours` (state)
- `customPolicyNotes` (state)
- `policyTemplates` (const array of 5 templates)
- Functions: `selectPolicyTemplate()`, `enableCustomPolicy()`, `validateCustomHours()`, `updateCustomPolicyId()`
- Effects: Lines 872-876, 879-883, 887-926 (policy initialization)

**Shared State/Complex Interactions:**
- Multiple reactive effects managing custom policy state (3 effects: 872-926)
- Complex policy text generation in `updateCustomPolicyId()` (lines 853-869)
- Policy template constants and selection logic
- Custom notes integration with policy text generation

**Extraction Difficulty:** **MEDIUM**
- Self-contained business logic for cancellation policies
- Some state is pure to this section (selectedPolicyTemplate, customPolicyHours, customPolicyNotes)
- Needs to bind to formData.cancellationPolicy and cancellationPolicyId
- Reactive effects are well-isolated to this feature

**Recommendation:** ✅ **EXTRACT to `CancellationPolicySection.svelte`**
- Rationale: Fully self-contained feature with clear state boundaries
- Policy logic is independent of other form sections
- Would reduce main file by ~170 lines
- All supporting functions and constants can be moved with it
- Easy to test policy selection and custom policy workflows

---

### 5. DANGER ZONE SECTION
**Lines:** 1728-1847  
**Size:** ~119 lines  
**Section Marker:** HTML comments at lines 1728-1730

**Contains:**
- Mobile compact view (lines 1732-1785)
  - Delete button with booking status
  - View bookings link
- Desktop full view (lines 1787-1846)
  - Full description and warnings
  - Conditional disabled state based on future bookings

**Dependencies/Props Used:**
- `isEdit` (prop)
- `onDelete` (callback)
- `hasFutureBookings` (prop)
- `isDeleting` (prop)
- `tourId` (prop)
- Icons: Calendar, Trash2

**Shared State/Complex Interactions:**
- Responsive design with mobile/desktop variants
- Conditional UI based on booking status
- Simple callback handler

**Extraction Difficulty:** **EASY**
- Completely self-contained
- Clear prop interface
- No form data dependencies
- Minimal state interactions

**Recommendation:** ✅ **EXTRACT to `DangerZoneSection.svelte`**
- Rationale: Independent danger action UI
- Clear prop interface with callbacks
- Would reduce main file by ~119 lines
- Easy to test and maintain separately

---

### 6. STATUS & VISIBILITY SIDEBAR SECTION
**Lines:** 1852-1986  
**Size:** ~134 lines  
**Section Marker:** HTML comments at lines 1852-1854

**Contains:**
- Mobile: Combined compact view (lines 1856-1908)
  - Status display (lines 1859-1879)
  - Show in Search toggle (lines 1882-1906)
- Desktop: Separate cards (lines 1910-1985)
  - Current Status card (lines 1912-1943)
  - Search Visibility card (lines 1946-1984)

**Dependencies/Props Used:**
- `isEdit` (prop)
- `hideStatusField` (prop)
- `formData` (bindable): status, publicListing
- Icons: CheckCircle, FileText, Globe

**Shared State/Complex Interactions:**
- Responsive UI with mobile/desktop variants
- Conditional visibility based on tour status
- Simple toggle for publicListing

**Extraction Difficulty:** **EASY**
- Self-contained sidebar UI
- Clear dependencies on formData
- Responsive design is internal to this component
- Minimal interactions with other sections

**Recommendation:** ✅ **EXTRACT to `StatusVisibilitySection.svelte`**
- Rationale: Completely independent sidebar UI
- Clear prop interface
- Would reduce main file by ~134 lines
- Desktop/mobile responsive code is contained

---

### 7. ACTION BUTTONS SECTION
**Lines:** 1988-2081  
**Size:** ~93 lines  
**Section Marker:** HTML comments at lines 1988-1991

**Contains:**
- Onboarding restriction notice (lines 1998-2013)
- Dual action buttons for draft/publish (lines 2015-2050)
  - Save/Activate primary button
  - Save as Draft secondary button
- Single action button fallback (lines 2052-2068)
- Cancel button (lines 2071-2078)

**Dependencies/Props Used:**
- `onPublish` (callback)
- `onSaveAsDraft` (callback)
- `onCancel` (callback)
- `onSubmit` (callback)
- `isSubmitting` (prop)
- `isEdit` (prop)
- `initialStatus` (state)
- `formData` (read: status)
- `canActivate` (derived)
- `allErrors` (derived)
- `missingSteps` (derived)
- `onboardingMessage` (derived)
- `hasMinimumRequiredFields` (derived)
- `handleSubmit()` (function)
- Icons: Save, CheckCircle, FileText, AlertCircle

**Shared State/Complex Interactions:**
- Button state dependent on multiple form validation states
- Onboarding check affects button availability
- Status-dependent button text and behavior

**Extraction Difficulty:** **MEDIUM**
- Relies on derived states from parent (canActivate, allErrors, hasMinimumRequiredFields)
- Button logic depends on form-level validation orchestration
- Multiple callback handlers

**Recommendation:** ✅ **EXTRACT to `ActionButtonsSection.svelte`**
- Rationale: Self-contained UI for actions
- Could receive validation state as props
- Would reduce main file by ~93 lines
- Clear responsibility separation

---

## SCRIPT SECTION ANALYSIS

**Lines:** 32-970  
**Size:** ~938 lines

### Script Organization:

#### A. Imports & Types (Lines 32-82)
- Icons, utility components, validation, stores, utilities
- Pricing types and components

#### B. Props Interface (Lines 83-168)
- Comprehensive prop definitions
- FormData shape definition (~52 lines)
- ~85 props/config options

#### C. State Initialization (Lines 170-387)
- Prop destructuring with $bindable
- Editor instance state
- Description processing (Tipex extensions, markdown conversion)
- Legacy capacity migration
- Data initialization for missing fields

#### D. Reactive Effects (Lines 310-604)
- Description loading from existing tours (310-325)
- Capacity migration (327-333)
- Pricing data initialization (335-387)
- Complex reactive effects for pricing initialization (503-604)

#### E. Validation System (Lines 393-638)
- Validation state (touchedFields, currentlyTypingFields)
- Derived validation state (allErrors)
- Trigger validation on demand

#### F. Field Handling Functions (Lines 641-769)
- `handleSubmit()` - Form submission handler
- `handleFieldInput()` - Input event tracking with typing debounce
- `validateField()` - Field-level validation with timeout management
- `shouldShowError()` - Error visibility logic
- `isValid()` / `validate()` - Exported validation functions

#### G. Cancellation Policy System (Lines 771-926)
- Policy templates array (5 templates)
- Policy selection functions
- Custom policy hours validation and generation
- Reactive effects for policy initialization

#### H. Utility Functions (Lines 928-970)
- `getImagePreview()` - File preview generation
- `scrollToFirstError()` - Mobile error focusing
- `validateWithMobileSupport()` - Mobile validation
- State initialization (savedPerPersonPrice)

### Key State Variables:
- `descriptionEditor` - Tipex editor instance
- `initialDescriptionLoaded` - Track initial load
- `descriptionCharCount`, `descriptionWordCount` - Character tracking
- `initialStatus` - Track tour status for button text
- `showAdvancedPricing`, `showCancellationPolicy` - Collapsible sections
- `validationErrors`, `touchedFields`, `currentlyTypingFields` - Validation state
- `selectedPolicyTemplate`, `customPolicyHours`, `customPolicyNotes` - Policy state
- `savedPerPersonPrice` - Pricing model migration support
- `pricingTouched` - Pricing section state

### Key Derived Values:
- `currencySymbol`, `minimumPrice`, `priceStep` - Currency formatting
- `currentTourPrice` - Display price based on model
- `activationCheck`, `canActivate`, `missingSteps`, `onboardingMessage` - Onboarding checks
- `hasMinimumRequiredFields` - Save button availability

---

## STYLES SECTION
**Lines:** 2086-2722  
**Size:** ~636 lines

Contains CSS for:
- Form field wrapper layouts
- Description field special handling
- Field helpers (errors, counters)
- Form state indicators
- Various utility classes

---

## EXTRACTION CANDIDATES SUMMARY

| Section | Lines | Size | Difficulty | Recommendation | Reason |
|---------|-------|------|------------|-----------------|--------|
| Basic Information | 989-1266 | 277 | MEDIUM | ✅ EXTRACT | Already uses sub-components, self-contained, reduces ~277 lines |
| Tour Images | 1268-1415 | 147 | EASY | ✅ EXTRACT | Independent functionality, clear prop interface |
| Pricing | 1417-1553 | 136 | HARD | ⚠️ KEEP/REFACTOR | Already partially extracted, complex orchestration needed |
| Cancellation Policy | 1555-1725 | 170 | MEDIUM | ✅ EXTRACT | Self-contained feature with isolated state |
| Danger Zone | 1728-1847 | 119 | EASY | ✅ EXTRACT | Independent danger action, simple logic |
| Status & Visibility | 1852-1986 | 134 | EASY | ✅ EXTRACT | Self-contained sidebar UI, responsive design contained |
| Action Buttons | 1988-2081 | 93 | MEDIUM | ✅ EXTRACT | Clear responsibility, receives validation state as props |

---

## SHARED STATE & DEPENDENCIES

### State Required by Main Component:
1. **Validation State** - `validationErrors`, `touchedFields`, `currentlyTypingFields`
2. **Pricing State** - `savedPerPersonPrice`, `pricingTouched`
3. **Policy State** - `selectedPolicyTemplate`, `customPolicyHours`, `customPolicyNotes`
4. **UI State** - `showCancellationPolicy`, `descriptionEditor`, `initialDescriptionLoaded`
5. **FormData** - Main form data object (passed to all sections)

### Validation Function Dependencies:
- `validateField()` - Called by pricing section, must be accessible
- `shouldShowError()` - Utility needed by multiple sections
- `handleFieldInput()` - Typing debounce for all fields

### Complex Interdependencies:
1. **Pricing model changes** → Requires capacity and tier reinitialization
2. **Description editor** → Requires character count and markdown conversion
3. **Validation orchestration** → Multiple fields trigger form-level validation
4. **Button state** → Depends on all field validation results

---

## REFACTORING APPROACH RECOMMENDATIONS

### Phase 1: Easy Extractions (No Risk)
1. Extract `TourImagesSection.svelte` (Lines 1268-1415, 147 lines)
2. Extract `DangerZoneSection.svelte` (Lines 1728-1847, 119 lines)
3. Extract `StatusVisibilitySection.svelte` (Lines 1852-1986, 134 lines)
   - Keep the conditional rendering logic for mobile/desktop

### Phase 2: Medium Complexity Extractions
4. Extract `BasicInformationSection.svelte` (Lines 989-1266, 277 lines)
   - Keep LocationPicker, DurationInput, CategorySelector, LanguageSelector, TourDescriptionControls
   - Pass validation state and handlers as props
   - Keep TipexControls and description utilities

5. Extract `CancellationPolicySection.svelte` (Lines 1555-1725, 170 lines)
   - Move all policy template logic
   - Move custom policy functions
   - Move reactive effects for policy initialization
   - Bind to formData.cancellationPolicy and cancellationPolicyId

6. Extract `ActionButtonsSection.svelte` (Lines 1988-2081, 93 lines)
   - Receive validation state and button callbacks as props
   - Pass: isSubmitting, isEdit, initialStatus, canActivate, allErrors, missingSteps, hasMinimumRequiredFields

### Phase 3: Challenging Refactoring
7. Refactor pricing orchestration
   - Consider `PricingOrchestrator` component that wraps SimplifiedPricingSection
   - Keep `savedPerPersonPrice` state management in main component
   - Or move it to a store if shared across multiple pages

### Expected Results:
- **Main component reduction:** ~1,200 lines (to ~1,500 lines)
- **Files created:** 7 new components
- **Maintainability:** Significantly improved
- **Testing:** Much easier with isolated components

---

## CRITICAL NOTES FOR EXTRACTION

### Do NOT Extract Without Care:
1. **Validation system** - Tightly coupled to multiple fields
2. **FormData binding** - Must remain available to all sub-components
3. **Pricing initialization effects** - Complex migrations need to stay coordinated

### State That Should Move With Sections:
1. BasicInformation → description editor state, character count
2. CancellationPolicy → all policy template and custom policy state
3. ActionButtons → none (all received as props)
4. TourImages → none (all passed as props)
5. DangerZone → none (all passed as props)
6. StatusVisibility → none (all passed as props)

### Props Pattern for Extracted Components:
```typescript
// All extracted sections should accept:
interface SectionProps {
  formData: FormData;  // or specific subset via binding
  allErrors: ValidationError[];
  shouldShowError: (fieldName: string) => boolean;
  getFieldError: (errors: ValidationError[], field: string) => string | undefined;
  hasFieldError: (errors: ValidationError[], field: string) => boolean;
  validateField?: (fieldName: string) => void;
  handleFieldInput?: (fieldName: string) => void;
}
```

---

## HIDDEN INPUT ANALYSIS

Several sections contain hidden inputs for form submission:
- Basic Information: categories, languages, includedItems, requirements, location, locationPlaceId
- Pricing: pricingModel, participantCategories, privateTour, groupDiscounts, optionalAddons, guidePaysStripeFee, duration, capacity, minCapacity, maxCapacity
- Cancellation: cancellationPolicy, cancellationPolicyId
- Status/Visibility: status, publicListing

These must remain in parent form or be moved to a utility component that handles serialization.

