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

export interface Tour extends RecordModel {
  id: string;
  name: string;
  description: string;
  price: string; // decimal fields return strings in Drizzle
  duration: number; // in minutes
  capacity: number;
  userId: string; // relation to User
  images?: string[]; // file uploads
  status: 'active' | 'draft';
  category?: string;
  location?: string;
  includedItems?: string[];
  requirements?: string[];
  cancellationPolicy?: string;
  // QR code fields
  qrCode?: string;
  qrScans?: number;
  qrConversions?: number;
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
