# WhatsApp Business API Setup Guide

This guide will help you set up WhatsApp Business notifications for Zaur.

## Overview

Zaur supports WhatsApp Business API integration for sending booking notifications to both customers and tour guides. The system supports multiple providers to give you flexibility in choosing the best option for your needs.

## Supported Providers

### 1. Plivo (Recommended)
- **Pricing**: $0.00080 per conversation + Meta fees
- **Best for**: High-volume operations
- **Pros**: Very cost-effective, good documentation
- **Setup complexity**: Medium

### 2. Gupshup
- **Pricing**: $0.001 per message + Meta fees
- **Best for**: Mid-volume operations
- **Pros**: Easy setup, good support
- **Setup complexity**: Easy

### 3. Twilio
- **Pricing**: $0.005 per message + Meta fees
- **Best for**: Enterprises needing advanced features
- **Pros**: Most features, best documentation
- **Setup complexity**: Medium

## Prerequisites

1. **WhatsApp Business Account**: You need a Facebook Business Manager account
2. **Phone Number**: A dedicated phone number for WhatsApp Business (cannot be used for regular WhatsApp)
3. **Provider Account**: Account with your chosen provider (Plivo, Gupshup, or Twilio)

## Setup Steps

### Step 1: Create WhatsApp Business Account

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Create or select your business
3. Navigate to WhatsApp Accounts
4. Create a new WhatsApp Business Account
5. Verify your business (may take 1-2 days)

### Step 2: Choose and Setup Provider

#### For Plivo:

1. Sign up at [Plivo Console](https://console.plivo.com/accounts/register/)
2. Navigate to Messaging > WhatsApp
3. Connect your WhatsApp Business Account
4. Get your credentials:
   - Auth ID
   - Auth Token
   - WhatsApp Phone Number

#### For Gupshup:

1. Sign up at [Gupshup](https://www.gupshup.io/developer/home)
2. Create a new WhatsApp App
3. Connect your WhatsApp Business Account
4. Get your credentials:
   - API Key
   - App Name
   - WhatsApp Phone Number

#### For Twilio:

1. Sign up at [Twilio Console](https://www.twilio.com/try-twilio)
2. Navigate to Messaging > Try it out > Send a WhatsApp message
3. Follow the WhatsApp sandbox setup
4. For production:
   - Request WhatsApp access
   - Create a Messaging Service
   - Get your credentials:
     - Account SID
     - Auth Token
     - Messaging Service SID

### Step 3: Configure Environment Variables

Add the following to your `.env` file based on your chosen provider:

```bash
# Enable WhatsApp notifications
WHATSAPP_ENABLED=true

# Your WhatsApp Business phone number (with country code, e.g., +1234567890)
WHATSAPP_PHONE_NUMBER=+1234567890

# For Plivo
PLIVO_AUTH_ID=your_plivo_auth_id
PLIVO_AUTH_TOKEN=your_plivo_auth_token

# For Gupshup
GUPSHUP_API_KEY=your_gupshup_api_key
GUPSHUP_APP_NAME=your_app_name
# Optional: Webhook verification token (if you enable webhook security)
GUPSHUP_WEBHOOK_TOKEN=your_webhook_verification_token

# For Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_SERVICE_SID=your_messaging_service_sid
```

### Step 4: Create Message Templates

WhatsApp requires pre-approved message templates for business-initiated conversations.

1. Log into your provider's console
2. Navigate to WhatsApp Templates
3. Create the following templates:

#### Booking Confirmation Template
```
Name: booking_confirmation
Category: Utility

Header: 🎉 Booking Confirmed!

Body: Hello {{1}},

Your booking for *{{2}}* on {{3}} has been confirmed!

📍 Meeting point: {{4}}
👥 Participants: {{5}}
💰 Total: {{6}}

Your ticket code: *{{7}}*

Show this code at check-in.

Footer: Thank you for booking with {{8}}
```

#### Tour Reminder Template
```
Name: booking_reminder
Category: Utility

Header: ⏰ Tour Reminder

Body: Hi {{1}},

This is a friendly reminder about your tour tomorrow!

🎯 *{{2}}*
📅 {{3}}
📍 Meeting point: {{4}}

Your ticket code: *{{5}}*

Please arrive 10 minutes early. See you there!
```

#### Guide Notification Template
```
Name: new_booking_guide
Category: Utility

Header: 🎉 New Booking Received!

Body: Hello {{1}},

You have a new booking!

🎯 Tour: *{{2}}*
📅 Date: {{3}}
👤 Customer: {{4}}
👥 Participants: {{5}}
💰 Amount: {{6}}

Check your dashboard for full details.
```

### Step 5: Configure Webhooks (Optional but Recommended)

#### For Gupshup:

1. Log into [Gupshup Console](https://www.gupshup.io/developer/home)
2. Go to your App Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/gupshup`
   - Optional: Add `?token=your_secret_token` for security
4. Select events:
   - `message-event` - For delivery status updates
   - `message` - For incoming customer messages (optional)
   - `user-event` - For opt-in/opt-out tracking

The webhook will:
- Track message delivery status (sent, delivered, read, failed)
- Handle incoming customer messages (for future two-way chat)
- Track user opt-outs automatically

### Step 6: Test Your Setup

1. Enable WhatsApp for a test tour guide account (Professional or Agency plan)
2. Create a test booking with a phone number
3. Check the logs for any errors
4. Verify messages are received

## Troubleshooting

### Common Issues

1. **Templates not approved**: Ensure templates follow WhatsApp guidelines
2. **Phone number format errors**: Always use E.164 format (+countrycode + number)
3. **Provider authentication failures**: Double-check your credentials
4. **No messages received**: Verify your WhatsApp Business Account is active

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG_WHATSAPP=true
```

## Best Practices

1. **Opt-in Required**: Always get explicit consent before sending WhatsApp messages
2. **Template Guidelines**: Keep messages informative and non-promotional
3. **Timing**: Respect timezone differences when sending messages
4. **Fallback**: Always send email notifications as a fallback
5. **Rate Limits**: Be aware of provider rate limits

## Cost Estimation

For 1000 bookings per month:
- **Plivo**: ~$0.80 + Meta fees (~$10) = ~$10.80/month
- **Gupshup**: ~$3.00 + Meta fees (~$10) = ~$13.00/month  
- **Twilio**: ~$15.00 + Meta fees (~$10) = ~$25.00/month

*Meta fees vary by country and message type

## Support

For provider-specific support:
- Plivo: support@plivo.com
- Gupshup: https://www.gupshup.io/developer/docs
- Twilio: https://support.twilio.com/

For Zaur integration issues, please check the logs or contact support. 