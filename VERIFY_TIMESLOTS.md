# Verifying Time Slots Configuration

## Quick Checklist

1. **Check Time Slot Fields in PocketBase Admin**:
   - Go to `time_slots` collection
   - Verify each time slot has:
     - `tour`: Must be linked to your tour (not empty)
     - `status`: Must be exactly "available" (lowercase)
     - `availableSpots`: Must be greater than 0
     - `startTime` and `endTime`: Valid date/time values

2. **Check Tour Link**:
   - The `tour` field in time slots must match the tour ID in your QR code
   - You can see the tour ID in the QR code's `tour` field

3. **Common Issues**:
   - Status is not exactly "available" (check for typos, case sensitivity)
   - Tour field is empty or points to wrong tour
   - availableSpots is 0 or negative
   - Time slots are in the past

## How to Debug

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for console logs starting with:
     - "Looking for time slots for tour:"
     - "Found time slots (public):"
     - "All time slots in database:"

2. **Check Server Logs**:
   - Look for the tour ID being searched
   - See if any time slots are found
   - Check error messages

3. **Manual API Test**:
   ```
   https://z.xeon.pl/api/collections/time_slots/records
   ```
   This will show all time slots (if public access is enabled)

## Creating a Test Time Slot

In PocketBase Admin, create a time slot with:

```
tour: [Select your tour from dropdown]
startTime: 2024-12-30 10:00:00
endTime: 2024-12-30 12:00:00
availableSpots: 10
bookedSpots: 0
status: available
isRecurring: false
```

Make sure to save and then refresh your booking page. 