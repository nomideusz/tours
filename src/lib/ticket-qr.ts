/**
 * Ticket QR Code Management
 * Handles generation and verification of ticket QR codes for tour bookings
 */

/**
 * Generate a unique ticket QR code
 * Format: TKT-{timestamp}-{random}
 */
export function generateTicketQRCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

/**
 * Validate ticket QR code format
 */
export function isValidTicketQRCode(code: string): boolean {
  return /^TKT-[a-z0-9]+-[A-Z0-9]{6}$/.test(code);
}

/**
 * Extract booking reference from ticket for display
 */
export function getDisplayReference(ticketCode: string): string {
  if (!isValidTicketQRCode(ticketCode)) {
    return ticketCode;
  }
  // Return last part for easy reference
  return ticketCode.split('-').pop() || ticketCode;
}

/**
 * Generate ticket URL for customer
 */
export function generateTicketURL(ticketCode: string, baseURL = 'https://zaur.app'): string {
  return `${baseURL}/ticket/${ticketCode}`;
}

/**
 * Generate check-in URL for guides
 */
export function generateCheckInURL(ticketCode: string, baseURL = 'https://zaur.app'): string {
  return `${baseURL}/checkin/${ticketCode}`;
} 