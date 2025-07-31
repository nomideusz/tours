# WhatsApp Integration Testing Guide

## 🎉 Your Setup Status

✅ **Phone Number**: 15558084471  
✅ **Webhook URL**: https://zaur.app/api/webhooks/gupshup?token=WHgup_2024_7k9mR3nP8qL5zX2vN9jW4uB6eT1yH8sA  
✅ **Environment Variables**: All configured correctly  
✅ **Message Sending**: Working (tested with message ID: 785e3174-ef53-4e85-ba01-76093685fc22)  
✅ **Webhook Reception**: Working (all webhook types respond successfully)  

## 🚀 Quick Test Commands

### 1. Test Direct Message Sending
```bash
node scripts/test-whatsapp.js +YOUR_PHONE_NUMBER
```

### 2. Test Webhook Reception
```bash
node scripts/test-webhook.js
```

### 3. Test Booking Notifications (with real booking ID)
```bash
node scripts/test-booking-notification.js [actual-booking-id]
```

## 📱 Gupshup Dashboard Verification

1. **Check Message Status**: Log into your Gupshup dashboard at https://www.gupshup.io/
2. **View Message Logs**: Go to Analytics > Message Logs to see sent messages
3. **Webhook Logs**: Check if webhooks are being received in your dashboard
4. **Phone Number Status**: Verify your number 15558084471 is active and approved

## 🔧 Testing with Real Data

### Step 1: Create a Test Booking
1. Go to your app and create a real tour
2. Make a test booking with a phone number
3. Note the booking ID from your database

### Step 2: Test Real Booking Notification
```bash
node scripts/test-booking-notification.js [real-booking-id]
```

## 🎯 What Each Test Does

### WhatsApp Message Test (`test-whatsapp.js`)
- Sends a formatted booking confirmation message
- Returns a message ID if successful
- Tests the core Gupshup API integration

### Webhook Test (`test-webhook.js`)
- Simulates Gupshup sending delivery status updates
- Tests message delivery events
- Tests incoming message handling
- Tests user opt-out events

### Booking Notification Test (`test-booking-notification.js`)
- Tests the complete application flow
- Tests customer and guide notifications
- Tests different message templates:
  - `booking_confirmation` - Sent to customers
  - `guide_notification` - Sent to tour guides
  - `booking_reminder` - Reminder messages

## 📊 Message Templates Available

Your integration supports these WhatsApp templates:

1. **Booking Confirmation**
   - Sent to customers when booking is confirmed
   - Includes tour details, meeting point, ticket code

2. **Guide Notification** 
   - Sent to tour guides for new bookings
   - Includes customer details and booking summary

3. **Booking Reminder**
   - Sent to customers before tour date
   - Includes tour details and reminder to arrive early

4. **Booking Cancellation**
   - Sent when bookings are cancelled
   - Includes cancellation reason

## 🐛 Troubleshooting

### If Messages Don't Send:
1. Check Gupshup API key and app name in environment
2. Verify phone number format (should be without + prefix for Gupshup)
3. Check if number is opted in to receive WhatsApp messages
4. Verify your Gupshup account has sufficient credits

### If Webhooks Don't Work:
1. Check webhook URL is correctly configured in Gupshup dashboard
2. Verify webhook token matches your environment variable
3. Check server logs for webhook processing errors
4. Test webhook URL manually with curl or Postman

### If Booking Notifications Fail:
1. Ensure WhatsApp notifications are enabled in feature flags
2. Check if booking exists in database
3. Verify customer/guide has phone numbers
4. Check user subscription plan allows WhatsApp features

## 🔍 Monitoring & Logs

### Server Logs
Check your application logs at https://zaur.app for:
- Webhook event processing: `📱 Gupshup webhook received`
- Message delivery status: `📊 Message status update`
- Incoming messages: `💬 Incoming WhatsApp message`

### Gupshup Dashboard
Monitor in your Gupshup dashboard:
- Message delivery rates
- Failed messages
- Webhook delivery status
- Account credits/usage

## 🎯 Next Steps

1. **Enable for Production**: Update feature flags to enable WhatsApp for your target subscription plans
2. **Set Up Monitoring**: Implement proper logging and alerting for failed messages
3. **Template Approval**: Ensure all message templates are approved by Gupshup/WhatsApp
4. **User Opt-in**: Implement user preference management for WhatsApp notifications
5. **Error Handling**: Add retry logic for failed message deliveries

## 📞 Phone Number Requirements

Remember that for production use:
- Phone numbers must opt-in to receive WhatsApp business messages
- Templates must be pre-approved by WhatsApp
- Consider implementing a double opt-in flow
- Handle opt-out requests properly (your webhook already does this)

---

**Your integration is working correctly!** 🎉 

The test message was successfully sent with ID: `785e3174-ef53-4e85-ba01-76093685fc22`

Check WhatsApp on your test number to confirm message delivery.