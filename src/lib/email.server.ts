import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { generateCheckInURL, getDisplayReference } from '$lib/ticket-qr.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';

const resend = new Resend(env.RESEND_API_KEY);
const FROM_EMAIL = 'noreply@auth.zaur.app';
const FROM_NAME = 'Zaur Tours';

// Email template types
export type EmailType = 'confirmation' | 'payment' | 'reminder' | 'cancelled' | 'qr-ticket';

interface BookingEmailData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

// Professional email template wrapper with email client compatibility
function createEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Zaur Tours</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles for email clients */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
        }
        
        /* Wrapper table for Outlook */
        .email-wrapper {
            width: 100% !important;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        
        .email-container {
            max-width: 600px !important;
            width: 100%;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .email-content {
            padding: 40px 30px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            text-decoration: none;
        }
        
        .content {
            margin-bottom: 30px;
        }
        
        .content h1, .content h2 {
            color: #1f2937;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .content h2 {
            font-size: 24px;
        }
        
        .content p {
            margin: 0 0 16px 0;
            color: #4b5563;
            font-size: 16px;
            line-height: 1.6;
        }
        
        .button {
            display: inline-block !important;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none !important;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
        }
        
        .button:hover {
            background-color: #1d4ed8;
        }
        
        .button-center {
            text-align: center;
            margin: 30px 0;
        }
        
        .details-box {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .qr-container {
            text-align: center;
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .highlight-box {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .warning-box {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        
        .footer {
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding: 20px 30px;
            margin-top: 30px;
            background-color: #f9fafb;
        }
        
        .footer p {
            margin: 0 0 8px 0;
        }
        
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        
        /* Mobile responsive */
        @media screen and (max-width: 640px) {
            .email-content {
                padding: 30px 20px !important;
            }
            
            .footer {
                padding: 20px !important;
            }
            
            .logo {
                font-size: 24px !important;
            }
            
            .content h2 {
                font-size: 22px !important;
            }
            
            .button {
                padding: 12px 24px !important;
                font-size: 14px !important;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #1f2937 !important;
            }
            
            .content h2, .content p {
                color: #f9fafb !important;
            }
            
            .footer {
                background-color: #111827 !important;
                color: #9ca3af !important;
            }
        }
    </style>
</head>
<body>
    <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="email-content">
                            <div class="header">
                                <div class="logo">Zaur Tours</div>
                            </div>
                            
                            <div class="content">
                                ${content}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p>This email was sent by Zaur Tours</p>
                            <p>If you have any questions, please contact our support team.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Email template generators
function generateConfirmationEmail(data: BookingEmailData): EmailTemplate {
  const { booking, tour, timeSlot } = data;
  const tourName = tour.name;
  const customerName = booking.customerName;
  const startTime = new Date(timeSlot.startTime);
  const meetingPoint = tour.location;

  const content = `
    <h2>🎉 Booking Confirmed!</h2>
    <p>Hello ${customerName},</p>
    <p>Congratulations! Your booking for <strong>${tourName}</strong> has been successfully confirmed and we're excited to have you join us!</p>
    
    <div class="highlight-box">
        <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 15px;">✅ You're all set!</h3>
        <p style="margin: 0; color: #0c4a6e;">
            Your adventure is confirmed and waiting for you. Get ready for an unforgettable experience!
        </p>
    </div>
    
    <div class="details-box">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151;">📋 Your Booking Details</h3>
        <p style="margin: 5px 0;"><strong>Reference:</strong> ${booking.bookingReference}</p>
        <p style="margin: 5px 0;"><strong>Tour:</strong> ${tourName}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${startTime.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Participants:</strong> ${booking.participants}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${booking.totalAmount}</p>
        ${meetingPoint ? `<p style="margin: 5px 0;"><strong>Meeting Point:</strong> ${meetingPoint}</p>` : ''}
    </div>
    
    <p><strong>What's next?</strong></p>
    <ul style="margin-bottom: 25px; padding-left: 20px;">
        <li style="margin-bottom: 8px;">You'll receive a reminder email 24 hours before your tour</li>
        <li style="margin-bottom: 8px;">Your QR ticket will be sent closer to the tour date</li>
        <li style="margin-bottom: 8px;">Arrive at the meeting point 15 minutes early</li>
    </ul>
    
    <p>Thank you for choosing Zaur Tours! We can't wait to show you an amazing time! 🌟</p>
  `;

  return {
    subject: `🎉 Booking Confirmed - ${tourName}`,
    html: createEmailTemplate(content)
  };
}

function generatePaymentEmail(data: BookingEmailData): EmailTemplate {
  const { booking, tour } = data;
  const tourName = tour.name;
  const customerName = booking.customerName;

  const content = `
    <h2>💳 Payment Received!</h2>
    <p>Hello ${customerName},</p>
    <p>Great news! We have successfully received your payment for <strong>${tourName}</strong>. Your booking is now fully confirmed and secured!</p>
    
    <div class="highlight-box">
        <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 15px;">✅ Payment Successful!</h3>
        <p style="margin: 0; color: #0c4a6e;">
            Your payment has been processed and your spot is reserved. You're all set for an amazing experience!
        </p>
    </div>
    
    <div class="details-box">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151;">💰 Payment Summary</h3>
        <p style="margin: 5px 0;"><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
        <p style="margin: 5px 0;"><strong>Tour:</strong> ${tourName}</p>
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${booking.totalAmount}</p>
        <p style="margin: 5px 0;"><strong>Payment Status:</strong> <span style="color: #059669; font-weight: 600;">✅ Completed</span></p>
    </div>
    
    <p><strong>What happens next?</strong></p>
    <ul style="margin-bottom: 25px; padding-left: 20px;">
        <li style="margin-bottom: 8px;">You'll receive a reminder email 24 hours before your tour</li>
        <li style="margin-bottom: 8px;">Your digital QR ticket will be sent closer to the tour date</li>
        <li style="margin-bottom: 8px;">If you need to make any changes, contact us as soon as possible</li>
    </ul>
    
    <p>Thank you for your payment and for choosing Zaur Tours! 🎉</p>
  `;

  return {
    subject: `💳 Payment Received - ${tourName}`,
    html: createEmailTemplate(content)
  };
}

function generateReminderEmail(data: BookingEmailData): EmailTemplate {
  const { booking, tour, timeSlot } = data;
  const tourName = tour.name;
  const customerName = booking.customerName;
  const startTime = new Date(timeSlot.startTime);
  const meetingPoint = tour.location;

  const content = `
    <h2>⏰ Tour Reminder - Tomorrow!</h2>
    <p>Hello ${customerName},</p>
    <p>This is a friendly reminder that your amazing tour <strong>${tourName}</strong> is scheduled for tomorrow! We hope you're as excited as we are! 🌟</p>
    
    <div class="warning-box">
        <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">⚠️ Important Reminders:</h3>
        <ul style="margin: 8px 0; padding-left: 20px; font-size: 14px;">
            <li>Arrive 15 minutes early at the meeting point</li>
            <li>Bring your QR ticket (will be sent separately)</li>
            <li>Wear comfortable walking shoes</li>
            <li>Check the weather and dress appropriately</li>
        </ul>
    </div>
    
    <div class="details-box">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151;">📋 Your Tour Details</h3>
        <p style="margin: 5px 0;"><strong>Reference:</strong> ${booking.bookingReference}</p>
        <p style="margin: 5px 0;"><strong>Tour:</strong> ${tourName}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${startTime.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Participants:</strong> ${booking.participants}</p>
        ${meetingPoint ? `<p style="margin: 5px 0;"><strong>Meeting Point:</strong> ${meetingPoint}</p>` : ''}
    </div>
    
    <p><strong>Need to contact us?</strong> If you have any questions or need to make changes, please reach out to our support team as soon as possible.</p>
    
    <p>We can't wait to show you an unforgettable experience tomorrow! 🎉</p>
  `;

  return {
    subject: `⏰ Reminder: ${tourName} Tomorrow!`,
    html: createEmailTemplate(content)
  };
}

function generateCancelledEmail(data: BookingEmailData): EmailTemplate {
  const { booking, tour } = data;
  const tourName = tour.name;
  const customerName = booking.customerName;

  const content = `
    <h2>❌ Booking Cancelled</h2>
    <p>Hello ${customerName},</p>
    <p>We're sorry to inform you that your booking for <strong>${tourName}</strong> has been cancelled. We understand this may be disappointing and we apologize for any inconvenience.</p>
    
    <div class="warning-box">
        <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">📋 Cancellation Details</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Tour:</strong> ${tourName}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Original Amount:</strong> $${booking.totalAmount}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Cancelled on:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="details-box">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151;">💰 Refund Information</h3>
        <p style="margin: 0; color: #4b5563;">
            If a refund is applicable, it will be processed according to our cancellation policy. 
            You should expect to see the refund in your original payment method within 5-10 business days.
        </p>
    </div>
    
    <p><strong>What you can do:</strong></p>
    <ul style="margin-bottom: 25px; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Browse our other available tours for alternative dates</li>
        <li style="margin-bottom: 8px;">Contact our support team if you have questions about the cancellation</li>
        <li style="margin-bottom: 8px;">Sign up for our newsletter to get notified about new tours</li>
    </ul>
    
    <p>We hope to welcome you on a future tour. Thank you for understanding, and we apologize again for any inconvenience caused.</p>
  `;

  return {
    subject: `❌ Booking Cancelled - ${tourName}`,
    html: createEmailTemplate(content)
  };
}

function generateQRTicketEmail(data: BookingEmailData): EmailTemplate {
  const { booking, tour, timeSlot } = data;
  const tourName = tour.name;
  const customerName = booking.customerName;
  const startTime = new Date(timeSlot.startTime);
  const meetingPoint = tour.location;
  const ticketCode = booking.ticketQRCode;
  
  // Handle potential undefined ticketCode
  if (!ticketCode) {
    throw new Error('Ticket QR code is required for QR ticket email');
  }
  
  // Generate QR code URL and check-in URL using existing utilities
  const checkInURL = generateCheckInURL(ticketCode);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInURL)}`;
  const displayRef = getDisplayReference(ticketCode);

  const content = `
    <h2>🎫 Your Digital Ticket</h2>
    <p>Hello ${customerName},</p>
    <p>Your digital ticket for <strong>${tourName}</strong> is ready! Please save this email or take a screenshot of your QR code.</p>
    
    <div class="qr-container">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151;">📱 Your QR Ticket</h3>
        <img src="${qrCodeUrl}" alt="QR Ticket" style="max-width: 200px; border: 2px solid #2563eb; border-radius: 8px; display: block; margin: 0 auto;">
        <p style="font-size: 14px; color: #4b5563; margin: 15px 0 5px 0; font-weight: 600;">Ticket Code: ${displayRef}</p>
        <p style="font-size: 12px; color: #6b7280; margin: 0;"><strong>Show this QR code to your tour guide</strong></p>
    </div>
    
    <div class="warning-box">
        <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">📱 Important Instructions:</h3>
        <ul style="margin: 8px 0; padding-left: 20px; font-size: 14px;">
            <li>Save this email or screenshot your QR code</li>
            <li>Present this ticket at the meeting point</li>
            <li>Arrive 15 minutes before tour start time</li>
            <li>Your ticket is valid only for this specific tour</li>
        </ul>
    </div>
    
    <div class="details-box">
        <h3 style="margin-top: 0; margin-bottom: 15px; color: #374151;">📋 Tour Details</h3>
        <p style="margin: 5px 0;"><strong>Reference:</strong> ${booking.bookingReference}</p>
        <p style="margin: 5px 0;"><strong>Tour:</strong> ${tourName}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${startTime.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Participants:</strong> ${booking.participants}</p>
        ${meetingPoint ? `<p style="margin: 5px 0;"><strong>Meeting Point:</strong> ${meetingPoint}</p>` : ''}
    </div>
    
    <p>Can't wait to see you on the tour! Get ready for an amazing adventure! 🌟</p>
  `;

  return {
    subject: `🎫 Your Digital Ticket - ${tourName}`,
    html: createEmailTemplate(content)
  };
}

// Main email sending function
export async function sendBookingEmail(
  emailType: EmailType,
  data: BookingEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    let template: EmailTemplate;

    switch (emailType) {
      case 'confirmation':
        template = generateConfirmationEmail(data);
        break;
      case 'payment':
        template = generatePaymentEmail(data);
        break;
      case 'reminder':
        template = generateReminderEmail(data);
        break;
      case 'cancelled':
        template = generateCancelledEmail(data);
        break;
      case 'qr-ticket':
        template = generateQRTicketEmail(data);
        break;
      default:
        throw new Error(`Invalid email type: ${emailType}`);
    }

    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.booking.customerEmail],
      subject: template.subject,
      html: template.html
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`Error sending ${emailType} email:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Test email function
export async function sendTestEmail(): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    const testHtml = createEmailTemplate(`
      <h2>🎫 Booking System Test</h2>
      <p>Hello Zaur Team,</p>
      <p>This is a test email from your <strong>Zaur Tours booking system</strong>!</p>
      <div class="details-box">
        <p style="margin: 0;"><strong>✅ Booking email system is working correctly!</strong></p>
        <p style="margin: 5px 0 0 0; color: #666;">
          Sent at: ${new Date().toLocaleString()}<br>
          From: SvelteKit Email Service
        </p>
      </div>
      <p>This confirms that booking confirmations, payment notifications, and QR tickets will be sent successfully.</p>
    `);

    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: ['nom@zaur.app'],
      subject: '🎫 Booking System Test - Zaur Tours',
      html: testHtml
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Function to send booking reminders for tours starting tomorrow
export async function sendBookingReminders(): Promise<{ 
  success: boolean; 
  sent: number; 
  found: number; 
  error?: string 
}> {
  try {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    // This would need to be called from a cron job or API endpoint
    // For now, return a placeholder - the actual implementation would:
    // 1. Query PocketBase for bookings with tours starting tomorrow
    // 2. Send reminder emails for each booking
    // 3. Return the count of emails sent

    return { success: true, sent: 0, found: 0 };
  } catch (error) {
    console.error('Error sending booking reminders:', error);
    return { 
      success: false, 
      sent: 0, 
      found: 0,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 