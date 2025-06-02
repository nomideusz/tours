import PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { env } from '$env/dynamic/public';
import type { Tour, TimeSlot, QRCode, Booking, Customer, Payment, User } from './types.js';

// Get PocketBase URL from environment variables
const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

// Create PocketBase client instance
// We'll use a different approach for client vs server
export const pb = browser 
  ? (() => {
      const client = new PocketBase(POCKETBASE_URL);
      // Only load auth state if not on a public page
      if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        // Note: /ticket/ is public for customers, but /checkin/ requires auth for guides
        const isPublicPage = pathname.includes('/book/') || 
                            pathname.includes('/ticket/');
        
        if (!isPublicPage) {
          client.authStore.loadFromCookie(document.cookie);
        } else {
          // Clear any auth state for public pages
          client.authStore.clear();
        }
      }
      return client;
    })()
  : null; // On server, we'll use the instance from locals

// In Svelte 5 Runes mode, we don't need to use a writable store
// The currentUser will be defined directly in components using $state()
// This is just the initial value
export const initialUserValue = browser && pb && pb.authStore.isValid ? pb.authStore.record : null;

// Create a writable store for currentUser
export const currentUser = writable(initialUserValue);

// Enhanced version to properly handle auth state changes
export function setupAuthListener(setCurrentUser: (user: any) => void) {
  if (browser && pb) {
    // Load auth state from cookie first (important for page refreshes)
    pb.authStore.loadFromCookie(document.cookie);
    
    // Set the initial state immediately
    console.log('Setting up auth listener, initial auth state:', pb.authStore.isValid ? 'Logged in' : 'Logged out');
    console.log('Auth token present:', !!pb.authStore.token);
    console.log('Auth record present:', !!pb.authStore.record);
    
    // Immediate call to set the current user
    setCurrentUser(pb.authStore.record);
    currentUser.set(pb.authStore.record);
    
    // Set up the onChange listener
    const unsubscribe = pb.authStore.onChange((token, model) => {
      console.log('Auth store changed:', model ? 'User authenticated' : 'No user', 'Token valid:', !!token);
      setCurrentUser(model);
      currentUser.set(model);
    });
    
    // Return cleanup function
    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }
  return () => {};
}

// ========= ZAUR TOUR BOOKING SYSTEM APIs =========

