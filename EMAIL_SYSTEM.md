# Zaur Tours Email System

This document describes the unified email system for Zaur Tours, which has been refactored to send emails directly from the SvelteKit application using Resend, eliminating the need for duplicated logic in PocketBase hooks.

## Overview

The email system handles all booking-related notifications:
- ✅ **Booking Confirmations** - When a booking is confirmed and paid
- 💳 **Payment Received** - When payment is processed successfully  
- 🗓️ **Booking Reminders** - Sent 24 hours before tour starts
- ❌ **Booking Cancellations** - When a booking is cancelled
- 🎫 **QR Tickets** - Digital tickets with QR codes for check-in

## Architecture

### Before (Complex)
- **PocketBase VPS**: Complex hooks with duplicated QR code logic
- **SvelteKit App**: Separate email API calls to PocketBase
- **Maintenance**: Two codebases to maintain with duplicated logic

### After (Simple)
- **SvelteKit App**: Unified email service using Resend
- **Shared Utilities**: Reuses existing QR code and URL generation functions
- **Maintenance**: Single codebase with consistent logic

## Components

### 1. Email Service (`src/lib/email.server.ts`)
Central email service that handles all booking email types:

```typescript
import { sendBookingEmail, sendTestEmail } from '$lib/email.server.js';

// Send any type of booking email
const result = await sendBookingEmail('confirmation', {
  booking,
  tour,
  timeSlot
});

// Send test email
const testResult = await sendTestEmail();
```

**Features:**
- 🎨 Beautiful HTML email templates with consistent styling
- 🔄 Reuses existing `ticket-qr.ts` utilities for QR code generation
- 📱 Mobile-responsive email design
- ✅ Error handling and logging
- 🏷️ TypeScript support with proper interfaces

### 2. API Endpoints

#### Test & Manual Emails (`/api/test-booking-emails`)
```bash
# Send test email
POST /api/test-booking-emails
{ "action": "test" }

# Send specific email type
POST /api/test-booking-emails  
{ "action": "send-email", "bookingId": "abc123", "emailType": "confirmation" }

# Send QR ticket
POST /api/test-booking-emails
{ "action": "send-qr-ticket", "bookingId": "abc123" }

# Send booking reminders
POST /api/test-booking-emails
{ "action": "send-reminders" }
```

#### Booking Reminders (`/api/send-booking-reminders`)
Queries PocketBase for tomorrow's confirmed bookings and sends reminder emails:

```bash
POST /api/send-booking-reminders
# Returns: { sent: 5, found: 5, message: "..." }
```

#### Cron Job (`/api/cron/daily-reminders`)
Secure endpoint for external cron services:

```bash
POST /api/cron/daily-reminders
Authorization: Bearer YOUR_CRON_SECRET_TOKEN
```

### 3. API Endpoints

#### Core Email Endpoints

**`/api/send-booking-email`** - Send individual booking emails
```bash
POST /api/send-booking-email
{
  "bookingId": "abc123",
  "emailType": "confirmation" | "payment" | "reminder" | "cancelled" | "qr-ticket"
}
```

**`/api/send-booking-reminders`** - Send daily reminder batch
```bash
POST /api/send-booking-reminders
# Returns: { sent: 5, found: 5, message: "..." }
```

**`/api/test-booking-emails`** - Admin testing interface
```bash
POST /api/test-booking-emails
{ "action": "test" | "send-email" | "send-qr-ticket" | "send-reminders" }
```

#### Integration Endpoints

**`/api/booking-created`** - Webhook for new bookings
```bash
POST /api/booking-created
{ "bookingId": "abc123" }
# Automatically sends confirmation emails if booking is paid
```

**`/api/cron/daily-reminders`** - Secure cron endpoint
```bash
POST /api/cron/daily-reminders
Authorization: Bearer YOUR_CRON_SECRET_TOKEN
```

### 4. Environment Variables

Add these to your `.env` file:

```bash
# Required - Resend API key
RESEND_API_KEY=re_xxxxxxxxx

# Required - PocketBase admin credentials for server-side operations
PB_ADMIN_EMAIL=admin@zaur.app
PB_ADMIN_PASSWORD=your_admin_password

# Optional - For cron job authentication
CRON_SECRET_TOKEN=your_secret_token_here
```

