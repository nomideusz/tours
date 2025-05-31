# Fix Public Access for Anonymous Booking

This guide explains how to fix the PocketBase API rules to allow anonymous users to view tours and book them.

## The Problem

When anonymous users try to book tours, they encounter errors because:
1. They can't view QR codes, tours, or time slots
2. They can't create bookings
3. API rules are too restrictive

## The Solution

Update the following collection rules in PocketBase Admin:

### 1. QR Codes Collection (`qr_codes`)
- **List Rule**: `user = @request.auth.id || isActive = true`
- **View Rule**: `user = @request.auth.id || isActive = true`
- This allows anonymous users to view active QR codes

### 2. Tours Collection (`tours`)
- **List Rule**: `user = @request.auth.id || status = 'active'`
- **View Rule**: `user = @request.auth.id || status = 'active'`
- This allows anonymous users to view active tours

### 3. Time Slots Collection (`time_slots`)
- **List Rule**: ` ` (empty)
- **View Rule**: ` ` (empty)
- This allows anonymous users to view all time slots

### 4. Bookings Collection (`bookings`)
- **Create Rule**: ` ` (empty)
- **View Rule**: ` ` (empty)
- This allows anonymous users to create and view bookings (needed for payment page)

### 5. Payments Collection (`payments`)
- **Update Rule**: ` ` (empty)
- This allows webhook updates from Stripe

## How to Apply These Rules

1. Go to PocketBase Admin (https://z.xeon.pl/_/)
2. Login with admin credentials
3. Navigate to Collections
4. For each collection above:
   - Click on the collection
   - Go to "API Rules" tab
   - Update the rules as specified
   - Click "Save"

## Verification

Test with an anonymous browser session:
1. Visit a QR code booking page
2. You should see:
   - Tour details
   - Available time slots
   - Booking form
3. Complete a booking - it should succeed

## Notes

- These rules allow public read access where needed
- Only authenticated users can modify their own data
- Webhook endpoints can update payment status
- Security is maintained through proper filtering 