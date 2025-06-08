/**
 * QR Code Generation Utilities
 * Handles generation of unique QR codes for tours
 */

/**
 * Generate a unique QR code for a tour
 * Format: TUR-{tourPrefix}-{random}
 */
export function generateTourQRCode(tourName: string): string {
  // Create a prefix from the tour name (first 3 letters, uppercase, letters only)
  const tourPrefix = tourName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, '') || 'TUR';
  
  // Generate random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `${tourPrefix}-${randomSuffix}`;
}

/**
 * Validate QR code format
 */
export function isValidTourQRCode(code: string): boolean {
  return /^[A-Z]{1,3}-[A-Z0-9]{6}$/.test(code);
}

/**
 * Generate booking URL for QR code
 */
export function generateBookingURL(qrCode: string, baseURL = 'https://zaur.app'): string {
  return `${baseURL}/book/${qrCode}`;
}

/**
 * Generate QR code image URL using external service
 */
export function generateQRImageURL(
  qrCode: string, 
  options: {
    size?: number;
    color?: string;
    backgroundColor?: string;
    baseURL?: string;
  } = {}
): string {
  const {
    size = 300,
    color = '000000',
    backgroundColor = 'FFFFFF',
    baseURL = 'https://zaur.app'
  } = options;

  const bookingUrl = generateBookingURL(qrCode, baseURL);
  const cleanColor = color.replace('#', '');
  const cleanBgColor = backgroundColor.replace('#', '');
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(bookingUrl)}&color=${cleanColor}&bgcolor=${cleanBgColor}`;
}

/**
 * Generate a display-friendly reference from QR code
 */
export function getQRDisplayReference(qrCode: string): string {
  // Return the part after the last dash for easy reference
  return qrCode.split('-').pop() || qrCode;
} 