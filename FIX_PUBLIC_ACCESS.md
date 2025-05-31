# Fix Public Access for Anonymous Bookings

## Quick Fix Steps

1. **Go to PocketBase Admin Panel**
   - Navigate to: https://z.xeon.pl/_/

2. **Configure time_slots Collection**
   - Click on **Collections** in the sidebar
   - Find and click on **time_slots**
   - Go to the **API Rules** tab
   - Click **Add rule** for the **View** action
   - In the filter field, enter: `true` (or leave it empty)
   - Click **Save**

3. **Verify Other Collections** (should already be configured):
   - **qr_codes** → View rule: `true`
   - **tours** → View rule: `true`
   - **bookings** → Create rule: `true`

## Testing

After saving:
1. Open an incognito/private browser window (not logged in)
2. Visit your booking URL: `/book/[your-qr-code]`
3. You should now see the available time slots

## Why This is Needed

Without public View access on `time_slots`, the PocketBase API returns an empty array when anonymous users try to fetch time slots, even though the records exist in the database. This prevents customers from seeing available booking times unless they're logged in.

## Security Note

This configuration is safe because:
- Anonymous users can only VIEW time slots (read-only)
- They cannot modify or delete time slots
- The Create rule on bookings allows them to make reservations
- All other operations remain protected 