## Email Templates

All emails use a consistent, professional design:

### Base Template Features
- 📧 **From**: `Zaur Tours <noreply@zaur.app>`
- 🎨 **Design**: Clean, mobile-responsive HTML
- 🏢 **Branding**: Consistent Zaur Tours styling
- 📱 **Mobile**: Optimized for all email clients

### Template Types

1. **Booking Confirmation** (`confirmation`)
   - Booking details (reference, date, participants, amount)
   - Meeting point information
   - Thank you message

2. **Payment Received** (`payment`)
   - Payment confirmation
   - Booking reference
   - Amount paid

3. **Booking Reminder** (`reminder`)
   - Sent 24 hours before tour
   - All booking details
   - Meeting point reminder

4. **Booking Cancelled** (`cancelled`)
   - Cancellation confirmation
   - Booking details
   - Contact information

5. **QR Ticket** (`qr-ticket`)
   - Digital ticket with QR code
   - Booking details
   - Check-in instructions
   - Uses existing `generateCheckInURL()` and `getDisplayReference()` utilities

## Integration Points

### Stripe Webhooks
The Stripe webhook automatically triggers confirmation emails when payment succeeds:
- ✅ **Automatic Integration**: Already implemented in `/api/webhooks/stripe`
- 📧 **Sends**: Confirmation email + QR ticket on payment success
- 🔄 **No Setup Required**: Works automatically for all payments

### Booking Status Changes
When booking status changes via admin interface:
- ✅ **Automatic Integration**: Already implemented in `/api/bookings/[id]/update-status`
- 📧 **Smart Email Logic**: Sends appropriate emails based on status transitions
- 🎯 **Triggers**: Confirmation, payment received, or cancellation emails

### Booking Creation
When new bookings are created:
```typescript
// Call after booking creation
await fetch('/api/booking-created', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bookingId })
});
```

### Daily Reminders
Set up a cron job to call the reminder endpoint daily:

```bash
# Example cron job (runs daily at 9 AM)
0 9 * * * curl -X POST https://zaur.app/api/cron/daily-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

### Admin Dashboard
Comprehensive email management interface:
- 🎛️ **Location**: `/admin/email-dashboard` 
- 📊 **Features**: Bulk email operations, recent bookings, quick actions
- 🧪 **Testing**: Direct access to `/admin/email-test`

## Testing

### Admin Interface
Visit `/admin/email-test` to test the email system:
- 🧪 Send test emails
- 📧 Send specific email types for existing bookings
- 🎫 Send QR tickets
- ⏰ Trigger booking reminders

### Manual Testing
```bash
# Test email
curl -X POST https://zaur.app/api/test-booking-emails \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'

# Send confirmation email
curl -X POST https://zaur.app/api/test-booking-emails \
  -H "Content-Type: application/json" \
  -d '{"action": "send-email", "bookingId": "abc123", "emailType": "confirmation"}'
```

## Migration Benefits

### ✅ Advantages
- **Simplified Architecture**: Single codebase for all email logic
- **Shared Utilities**: Reuses existing QR code generation functions
- **Better Maintenance**: No more duplicated code between frontend and backend
- **Improved Reliability**: Direct integration with Resend API
- **Enhanced Testing**: Built-in admin interface for testing
- **TypeScript Support**: Full type safety for email data

### 🗑️ Removed Complexity
- ❌ PocketBase email hooks with duplicated logic
- ❌ Complex API calls between SvelteKit and PocketBase
- ❌ Inconsistent QR code generation logic
- ❌ Multiple email template systems

## Monitoring & Logs

All email operations are logged with clear success/error messages:

```
✅ Confirmation email sent successfully to customer@example.com
❌ Failed to send reminder email: Invalid booking data
📧 Test email sent successfully (messageId: abc123)
```

Monitor your Resend dashboard for delivery statistics and any bounced emails.

## Future Enhancements

- 📊 **Email Analytics**: Track open rates and click-through rates
- 🌍 **Internationalization**: Multi-language email templates
- 📧 **Email Preferences**: Customer email notification preferences
- 🎨 **Template Customization**: Per-tour custom email templates
- 📱 **SMS Integration**: Optional SMS notifications for urgent updates 