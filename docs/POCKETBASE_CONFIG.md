# PocketBase Configuration Guide for Zaur

This guide explains how to configure PocketBase collections for the Zaur booking system to work properly.

## Required API Rules

For the booking flow to work for anonymous users, you need to configure the following API rules in PocketBase Admin:

### 1. QR Codes Collection (`qr_codes`)
- **View Rule**: `true` or empty (allows public read access)
- **Create/Update/Delete**: `@request.auth.id != ""` (authenticated users only)

### 2. Tours Collection (`tours`)
- **View Rule**: `true` or empty (allows public read access)
- **Create/Update/Delete**: `user = @request.auth.id` (only owner can modify)

### 3. Time Slots Collection (`time_slots`)
- **View Rule**: `true` or empty (allows public read access)
- **Create/Update/Delete**: `@request.auth.id != ""` (authenticated users only)

### 4. Bookings Collection (`bookings`)
- **View Rule**: `@request.auth.id != ""` (authenticated users only)
- **Create Rule**: `true` (allows anonymous users to create bookings)
- **Update Rule**: `true` (allows webhook updates)
- **Delete Rule**: `@request.auth.id != ""` (authenticated users only)

### 5. Payments Collection (`payments`)
- **View Rule**: `@request.auth.id != ""` (authenticated users only)
- **Create Rule**: `true` (allows payment creation)
- **Update Rule**: `true` (allows webhook updates)
- **Delete Rule**: `@request.auth.id != ""` (authenticated users only)

### 6. Users Collection (`users`)
- Default PocketBase rules are fine
- Make sure OAuth2 is properly configured if using Google login

## How to Configure

1. Log in to your PocketBase Admin panel
2. Navigate to Collections
3. For each collection listed above:
   - Click on the collection name
   - Go to "API Rules" tab
   - Add the rules as specified
   - Save the changes

## Creating Test Data

Before testing the booking flow, you need to create:

1. **A Tour** (if not already created)
2. **Time Slots** for the tour:
   - Go to PocketBase Admin → Collections → `time_slots` → New Record
   - Fill in:
     - `tour`: Select your tour
     - `startTime`: e.g., "2024-12-25 10:00:00"
     - `endTime`: e.g., "2024-12-25 12:00:00"
     - `availableSpots`: e.g., 10
     - `bookedSpots`: 0
     - `status`: "available"
     - `isRecurring`: false
3. **A QR Code** linked to the tour (if not already created)

## Testing Your Configuration

### Test Anonymous Access:
1. Open an incognito/private browser window
2. Visit `/book/[your-qr-code]`
3. You should see the tour details and booking form
4. You should see available time slots (if created)

### Test Authenticated Access:
1. Log in as a tour guide
2. Visit `/tours` to see your tours
3. Visit `/bookings` to see your bookings

## Common Issues

### "Invalid QR Code" Error
- Check that `qr_codes` collection has public View access
- Verify the QR code exists and `isActive = true`
- Check the QR code value matches exactly (case-sensitive)

### "Tour information not found" Error
- Check that `tours` collection has public View access
- Verify the tour is properly linked to the QR code

### "No Available Time Slots" Message
- Check that time slots exist for the tour
- Verify time slots have `status = "available"`
- Check that `availableSpots > 0`
- Ensure time slot dates are in the future

### Booking Creation Fails
- Check that `bookings` collection has public Create access
- Verify `time_slots` has public View access
- Check that the selected time slot exists in the database (not a demo slot)
- Ensure the time slot has available spots

### Payment Webhook Fails
- Check that `bookings` and `payments` collections have public Update access
- Verify webhook secret is correctly configured
- Check Stripe webhook logs for errors

## Security Considerations

- Only allow public access where necessary (View for display, Create for bookings)
- Keep Update/Delete operations restricted to authenticated users
- Consider using service accounts for webhook operations instead of public access
- Regularly review access logs for suspicious activity 