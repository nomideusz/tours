/**
 * Formats a phone number to E.164 format required by Stripe
 * E.164 format: +[country code][number] with no spaces or special characters
 * 
 * @param phone - The phone number to format
 * @returns The formatted phone number or empty string if invalid
 */
export function formatPhoneForStripe(phone: string | null | undefined): string {
    if (!phone) return '';
    
    // Remove all non-digit characters except the leading +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
        // If it's a US number without country code, add +1
        if (cleaned.length === 10) {
            cleaned = '+1' + cleaned;
        } else {
            // Otherwise, assume the number is missing the + prefix
            cleaned = '+' + cleaned;
        }
    }
    
    // Validate the format (must start with + and have at least 10 digits after country code)
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    
    if (e164Regex.test(cleaned)) {
        return cleaned;
    }
    
    // Log warning for debugging
    console.warn(`Phone number "${phone}" could not be formatted to E.164 format`);
    return '';
}

/**
 * Validates if a phone number is in valid E.164 format
 * @param phone - The phone number to validate
 * @returns True if valid E.164 format
 */
export function isValidE164Phone(phone: string): boolean {
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    return e164Regex.test(phone);
} 