/**
 * QR Code Generation Utilities
 * Handles generation of unique QR codes for tours
 */

// Color constants that match our CSS variables conceptually
// These need to be hex values for the QR code service
const QR_COLORS = {
  // Primary colors (matching --color-primary-600)
  PRIMARY: '2563EB',
  PRIMARY_DARK: '1D4ED8',
  
  // Neutral colors (matching --color-gray-*)
  BLACK: '000000',
  WHITE: 'FFFFFF',
  GRAY_50: 'FAFAFA',
  GRAY_800: '1F2937',
  
  // Accent colors (matching --color-*)
  PURPLE: '7C3AED'
};

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
 * Enhanced with better styling options
 */
export function generateQRImageURL(
  qrCode: string, 
  options: {
    size?: number;
    color?: string;
    backgroundColor?: string;
    baseURL?: string;
    style?: 'default' | 'rounded' | 'dots' | 'modern';
    margin?: number;
    errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  } = {}
): string {
  const {
    size = 300,
    color = QR_COLORS.PRIMARY, // Using primary blue color
    backgroundColor = QR_COLORS.WHITE,
    baseURL = 'https://zaur.app',
    style = 'modern',
    margin = 2, // Increased margin for better visual spacing
    errorCorrection = 'M' // Medium error correction (allows for ~15% damage)
  } = options;

  const bookingUrl = generateBookingURL(qrCode, baseURL);
  const cleanColor = color.replace('#', '');
  const cleanBgColor = backgroundColor.replace('#', '');
  
  // Using different formats based on style preference
  let apiUrl: string;
  
  if (style === 'rounded' || style === 'dots' || style === 'modern') {
    // For advanced styles, we'll use a different approach or enhanced parameters
    // Note: api.qrserver.com doesn't support rounded corners directly, 
    // but we can use CSS/SVG post-processing or switch to a different service
    apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(bookingUrl)}&color=${cleanColor}&bgcolor=${cleanBgColor}&margin=${margin}&ecc=${errorCorrection}&format=svg`;
  } else {
    // Default PNG format with enhanced parameters
    apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(bookingUrl)}&color=${cleanColor}&bgcolor=${cleanBgColor}&margin=${margin}&ecc=${errorCorrection}`;
  }
  
  return apiUrl;
}

/**
 * Generate a styled QR code with Zaur branding
 * This creates a data URL with embedded logo/styling
 */
export function generateStyledQRDataURL(
  qrCode: string,
  options: {
    size?: number;
    includeLabel?: boolean;
    tourName?: string;
  } = {}
): string {
  // This would need to be implemented with canvas manipulation
  // For now, returning standard QR code
  return generateQRImageURL(qrCode, {
    size: options.size,
    style: 'modern'
  });
}

/**
 * Get QR code style presets
 * These use our color constants for consistency
 */
export const QR_STYLE_PRESETS = {
  default: {
    color: QR_COLORS.BLACK,
    backgroundColor: QR_COLORS.WHITE,
    margin: 1
  },
  modern: {
    color: QR_COLORS.PRIMARY, // Primary blue
    backgroundColor: QR_COLORS.WHITE,
    margin: 2
  },
  premium: {
    color: QR_COLORS.PURPLE, // Accent purple
    backgroundColor: QR_COLORS.GRAY_50,
    margin: 3
  },
  dark: {
    color: QR_COLORS.WHITE,
    backgroundColor: QR_COLORS.GRAY_800,
    margin: 2
  }
};

/**
 * Generate a display-friendly reference from QR code
 */
export function getQRDisplayReference(qrCode: string): string {
  // Return the part after the last dash for easy reference
  return qrCode.split('-').pop() || qrCode;
} 