/**
 * A length expressed as `${number}px`, `${number}%`, `${number}em` or `${number}rem`
 */
export type Length = `${number}px` | `${number}%` | `${number}em` | `${number}rem`;

export * from './index';
export * from './i18n';

// ========= ZAUR TOUR BOOKING SYSTEM TYPES =========

export type UserRole = 'customer' | 'guide' | 'admin';

export interface User extends RecordModel {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  stripeAccountId?: string;
  avatar?: string;
  role: UserRole;
  intendedRole?: 'customer' | 'guide'; // What they want to be
  phone?: string;
  website?: string;
  description?: string;
  location?: string; // City/region for guides
  created: string;
  updated: string;
}

export interface Tour extends RecordModel {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  capacity: number;
  user: string; // relation to User
  images?: string[]; // file uploads
  status: 'active' | 'inactive' | 'draft';
  category?: string;
  location?: string;
  includedItems?: string[];
  requirements?: string[];
  cancellationPolicy?: string;
  created: string;
  updated: string;
}

export interface TimeSlot extends RecordModel {
  id: string;
  tour: string; // relation to Tour
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  availableSpots: number;
  bookedSpots: number;
  status: 'available' | 'full' | 'cancelled';
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringEnd?: string; // ISO date
  created: string;
  updated: string;
}

export interface QRCode extends RecordModel {
  id: string;
  tour: string; // relation to Tour
  user: string; // relation to User
  code: string; // unique identifier
  name: string; // user-friendly name
  category?: 'digital' | 'print' | 'partner' | 'event' | 'promo'; // QR code category
  scans: number;
  conversions: number;
  isActive: boolean;
  customization?: {
    color?: string;
    backgroundColor?: string;
    logo?: string;
    style?: 'square' | 'rounded' | 'dots';
  };
  created: string;
  updated: string;
}

export interface Booking extends RecordModel {
  id: string;
  tour: string; // relation to Tour
  timeSlot: string; // relation to TimeSlot
  qrCode?: string; // relation to QRCode (if booked via QR)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  participants: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentId?: string; // Stripe payment intent ID
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  bookingReference: string; // unique booking reference
  specialRequests?: string;
  created: string;
  updated: string;
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
  booking: string; // relation to Booking
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  refundAmount?: number;
  processingFee: number;
  netAmount: number; // amount after Stripe fees
  created: string;
  updated: string;
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
