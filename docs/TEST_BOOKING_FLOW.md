# Testing Anonymous Booking Flow

## Test Steps

1. **Visit a QR code booking page as anonymous user**
   - Open an incognito/private browser window
   - Visit: `http://localhost:5173/book/[your-qr-code]`
   - You should see time slots available

2. **Complete a booking**
   - Select a date with available slots
   - Select a time slot
   - Choose number of participants
   - Fill in customer details:
     - Name: Test Customer
     - Email: test@example.com
     - Phone: (optional)
   - Click "Continue to Payment"

3. **Expected Results**
   - Booking should be created successfully
   - You should be redirected to payment page
   - No 404 errors on time slot fetching

## What Was Fixed

Previously, the booking failed with:
```
ClientResponseError 404: The requested resource wasn't found
```

This happened because:
- Anonymous users could list time slots but not fetch individual ones by ID
- The booking action was trying to fetch the time slot to verify availability

The fix:
- Pass time slot data (availableSpots, bookedSpots) through hidden form fields
- Use form data instead of fetching from database
- Wrap time slot updates in try-catch for graceful handling

## Verification in PocketBase

1. Check bookings collection for new booking with status "pending"
2. Time slot's bookedSpots should increase (if user has write permissions)
3. QR code conversions should increase (if user has write permissions)

## Note

Time slot updates and QR conversion tracking may fail for anonymous users due to write permissions, but the booking itself will still be created successfully. 