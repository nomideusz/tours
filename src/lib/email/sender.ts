import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { Booking, Tour, TimeSlot, User } from '$lib/types.js';

// Import email templates
import { bookingConfirmationEmail } from './templates/booking-confirmation.js';
import { bookingCancellationEmail } from './templates/booking-cancellation.js';
import { qrTicketEmail } from './templates/qr-ticket.js';
import { tourReminderEmail } from './templates/tour-reminder.js';
import { guideBookingNotificationEmail } from './templates/guide-booking-notification.js';
import { announcementEmail } from './templates/announcement.js';

// Configuration
const FROM_EMAIL = 'noreply@auth.zaur.app';
const FROM_NAME = 'Zaur';

// Email types
export type BookingEmailType = 'confirmation' | 'payment' | 'reminder' | 'cancelled' | 'qr-ticket';

// Lazy load Resend instance
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendInstance = new Resend(env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Main booking email interface
export interface BookingEmailData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
  tourOwner?: User;
  tourOwnerCurrency?: string;
  cancellationReason?: 'weather' | 'illness' | 'emergency' | 'low_enrollment' | 'other';
  customMessage?: string;
  isBulkCancellation?: boolean;
}

// Email result interface
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Send booking-related emails
export async function sendBookingEmail(
  emailType: BookingEmailType,
  data: BookingEmailData
): Promise<EmailResult> {
  try {
    let emailContent: { subject: string; html: string };

    switch (emailType) {
      case 'confirmation':
        emailContent = bookingConfirmationEmail({
          ...data,
          tourOwnerCurrency: data.tourOwnerCurrency
        });
        break;
        
      case 'payment':
        // Payment emails can reuse confirmation template with slight modifications
        emailContent = {
          subject: `💳 Payment Received - ${data.tour.name}`,
          html: bookingConfirmationEmail({
            ...data,
            tourOwnerCurrency: data.tourOwnerCurrency
          }).html.replace(
            'Booking Confirmed!',
            'Payment Received!'
          ).replace(
            'Your booking for',
            'We\'ve received your payment for'
          )
        };
        break;
        
      case 'reminder':
        emailContent = tourReminderEmail({
          ...data,
          tourOwnerCurrency: data.tourOwnerCurrency
        });
        break;
        
      case 'qr-ticket':
        emailContent = qrTicketEmail({
          ...data,
          tourOwnerCurrency: data.tourOwnerCurrency
        });
        break;
        
      case 'cancelled':
        // Use the new cancellation template
        emailContent = bookingCancellationEmail({
          booking: data.booking,
          tour: data.tour,
          timeSlot: data.timeSlot,
          tourOwner: data.tourOwner,
          tourOwnerCurrency: data.tourOwnerCurrency,
          cancellationReason: data.cancellationReason,
          customMessage: data.customMessage,
          isBulkCancellation: data.isBulkCancellation
        });
        break;
        
      default:
        throw new Error(`Invalid email type: ${emailType}`);
    }

    const resend = getResend();
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.booking.customerEmail],
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { 
      success: true, 
      messageId: result.data?.id 
    };
  } catch (error) {
    console.error(`Error sending ${emailType} email:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send guide notification email
export async function sendGuideNotificationEmail(
  data: BookingEmailData & { guideEmail: string; guideName?: string; guideCurrency?: string }
): Promise<EmailResult> {
  try {
    const emailContent = guideBookingNotificationEmail({
      booking: data.booking,
      tour: data.tour,
      timeSlot: data.timeSlot,
      guideName: data.guideName,
      guideCurrency: data.guideCurrency
    });

    const resend = getResend();
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.guideEmail],
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { 
      success: true, 
      messageId: result.data?.id 
    };
  } catch (error) {
    console.error('Error sending guide notification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send test email
export async function sendTestEmail(to: string = 'nom@zaur.app'): Promise<EmailResult> {
  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: '🧪 Email System Test - Zaur',
      html: `
        <h2>Email System Test</h2>
        <p>This is a test email from the Zaur email system.</p>
        <p>If you received this, the email system is working correctly!</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { 
      success: true, 
      messageId: result.data?.id 
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Bulk announcement email interface
export interface BulkAnnouncementData {
  subject: string;
  heading: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}

// Send announcement to a single user
export async function sendAnnouncementEmail(
  user: User,
  announcement: BulkAnnouncementData
): Promise<EmailResult> {
  try {
    const emailContent = announcementEmail({
      recipient: user,
      ...announcement
    });

    const resend = getResend();
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [user.email],
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { 
      success: true, 
      messageId: result.data?.id 
    };
  } catch (error) {
    console.error('Error sending announcement email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send announcement to multiple users
export async function sendBulkAnnouncement(
  users: User[],
  announcement: BulkAnnouncementData,
  onProgress?: (current: number, total: number) => void
): Promise<{ sent: number; failed: number; results: Array<{ user: User; result: EmailResult }> }> {
  const results: Array<{ user: User; result: EmailResult }> = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const result = await sendAnnouncementEmail(user, announcement);
    
    results.push({ user, result });
    
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    
    // Call progress callback if provided
    if (onProgress) {
      onProgress(i + 1, users.length);
    }
    
    // Add a small delay to avoid rate limiting
    if (i < users.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { sent, failed, results };
} 