// Tours API
export const toursApi = {
  /**
   * Get all tours for the current user
   * @param sortField Optional field to sort by (default: -created)
   * @returns Promise with array of tours
   */
  getAll: async (sortField: string = '-created'): Promise<Tour[]> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return [];
    }
    
    try {
      return await pb.collection('tours').getFullList<Tour>({
        sort: sortField,
        filter: `user = "${pb.authStore.record?.id}"`,
        expand: 'user'
      });
    } catch (error) {
      console.error('Error fetching tours:', error);
      throw error;
    }
  },

  /**
   * Get a single tour by ID
   * @param id Tour ID
   * @returns Promise with the tour
   */
  getById: async (id: string): Promise<Tour | null> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return null;
    }
    
    try {
      return await pb.collection('tours').getOne<Tour>(id, {
        expand: 'user'
      });
    } catch (error) {
      console.error(`Error fetching tour with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new tour
   * @param data Tour data
   * @returns Promise with created tour
   */
  create: async (data: Partial<Tour>): Promise<Tour> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      const userId = pb.authStore.record?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Prepare data for PocketBase - convert arrays to JSON strings for JSON fields
      const tourData = {
        ...data,
        user: userId,
        // Convert JSON fields to strings
        includedItems: Array.isArray(data.includedItems) ? JSON.stringify(data.includedItems) : data.includedItems,
        requirements: Array.isArray(data.requirements) ? JSON.stringify(data.requirements) : data.requirements
      };

      // Debug: Log the data being sent
      console.log('Tour data being sent:', tourData);
      
      return await pb.collection('tours').create<Tour>(tourData);
    } catch (error) {
      console.error('Error creating tour:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error details:', error);
      }
      throw error;
    }
  },

  /**
   * Create a new tour with images
   * @param formData FormData containing tour data and images
   * @returns Promise with created tour
   */
  createWithImages: async (formData: FormData): Promise<Tour> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      // Add current user ID to FormData
      const userId = pb.authStore.record?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      formData.append('user', userId);
      
      // Debug: Log the FormData contents
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      return await pb.collection('tours').create<Tour>(formData);
    } catch (error) {
      console.error('Error creating tour with images:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error details:', error);
      }
      throw error;
    }
  },

  /**
   * Update a tour
   * @param id Tour ID
   * @param data Updated tour data
   * @returns Promise with updated tour
   */
  update: async (id: string, data: Partial<Tour>): Promise<Tour> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      // Prepare data for PocketBase - convert arrays to JSON strings for JSON fields
      const tourData = {
        ...data,
        // Convert JSON fields to strings
        includedItems: Array.isArray(data.includedItems) ? JSON.stringify(data.includedItems) : data.includedItems,
        requirements: Array.isArray(data.requirements) ? JSON.stringify(data.requirements) : data.requirements
      };

      // Debug: Log the data being sent
      console.log('Tour update data being sent:', tourData);
      
      return await pb.collection('tours').update<Tour>(id, tourData);
    } catch (error) {
      console.error(`Error updating tour with ID ${id}:`, error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error details:', error);
      }
      throw error;
    }
  },

  /**
   * Update a tour with images
   * @param id Tour ID
   * @param formData FormData containing updated tour data and images
   * @returns Promise with updated tour
   */
  updateWithImages: async (id: string, formData: FormData): Promise<Tour> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      // Debug: Log the FormData contents
      console.log('Update FormData contents:');
      const imageFields: string[] = [];
      const imageDeleteFields: string[] = [];
      for (const [key, value] of formData.entries()) {
        if (key === 'images') {
          if (typeof value === 'string') {
            imageFields.push(`Existing: ${value}`);
          } else {
            imageFields.push(`New: ${(value as File).name}`);
          }
        } else if (key === 'images-') {
          imageDeleteFields.push(value as string);
        }
        console.log(`${key}:`, value);
      }
      console.log('Image fields summary:', imageFields);
      console.log('Images to delete:', imageDeleteFields);
      
      return await pb.collection('tours').update<Tour>(id, formData);
    } catch (error) {
      console.error(`Error updating tour with images for ID ${id}:`, error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error details:', error);
      }
      throw error;
    }
  },

  /**
   * Delete a tour
   * @param id Tour ID
   * @returns Promise with boolean success
   */
  delete: async (id: string): Promise<boolean> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      await pb.collection('tours').delete(id);
      return true;
    } catch (error) {
      console.error(`Error deleting tour with ID ${id}:`, error);
      throw error;
    }
  }
};

// Time Slots API
export const timeSlotsApi = {
  /**
   * Get all time slots for current user's tours
   * @returns Promise with array of time slots
   */
  getAll: async (): Promise<TimeSlot[]> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return [];
    }
    
    try {
      // Get all time slots for user's tours
      return await pb.collection('time_slots').getFullList<TimeSlot>({
        filter: `tour.user = "${pb.authStore.record?.id}"`,
        sort: 'startTime',
        expand: 'tour'
      });
    } catch (error) {
      console.error('Error fetching all time slots:', error);
      throw error;
    }
  },

  /**
   * Get all time slots for a tour
   * @param tourId Tour ID
   * @returns Promise with array of time slots
   */
  getByTour: async (tourId: string): Promise<TimeSlot[]> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return [];
    }
    
    try {
      return await pb.collection('time_slots').getFullList<TimeSlot>({
        filter: `tour = "${tourId}"`,
        sort: 'startTime',
        expand: 'tour'
      });
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  },

  /**
   * Create a new time slot
   * @param data Time slot data
   * @returns Promise with created time slot
   */
  create: async (data: Partial<TimeSlot>): Promise<TimeSlot> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      return await pb.collection('time_slots').create<TimeSlot>(data);
    } catch (error) {
      console.error('Error creating time slot:', error);
      throw error;
    }
  },

  /**
   * Update a time slot
   * @param id Time slot ID
   * @param data Updated time slot data
   * @returns Promise with updated time slot
   */
  update: async (id: string, data: Partial<TimeSlot>): Promise<TimeSlot> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      return await pb.collection('time_slots').update<TimeSlot>(id, data);
    } catch (error) {
      console.error(`Error updating time slot with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a time slot
   * @param id Time slot ID
   * @returns Promise with boolean success
   */
  delete: async (id: string): Promise<boolean> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      await pb.collection('time_slots').delete(id);
      return true;
    } catch (error) {
      console.error(`Error deleting time slot with ID ${id}:`, error);
      throw error;
    }
  }
};

