// Re-export everything from the new modular email system
export * from './email/sender.js';
export type { BookingEmailData, EmailResult, BookingEmailType } from './email/sender.js';

// Import what we need for auth emails
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { baseTemplate } from './email/components/base-template.js';
import { header, footer, contentWrapper, button, infoBox, list } from './email/components/index.js';

// Configuration
const FROM_EMAIL = 'noreply@auth.zaur.app';
const FROM_NAME = 'Zaur';

// Auth email types
export type AuthEmailType = 'password-reset' | 'email-verification' | 'welcome' | 'email-changed';

interface AuthEmailData {
  email: string;
  name?: string;
  token?: string;
  resetUrl?: string;
  verificationUrl?: string;
  newEmail?: string;
}

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

// Authentication email templates using the new component system
function generatePasswordResetEmail(data: AuthEmailData): { subject: string; html: string } {
  const { email, name, resetUrl } = data;
  const userName = name || email.split('@')[0];

  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>🔐 Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      
      ${infoBox({
        title: '⚠️ Security Notice',
        content: list([
          { text: 'This reset link will expire in 1 hour' },
          { text: 'Only use this link if you requested a password reset' },
          { text: 'Never share this link with anyone' }
        ]),
        variant: 'warning'
      })}
      
      ${button({
        text: 'Reset My Password',
        href: resetUrl || '#',
        variant: 'danger'
      })}
      
      ${infoBox({
        title: '📋 Request Details',
        content: `
          <p style="margin: 5px 0;"><strong>Account:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>If this wasn't you:</strong> Your account is still secure. No action needed.</p>
        `
      })}
      
      <p style="font-size: 14px; color: #6b7280;">
        If the button doesn't work, copy and paste this link:<br>
        <span style="word-break: break-all;">${resetUrl}</span>
      </p>
    `)}
    ${footer()}
  `;

  return {
    subject: '🔐 Reset Your Password - Zaur',
    html: baseTemplate({ content, preheader: 'Reset your Zaur password' })
  };
}

function generateEmailVerificationEmail(data: AuthEmailData): { subject: string; html: string } {
  const { email, name, verificationUrl } = data;
  const userName = name || email.split('@')[0];

  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>🎉 Welcome to Zaur!</h2>
      <p>Hello ${userName},</p>
      <p>Thanks for signing up! Please verify your email address to get started.</p>
      
      ${infoBox({
        title: '✨ Why verify?',
        content: list([
          { text: 'Secure your account' },
          { text: 'Receive booking confirmations' },
          { text: 'Get QR tickets via email' },
          { text: 'Access all features' }
        ]),
        variant: 'success'
      })}
      
      ${button({
        text: 'Verify My Email',
        href: verificationUrl || '#',
        variant: 'success'
      })}
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
        If the button doesn't work, copy and paste this link:<br>
        <span style="word-break: break-all;">${verificationUrl}</span>
      </p>
    `)}
    ${footer()}
  `;

  return {
    subject: '🎉 Verify Your Email - Zaur',
    html: baseTemplate({ content, preheader: 'Verify your email to start using Zaur' })
  };
}

function generateWelcomeEmail(data: AuthEmailData): { subject: string; html: string } {
  const { email, name } = data;
  const userName = name || email.split('@')[0];

  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>🎊 Welcome Aboard!</h2>
      <p>Hello ${userName},</p>
      <p>Your email is verified and you're all set to start using Zaur!</p>
      
      ${infoBox({
        title: '🚀 You\'re Ready to Go!',
        content: '<p style="margin: 0;">Start with creating your first tour.</p>',
        variant: 'success'
      })}
      
      <h3>What You Can Do Now:</h3>
      ${list([
        { text: 'Create your first tour', icon: '🗺️' },
        { text: 'Manage your bookings', icon: '💳' },
        { text: 'Get QR tickets delivered to your email', icon: '🎫' },
        { text: 'Manage your bookings in one place', icon: '📱' }
      ])}
      
      ${button({
        text: 'Create Your First Tour',
        href: 'https://zaur.app/tours/new'
      })}
      
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        Ready for your next adventure? Let's go!
      </p>
    `)}
    ${footer()}
  `;

  return {
    subject: '🎊 Welcome to Zaur - Start Exploring!',
    html: baseTemplate({ content, preheader: 'Your adventure starts here' })
  };
}

// Main authentication email sending function
export async function sendAuthEmail(
  emailType: AuthEmailType,
  data: AuthEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let template: { subject: string; html: string };

    switch (emailType) {
      case 'password-reset':
        template = generatePasswordResetEmail(data);
        break;
      case 'email-verification':
        template = generateEmailVerificationEmail(data);
        break;
      case 'welcome':
        template = generateWelcomeEmail(data);
        break;
      case 'email-changed':
        // Simple email change notification
        template = {
          subject: '📧 Email Address Updated - Zaur',
          html: baseTemplate({
            content: `
              ${header()}
              ${contentWrapper(`
                <h2>📧 Email Address Updated</h2>
                <p>Your email address has been successfully updated.</p>
                <p>New email: ${data.newEmail}</p>
                <p>If you didn't make this change, please contact support immediately.</p>
              `)}
              ${footer()}
            `
          })
        };
        break;
      default:
        throw new Error(`Invalid auth email type: ${emailType}`);
    }

    const resend = getResend();
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.email],
      subject: template.subject,
      html: template.html
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    console.log(`✅ ${emailType} email sent successfully to ${data.email}`);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`Error sending ${emailType} email:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper to format participant display (for backward compatibility)
export { formatParticipantDisplay } from './email/utils.js';

// Backward compatibility exports
export { sendTestEmail, sendGuideNotificationEmail } from './email/sender.js';

// Placeholder for booking reminders (to be implemented with cron job)
export async function sendBookingReminders(): Promise<{ 
  success: boolean; 
  sent: number; 
  found: number; 
  error?: string 
}> {
  // This would need to be called from a cron job or API endpoint
  // Implementation would query database for bookings with tours starting tomorrow
  return { success: true, sent: 0, found: 0 };
} 