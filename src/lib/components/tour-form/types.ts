/**
 * Shared types for TourForm section components
 */

import type { PricingModel, GroupPricingTier, OptionalAddon } from '$lib/types.js';
import type { ValidationError } from '$lib/validation.js';

export interface TourFormData {
  name: string;
  description: string;
  price: number;
  duration: number;
  capacity: number;
  minCapacity?: number;
  maxCapacity?: number;
  status: 'active' | 'draft';
  categories: string[];
  location: string;
  languages: string[];
  includedItems: string[];
  requirements: string[];
  cancellationPolicy: string;
  pricingModel?: PricingModel;
  enablePricingTiers: boolean;
  pricingTiers?: {
    adult: number;
    child?: number;
  };
  participantCategories?: {
    categories: Array<{
      id: string;
      label: string;
      price: number;
      ageRange?: string;
      description?: string;
      sortOrder: number;
      minAge?: number;
      maxAge?: number;
      countsTowardCapacity?: boolean;
    }>;
    minCapacity?: number;
    maxCapacity?: number;
  };
  privateTour?: {
    flatPrice: number;
    minCapacity?: number;
    maxCapacity?: number;
  };
  groupPricingTiers?: {
    tiers: GroupPricingTier[];
    privateBooking?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
  };
  groupDiscounts?: {
    tiers: Array<{
      id: string;
      minParticipants: number;
      maxParticipants: number;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      label?: string;
    }>;
    enabled: boolean;
  };
  optionalAddons?: {
    addons: OptionalAddon[];
  };
  guidePaysStripeFee?: boolean;
  countInfantsTowardCapacity?: boolean;
  publicListing?: boolean;
}

export interface ValidationHelpers {
  allErrors: ValidationError[];
  getFieldError: (errors: ValidationError[], field: string) => string | undefined;
  hasFieldError: (errors: ValidationError[], field: string) => boolean;
  validateField: (field: string) => void;
  validateFieldRealtime: (field: string) => void;
}
