# WhatsApp 24-Hour Messaging Window Policy

## What is Error 470?

Error 470 "Re-engagement message" is **NOT a bug** - it's WhatsApp Business API's policy enforcement. This error occurs when trying to send template messages to customers who haven't interacted with your WhatsApp number in the last 24 hours.

## WhatsApp's 24-Hour Messaging Window

### The Rule

WhatsApp Business API only allows you to send **template messages** (like booking confirmations) to customers if:

1. **They messaged you first** within the last 24 hours, OR
2. **You're replying within 24 hours** of their last message

After 24 hours of no interaction, you cannot send template messages until the customer messages you again.

### Why This Policy Exists

WhatsApp enforces this to:
- Prevent spam
- Protect user privacy
- Ensure businesses only message customers who want to hear from them
- Maintain WhatsApp's reputation as a spam-free platform

## Impact on Zaur Platform

### What Works ✅

1. **Immediate booking confirmations** - If customers book and provide WhatsApp number, they get confirmation immediately (within the session)
2. **24-hour reminders** - If tour is within 24 hours of booking, reminder will work
3. **Active conversations** - Once customer messages you, 24-hour window opens

### What Doesn't Work ❌

1. **Old bookings** - Cannot send WhatsApp to customers from bookings made >24h ago (unless they messaged you)
2. **Re-engagement** - Cannot reach out to past customers via WhatsApp (unless they message first)
3. **Marketing messages** - Cannot send promotional WhatsApp messages to old contacts

## Solutions for Tour Guides

### Option 1: Immediate Booking Flow (Recommended)

When customers book, they receive WhatsApp confirmation **immediately** during the booking session. This is the most reliable approach.

**Implementation:**
- Already working in Zaur
- Confirmation sent right after payment
- Works because it's within the booking session

### Option 2: WhatsApp Widget on Booking Page

Add a WhatsApp chat widget where customers can message you first:

1. Customer clicks WhatsApp icon on booking page
2. They send any message ("Hi", etc.)
3. This opens the 24-hour window
4. Now you can send template messages for 24 hours

**Implementation:**
```html
<!-- WhatsApp Chat Button -->
<a href="https://wa.me/48XXXXXXXXX?text=Hi,%20I'm%20interested%20in%20your%20tour"
   target="_blank"
   class="whatsapp-button">
  💬 Message us on WhatsApp
</a>
```

### Option 3: Phone-First Booking

Customers who want WhatsApp updates should:
1. Message your WhatsApp number first
2. Then complete the booking
3. They'll receive all updates via WhatsApp

### Option 4: Email + Optional WhatsApp

**Current Zaur approach:**
- ✅ **Email confirmations** - Always work, no restrictions
- 📱 **WhatsApp as bonus** - Works when possible, gracefully fails when not

This hybrid approach ensures customers always get confirmations (via email) while providing WhatsApp convenience when available.

## Technical Implementation in Zaur

### Error Handling

The system now handles error 470 gracefully:

```typescript
// In webhook handler (src/routes/api/webhooks/gupshup/+server.ts)
if (errorCode === 470) {
  // Log as INFO, not ERROR
  console.log(`ℹ️ WhatsApp message not sent (24-hour window)`)
  // Customer still got email, so booking is fine
}
```

### What Happens When Error 470 Occurs

1. ✅ WhatsApp message is attempted
2. ⚠️ Error 470 occurs (24-hour window expired)
3. ℹ️ System logs it as INFO (not error)
4. ✅ Customer already has email confirmation
5. ✅ Booking is 100% valid and confirmed

**Key Point:** Error 470 doesn't affect the booking - it only means WhatsApp couldn't be used as an *additional* notification channel.

## Monitoring & Logs

### Normal Logs (Not Errors)

```
ℹ️ WhatsApp message not sent (24-hour window): {
  messageId: 'xxx',
  recipient: '48602846912',
  note: 'Customer needs to message first or be within 24h of last interaction'
}
```

This is **expected** and means the system is working correctly.

### Actual Errors

```
⚠️ WhatsApp message failed: {
  messageId: 'xxx',
  recipient: '48602846912',
  errorDetails: { code: 131048, reason: 'Rate limit exceeded' }
}
```

These require investigation (not error 470).

## Best Practices for Tour Guides

### ✅ DO

1. **Set customer expectations**
   - "Booking confirmed! Check your email for details"
   - "WhatsApp confirmation sent (if available)"

2. **Use email as primary**
   - Always send email confirmations
   - WhatsApp is a bonus, not replacement

3. **Encourage customer-initiated contact**
   - Add WhatsApp button on booking page
   - Mention "Message us on WhatsApp for updates"

4. **Book within 24 hours of tour**
   - Most bookings happen close to tour date
   - 24-hour reminders will work for recent bookings

### ❌ DON'T

1. **Don't rely solely on WhatsApp**
   - Always have email as fallback
   - Some customers won't get WhatsApp

2. **Don't spam customers**
   - Even with 24-hour window open
   - Respect WhatsApp's anti-spam policy

3. **Don't see error 470 as failure**
   - It's a policy, not a bug
   - Booking is still confirmed

## Alternatives to WhatsApp Templates

### For Customer Re-engagement

If you need to message old customers, use:

1. **Email campaigns** - No restrictions
2. **SMS** - Works anytime (different service)
3. **Push notifications** - In-app messages
4. **Regular WhatsApp** - Manual messages from your phone (not Business API)

### Business API vs. Regular WhatsApp

- **Business API** (Zaur uses this): 24-hour restriction, automated, scalable
- **Regular WhatsApp**: No restrictions, manual, less scalable

## FAQ

**Q: Can we pay WhatsApp to remove the 24-hour restriction?**
A: No, this is a policy for all Business API users, regardless of plan.

**Q: What if customer really needs WhatsApp updates?**
A: They should message your WhatsApp number first, then complete booking.

**Q: Does this affect paid WhatsApp Business Platform?**
A: Yes, same 24-hour window applies to all Business API tiers.

**Q: Can we use session messages instead?**
A: Session messages (free-form text) work within 24h window. Template messages (structured) trigger error 470 after 24h.

## Summary

**Error 470 is expected behavior, not a bug.**

- ✅ System working correctly
- ✅ Bookings are confirmed (via email)
- ✅ WhatsApp works when possible
- ℹ️ Error 470 = Policy limitation, not technical failure

Tour guides should:
1. Focus on email confirmations (always reliable)
2. Treat WhatsApp as bonus feature
3. Encourage customers to message first if they want WhatsApp updates
4. Book tours close to date (within 24h helps)

## Related Documentation

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/pricing)
- [WhatsApp Template Messages](https://developers.facebook.com/docs/whatsapp/api/messages/message-templates)
- Memory ID: 5291846 (WhatsApp 24-hour window policy)

