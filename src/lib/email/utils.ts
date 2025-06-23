import type { Booking } from '$lib/types.js';

// Format participant display for bookings
export function formatParticipantDisplay(booking: Booking): string {
  if (booking.participantBreakdown && typeof booking.participantBreakdown === 'object') {
    const breakdown = booking.participantBreakdown as { adults: number; children: number };
    const parts = [];
    
    if (breakdown.adults > 0) {
      parts.push(`${breakdown.adults} adult${breakdown.adults === 1 ? '' : 's'}`);
    }
    
    if (breakdown.children > 0) {
      parts.push(`${breakdown.children} child${breakdown.children === 1 ? '' : 'ren'}`);
    }
    
    if (parts.length === 0) {
      return `${booking.participants} participant${booking.participants === 1 ? '' : 's'}`;
    }
    
    return `${parts.join(' + ')} (${booking.participants} total)`;
  }
  
  // Fallback to simple participant count
  return `${booking.participants} participant${booking.participants === 1 ? '' : 's'}`;
}

// Format currency amounts
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    NZD: 'NZ$',
    SGD: 'S$',
    HKD: 'HK$',
    THB: '฿',
    AED: 'د.إ',
    MXN: 'MX$'
  };
  
  const symbol = symbols[currency] || currency;
  
  // JPY doesn't use decimal places
  const decimals = currency === 'JPY' ? 0 : 2;
  
  return `${symbol}${amount.toFixed(decimals)}`;
}

// Format date for emails
export function formatEmailDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format time for emails
export function formatEmailTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format date and time together
export function formatEmailDateTime(date: Date | string): string {
  return `${formatEmailDate(date)} at ${formatEmailTime(date)}`;
} 