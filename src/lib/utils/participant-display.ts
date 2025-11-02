import type { Booking } from '$lib/types.js';

/**
 * Formats participant display for booking lists and details
 * Shows breakdown when pricing tiers are used, falls back to simple count
 */
export function formatParticipantDisplay(booking: Booking): string {
  // New system: participants_by_category
  if (booking.participantsByCategory) {
    const categories = booking.participantsByCategory;
    const parts = [];
    
    for (const [categoryId, count] of Object.entries(categories)) {
      const numCount = Number(count);
      if (numCount > 0) {
        // Format category label (capitalize first letter)
        const label = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
        parts.push(`${numCount} ${label.toLowerCase()}${numCount === 1 ? '' : 's'}`);
      }
    }
    
    if (parts.length > 0) {
      return `${parts.join(' + ')} (${booking.participants} total)`;
    }
  }
  
  // Old system: participantBreakdown (adult/child)
  if (booking.participantBreakdown && typeof booking.participantBreakdown === 'object') {
    const breakdown = booking.participantBreakdown as { adults: number; children: number };
    const parts = [];
    
    if (breakdown.adults > 0) {
      parts.push(`${breakdown.adults} adult${breakdown.adults === 1 ? '' : 's'}`);
    }
    
    if (breakdown.children > 0) {
      parts.push(`${breakdown.children} child${breakdown.children === 1 ? '' : 'ren'}`);
    }
    
    if (parts.length > 0) {
      return `${parts.join(' + ')} (${booking.participants} total)`;
    }
  }
  
  // Fallback to simple participant count
  return `${booking.participants} participant${booking.participants === 1 ? '' : 's'}`;
}

/**
 * Formats participant display for compact views (mobile lists, etc.)
 * Shows just the count with breakdown in parentheses if available
 */
export function formatParticipantDisplayCompact(booking: Booking): string {
  // New system: participants_by_category
  if (booking.participantsByCategory) {
    const categories = booking.participantsByCategory;
    const parts = [];
    
    for (const [categoryId, count] of Object.entries(categories)) {
      const numCount = Number(count);
      if (numCount > 0) {
        // Use first letter of category as abbreviation
        const abbrev = categoryId.charAt(0).toUpperCase();
        parts.push(`${numCount}${abbrev}`);
      }
    }
    
    if (parts.length > 0) {
      return `${booking.participants} (${parts.join('+')})`;
    }
  }
  
  // Old system: participantBreakdown (adult/child)
  if (booking.participantBreakdown && typeof booking.participantBreakdown === 'object') {
    const breakdown = booking.participantBreakdown as { adults: number; children: number };
    const parts = [];
    
    if (breakdown.adults > 0) {
      parts.push(`${breakdown.adults}A`);
    }
    
    if (breakdown.children > 0) {
      parts.push(`${breakdown.children}C`);
    }
    
    if (parts.length > 0) {
      return `${booking.participants} (${parts.join('+')})`;
    }
  }
  
  // Fallback to simple participant count
  return `${booking.participants}`;
}

/**
 * Formats participant display for tooltips and detailed views
 * Shows full breakdown with labels
 */
export function formatParticipantDisplayDetailed(booking: Booking): string {
  // New system: participants_by_category
  if (booking.participantsByCategory) {
    const categories = booking.participantsByCategory;
    const parts = [];
    
    for (const [categoryId, count] of Object.entries(categories)) {
      const numCount = Number(count);
      if (numCount > 0) {
        // Format category label (capitalize first letter)
        const label = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
        parts.push(`${numCount} ${label.toLowerCase()}${numCount === 1 ? '' : 's'}`);
      }
    }
    
    if (parts.length > 0) {
      return `${parts.join(' + ')} (${booking.participants} total participants)`;
    }
  }
  
  // Old system: participantBreakdown (adult/child)
  if (booking.participantBreakdown && typeof booking.participantBreakdown === 'object') {
    const breakdown = booking.participantBreakdown as { adults: number; children: number };
    const parts = [];
    
    if (breakdown.adults > 0) {
      parts.push(`${breakdown.adults} adult${breakdown.adults === 1 ? '' : 's'}`);
    }
    
    if (breakdown.children > 0) {
      parts.push(`${breakdown.children} child${breakdown.children === 1 ? '' : 'ren'}`);
    }
    
    if (parts.length > 0) {
      return `${parts.join(' + ')} (${booking.participants} total participants)`;
    }
  }
  
  // Fallback to simple participant count
  return `${booking.participants} participant${booking.participants === 1 ? '' : 's'}`;
} 