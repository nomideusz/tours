/**
 * A length expressed as `${number}px`, `${number}%`, `${number}em` or `${number}rem`
 */
export type Length = `${number}px` | `${number}%` | `${number}em` | `${number}rem`;

export * from './index';
export * from './i18n';

// ========= ZAUR TOUR BOOKING SYSTEM TYPES =========

// UserRole removed - using 'admin' | 'user' directly from schema

export interface User extends RecordModel {
  id: string;
  email: string;
  name: string;
  username?: string;
  businessName?: string;
  stripeAccountId?: string;
  avatar?: string;
  role: 'admin' | 'user'; // matches schema enum
  phone?: string;
  website?: string;
  description?: string;
  location?: string; // City/region for guides
  country?: string;
  // Main QR code fields
  mainQrCode?: string;
  mainQrScans?: number;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Pricing model types
export type PricingModel = 'per_person' | 'participant_categories' | 'group_tiers' | 'private_tour';

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

// Flexible participant category for age-based, role-based pricing
export interface ParticipantCategory {
  id: string;                // e.g., "adult", "senior", "student", "child"
  label: string;             // e.g., "Adult", "Senior (65+)", "Student (with ID)"
  price: number;             // Price for this category
  ageRange?: string;         // e.g., "18-64", "65+", "3-12"
  description?: string;      // e.g., "Valid student ID required"
  sortOrder: number;         // Display order (0-based)
  minAge?: number;           // Optional: minimum age for this category
  maxAge?: number;           // Optional: maximum age for this category
  countsTowardCapacity?: boolean; // Whether this category counts toward tour capacity (default: true)
}

// Group discount tier for participant categories
export interface GroupDiscountTier {
  id: string;                // Unique identifier
  minParticipants: number;   // Minimum group size
  maxParticipants: number;   // Maximum group size (or null for unlimited)
  discountType: 'percentage' | 'fixed';  // Type of discount
  discountValue: number;     // Either percentage (0-100) or fixed price per person
  label?: string;            // e.g., "Small Group", "Large Group"
}

export interface Tour extends RecordModel {
  id: string;
  name: string;
  description: string;
  price: string; // decimal fields return strings in Drizzle
  duration: number; // in minutes
  capacity: number;
  minCapacity?: number;
  maxCapacity?: number;
  userId: string; // relation to User
  images?: string[]; // file uploads
  status: 'active' | 'draft';
  categories?: string[];
  location?: string;
  includedItems?: string[];
  requirements?: string[];
  cancellationPolicy?: string;
  // Pricing model (NEW)
  pricingModel?: PricingModel;
  // Pricing tiers (existing adult/child - kept for backward compatibility)
  enablePricingTiers?: boolean;
  pricingTiers?: {
    adult: number;
    child?: number;
  };
  // Flexible participant categories (NEW - more flexible than adult/child)
  participantCategories?: {
    categories: ParticipantCategory[];
  };
  // Private tour pricing (flat rate for exclusive bookings)
  privateTour?: {
    flatPrice: number;
    minCapacity?: number;
    maxCapacity?: number;
  };
  // Legacy group pricing tiers (backward compatibility)
  groupPricingTiers?: {
    tiers: GroupPricingTier[];
    privateBooking?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
  };
  // Group discounts for participant categories (NEW)
  groupDiscounts?: {
    tiers: GroupDiscountTier[];
    enabled: boolean;
  };
  // Optional add-ons (NEW)
  optionalAddons?: {
    addons: OptionalAddon[];
  };
  // Stripe fee payment option (NEW)
  guidePaysStripeFee?: boolean;
  // Capacity settings (NEW)
  countInfantsTowardCapacity?: boolean;
  // QR code fields
  qrCode?: string;
  qrScans?: number;
  qrConversions?: number;
  // Public listing
  publicListing?: boolean;
  // Booking availability
  upcomingSlots?: number; // number of available upcoming time slots
  hasFutureBookings?: boolean; // whether tour has confirmed/pending future bookings
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot extends RecordModel {
  id: string;
  tourId: string; // relation to Tour
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  availableSpots: number;
  bookedSpots: number;
  status: 'available' | 'full' | 'cancelled';
  isRecurring: boolean;
  recurringPattern: 'daily' | 'weekly' | 'monthly' | null;
  recurringEnd: string | null; // ISO datetime string like other date fields
  createdAt: string;
  updatedAt: string;
}

// QRCode interface removed - using simplified QR approach with direct fields on tours and users

export interface Booking extends RecordModel {
  id: string;
  tourId: string; // relation to Tour
  timeSlotId: string; // relation to TimeSlot
  source?: 'main_qr' | 'tour_qr' | 'direct' | 'referral' | 'social' | 'other';
  sourceQrCode?: string; // QR code that was scanned (if any)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  participants: number;
  totalAmount: string; // decimal fields return strings in Drizzle
  // Pricing breakdown for tiers (legacy adult/child - kept for backward compatibility)
  participantBreakdown?: {
    adults: number;
    children?: number;
  };
  // Flexible participant breakdown by category (NEW)
  participantsByCategory?: {
    [categoryId: string]: number;  // e.g., { "adult": 2, "senior": 1, "child": 1 }
  };
  // Selected add-ons (NEW)
  selectedAddons?: Array<{
    addonId: string;
    name: string;
    price: number;
  }>;
  // Price breakdown (NEW)
  priceBreakdown?: {
    basePrice: number;
    addonsTotal: number;
    totalAmount: number;
    categoryBreakdown?: {      // Detailed breakdown by category
      [categoryId: string]: {
        label: string;
        count: number;
        pricePerPerson: number;
        subtotal: number;
      };
    };
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentId?: string; // Stripe payment intent ID
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  bookingReference: string; // unique booking reference
  specialRequests?: string;
  // New ticket QR fields
  ticketQRCode?: string; // unique ticket identifier for scanning
  attendanceStatus?: 'not_arrived' | 'checked_in' | 'no_show';
  checkedInAt?: string; // timestamp when customer checked in
  checkedInBy?: string; // guide who checked them in
  createdAt: string;
  updatedAt: string;
}

export interface Customer extends RecordModel {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bookings: string[]; // relations to Bookings
  totalBookings: number;
  totalSpent: number;
  created: string;
  updated: string;
}

export interface Payment extends RecordModel {
  id: string;
  bookingId: string; // relation to Booking
  stripePaymentIntentId: string;
  amount: string; // decimal fields return strings in Drizzle
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  refundAmount?: string; // decimal fields return strings in Drizzle
  processingFee: string; // decimal fields return strings in Drizzle
  netAmount: string; // decimal fields return strings in Drizzle
  createdAt: string;
  updatedAt: string;
}

export interface GuideApplication extends RecordModel {
  id: string;
  user: string; // relation to User (customer)
  businessName: string;
  experience: string; // years or description
  specialties: string[]; // tour types they offer
  location: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  };
  certifications?: string[];
  whyGuide: string; // motivation/story
  businessPlan?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  adminNotes?: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string; // admin user ID
}

export interface TourStats {
  qrCodes: number;
  activeQRCodes: number;
  totalQRScans: number;
  totalQRConversions: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  revenue: number;
  totalParticipants: number;
  thisWeekBookings: number;
  averageBookingValue: number;
  conversionRate: number;
}