// QR Codes API
export const qrCodesApi = {
  /**
   * Get all QR codes for the current user
   * @returns Promise with array of QR codes
   */
  getAll: async (): Promise<QRCode[]> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return [];
    }
    
    try {
      return await pb.collection('qr_codes').getFullList<QRCode>({
        filter: `user = "${pb.authStore.record?.id}"`,
        sort: '-created',
        expand: 'tour,user'
      });
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      throw error;
    }
  },

  /**
   * Get QR code by code string
   * @param code QR code string
   * @returns Promise with QR code
   */
  getByCode: async (code: string): Promise<QRCode | null> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return null;
    }
    
    try {
      const records = await pb.collection('qr_codes').getFullList<QRCode>({
        filter: `code = "${code}"`,
        expand: 'tour,user'
      });
      
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  /**
   * Get QR code by ID
   * @param id QR code ID
   * @returns Promise with QR code
   */
  getById: async (id: string): Promise<QRCode | null> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return null;
    }
    
    try {
      return await pb.collection('qr_codes').getOne<QRCode>(id, {
        expand: 'tour,user'
      });
    } catch (error) {
      console.error('Error fetching QR code by ID:', error);
      return null;
    }
  },

  /**
   * Create a new QR code
   * @param data QR code data
   * @returns Promise with created QR code
   */
  create: async (data: Partial<QRCode>): Promise<QRCode> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      // Add current user ID and generate unique code
      const qrData = {
        ...data,
        user: pb.authStore.record?.id,
        code: data.code || generateUniqueCode()
      };
      
      return await pb.collection('qr_codes').create<QRCode>(qrData);
    } catch (error) {
      console.error('Error creating QR code:', error);
      throw error;
    }
  },

  /**
   * Update QR code scan count
   * @param code QR code string
   * @returns Promise with updated QR code
   */
  incrementScan: async (code: string): Promise<QRCode | null> => {
    try {
      const qrCode = await qrCodesApi.getByCode(code);
      if (!qrCode) return null;
      
      return await pb?.collection('qr_codes').update<QRCode>(qrCode.id, {
        scans: qrCode.scans + 1
      }) || null;
    } catch (error) {
      console.error('Error incrementing scan count:', error);
      throw error;
    }
  },

  /**
   * Update QR code
   * @param id QR code ID
   * @param data Update data
   * @returns Promise with updated QR code
   */
  update: async (id: string, data: Partial<QRCode>): Promise<QRCode> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      return await pb.collection('qr_codes').update<QRCode>(id, data);
    } catch (error) {
      console.error('Error updating QR code:', error);
      throw error;
    }
  },

  /**
   * Delete QR code
   * @param id QR code ID
   * @returns Promise with boolean success
   */
  delete: async (id: string): Promise<boolean> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      return await pb.collection('qr_codes').delete(id);
    } catch (error) {
      console.error('Error deleting QR code:', error);
      throw error;
    }
  }
};

// Bookings API
export const bookingsApi = {
  /**
   * Get all bookings for the current user's tours
   * @returns Promise with array of bookings
   */
  getAll: async (): Promise<Booking[]> => {
    if (!browser || !pb) {
      console.warn('PocketBase client not available');
      return [];
    }
    
    try {
      // First get user's tours, then get bookings for those tours
      const tours = await toursApi.getAll();
      const tourIds = tours.map(tour => tour.id);
      
      if (tourIds.length === 0) return [];
      
      const filter = tourIds.map(id => `tour.id = "${id}"`).join(' || ');
      
      return await pb.collection('bookings').getFullList<Booking>({
        filter: `(${filter})`,
        sort: '-created',
        expand: 'tour,timeSlot,qrCode'
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  /**
   * Create a new booking
   * @param data Booking data
   * @returns Promise with created booking
   */
  create: async (data: Partial<Booking>): Promise<Booking> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      // Generate unique booking reference
      const bookingData = {
        ...data,
        bookingReference: data.bookingReference || generateBookingReference()
      };
      
      return await pb.collection('bookings').create<Booking>(bookingData);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  /**
   * Update booking status
   * @param id Booking ID
   * @param status New status
   * @returns Promise with updated booking
   */
  updateStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    if (!browser || !pb) {
      throw new Error('PocketBase client not available');
    }
    
    try {
      // Get current booking to validate payment status
      const currentBooking = await pb.collection('bookings').getOne<Booking>(id);
      
      // Validate payment status for certain status changes
      if (status === 'confirmed' && currentBooking.paymentStatus !== 'paid') {
        throw new Error('Cannot confirm booking without completed payment');
      }
      
      if (status === 'completed' && currentBooking.status !== 'confirmed') {
        throw new Error('Can only complete confirmed bookings');
      }
      
      return await pb.collection('bookings').update<Booking>(id, { status });
    } catch (error) {
      console.error(`Error updating booking status for ID ${id}:`, error);
      throw error;
    }
  }
};

// Utility functions
export function generateUniqueCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateBookingReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ZR-${timestamp}-${random}`;
}

// Format date for display
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

// Format date with time for display
export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
} 