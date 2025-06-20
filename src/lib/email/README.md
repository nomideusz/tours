# Zaur Email System

This is the modular email system for Zaur - Tour Experiences platform. It provides a unified, professional email experience for tour bookings, QR tickets, and authentication.

## Architecture

```
src/lib/email/
├── components/       # Reusable email components
│   ├── base-template.ts
│   └── index.ts
├── templates/        # Email templates
│   ├── booking-confirmation.ts
│   ├── qr-ticket.ts
│   ├── tour-reminder.ts
│   └── guide-booking-notification.ts
├── styles.ts         # Centralized styling
├── utils.ts          # Formatting utilities
├── sender.ts         # Email sending logic
└── README.md         # This file
```

## Usage

### Sending Booking Emails

```typescript
import { sendBookingEmail } from '$lib/email.server';

const result = await sendBookingEmail('confirmation', {
  booking,
  tour,
  timeSlot
});
```

### Available Email Types

- `confirmation` - Booking confirmation
- `payment` - Payment received
- `reminder` - Tour reminder (24h before)
- `qr-ticket` - QR ticket delivery
- `cancelled` - Booking cancellation

### Sending Guide Notifications

```typescript
import { sendGuideNotificationEmail } from '$lib/email.server';

const result = await sendGuideNotificationEmail({
  booking,
  tour,
  timeSlot,
  guideEmail: 'guide@example.com',
  guideName: 'John Doe'
});
```

### Authentication Emails

```typescript
import { sendAuthEmail } from '$lib/email.server';

// Password reset
await sendAuthEmail('password-reset', {
  email: 'user@example.com',
  name: 'John',
  resetUrl: 'https://zaur.app/auth/reset?token=...'
});

// Email verification
await sendAuthEmail('email-verification', {
  email: 'user@example.com',
  name: 'John',
  verificationUrl: 'https://zaur.app/auth/verify?token=...'
});
```

## Components

### Base Template
Provides the HTML structure and includes all styles.

### Reusable Components
- `header()` - Zaur branding header
- `footer()` - Standard footer with links
- `button()` - Call-to-action buttons
- `infoBox()` - Highlighted information boxes
- `tourDetails()` - Tour booking details
- `qrCode()` - QR code display
- `list()` - Formatted lists with icons

## Styling

All styles are centralized in `styles.ts`:
- Consistent color palette
- Typography settings
- Component dimensions
- Mobile responsiveness

## Adding New Templates

1. Create a new file in `templates/`
2. Import required components
3. Export template function and email function
4. Add to sender.ts if needed

Example:
```typescript
import { baseTemplate } from '../components/base-template.js';
import { header, footer, contentWrapper } from '../components/index.js';

export function myTemplateEmail(data: MyData) {
  return {
    subject: 'Email Subject',
    html: baseTemplate({
      content: `
        ${header()}
        ${contentWrapper(`
          <!-- Your content here -->
        `)}
        ${footer()}
      `
    })
  };
}
```

## Testing

Use the test email function:
```typescript
import { sendTestEmail } from '$lib/email.server';

await sendTestEmail('test@example.com');
```

## Configuration

- **FROM_EMAIL**: `noreply@auth.zaur.app`
- **FROM_NAME**: `Zaur`
- **API_KEY**: Set `RESEND_API_KEY` environment variable

## Best Practices

1. Always use components for consistency
2. Test emails across different clients
3. Keep subject lines concise and descriptive
4. Use emojis sparingly in subject lines
5. Ensure all links are absolute URLs
6. Provide text alternatives for images 