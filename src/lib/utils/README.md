# Utility Functions - Consolidated Structure

This document outlines the consolidated utility functions to eliminate duplication across the project.

## Core Utilities

### `/lib/utils/currency.ts`
- `formatEuro(amount)` - Primary currency formatting for the project (Euros)
- `parseCurrency(currency)` - Parse currency strings to numbers
- `formatCurrency(amount, options)` - Advanced currency formatting with options

### `/lib/utils/date-helpers.ts`
- `formatDate(dateString)` - Standard date formatting
- `formatDateMobile(dateString)` - Mobile-optimized date formatting
- `formatTime(dateString)` - Time formatting (12-hour format)
- `formatDateTime(dateString)` - Combined date and time formatting
- `getStatusColor(status)` - Generic status color mapping

### `/lib/utils/qr-generation.ts`
- `generateTourQRCode(tourName)` - Generate unique QR codes for tours
- `isValidTourQRCode(code)` - Validate QR code format
- `generateBookingURL(qrCode)` - Generate booking URLs
- `generateQRImageURL(qrCode, options)` - Generate QR code image URLs

### `/lib/utils/tour-helpers-client.ts` (NEW)
Client-safe tour utilities (no database imports):
- `formatDuration(minutes)` - Format duration in human-readable format
- `formatTourPrice(price)` - Format price with Euro currency
- `getTourStatusColor(status)` - Tour status badge colors
- `getTourStatusDot(status)` - Tour status indicator dots
- `getBookingStatusColor(status)` - Booking status badge colors
- `getSlotStatusColor(status)` - Time slot status badge colors
- `getTourImageUrl(tourId, imagePath, size)` - Generate tour image URLs
- `getImageUrl(tour, imagePath)` - Legacy compatibility function
- `calculateConversionRate(scans, conversions)` - Calculate QR code conversion rates
- `getCapacityUtilization(bookedSpots, totalCapacity)` - Calculate capacity utilization
- `isTourBookable(tour, hasAvailableSlots)` - Check if tour is bookable
- `toggleTourStatus(tour)` - Toggle tour status via API

### `/lib/utils/tour-helpers-server.ts` (NEW)
Server-only tour utilities (requires database):
- `loadTourWithOwnership(tourId, userId)` - Verify ownership and load tour
- `getMaxBookedSpots(tourId)` - Get max booked spots across time slots
- `getBookingConstraints(tourId, currentCapacity)` - Get booking constraints
- `validateCapacityChange(newCapacity, maxBookedSpots)` - Validate capacity changes
- `updateTimeSlotsCapacity(tourId, newCapacity)` - Update all time slots capacity
- `getUpcomingTimeSlots(tourId, limit)` - Get upcoming time slots
- `getTimeSlotStats(tourId)` - Get time slot statistics

### `/lib/utils/tour-helpers.ts` (REFACTORED)
Re-exports from both client and server files for backward compatibility.
**Important**: Import directly from `-client` or `-server` files instead to avoid bundling issues.

### `/lib/utils/booking-types.ts` (NEW)
Type definitions for stats and bookings:
- `SharedStats` - Base stats interface used across pages
- `DashboardStats` - Dashboard-specific stats interface
- `ToursStats` - Tours page-specific stats interface
- `ProcessedBooking` - Processed booking data interface

### `/lib/utils/stats-helpers.ts` (NEW)
Statistics calculation functions:
- `getSharedStats(userId)` - Common statistics across pages
- `getDashboardSpecificStats(userId, sharedStats)` - Dashboard-specific metrics
- `getToursSpecificStats(userId, sharedStats)` - Tours page-specific metrics

### `/lib/utils/booking-helpers.ts` (NEW)
Booking data fetching and processing:
- `getRecentBookings(userId, limit)` - Recent bookings for dashboard
- `getTourBookingData(userId, tourId)` - Tour-specific booking data
- `getTourAllBookings(userId, tourId)` - All bookings for a tour
- `getBookingDetails(userId, bookingId)` - Individual booking details
- `formatRecentBooking(booking)` - Format booking for dashboard display
- `createTodaysSchedule(bookings)` - Create today's schedule from bookings

### `/lib/utils/shared-stats.ts` (REFACTORED)
Now re-exports from the split modules for backward compatibility. The original 881-line file has been split into:
- `booking-types.ts` - Type definitions
- `stats-helpers.ts` - Stats calculation functions
- `booking-helpers.ts` - Booking data functions

## Migration Changes

### Recent Refactoring:
1. **shared-stats.ts split**: Split 881-line file into focused modules
   - `booking-types.ts` - Type definitions
   - `stats-helpers.ts` - Stats calculation functions
   - `booking-helpers.ts` - Booking data operations
   
2. **tour-helpers.ts split**: Separated client and server code to fix "Buffer is not defined" error
   - `tour-helpers-client.ts` - Browser-safe utilities (no database imports)
   - `tour-helpers-server.ts` - Server-only utilities (with database access)
   - Prevents server-side code from being bundled for browser

### Removed Duplications:
1. **Currency formatting conflict**: Removed USD `formatCurrency` from `date-helpers.ts` - project uses Euro formatting from `currency.ts`
2. **Tour utility functions**: Consolidated duplicate functions across tour routes into `tour-helpers.ts`
3. **Status color functions**: Unified status color mapping across components

### Updated Imports:
- All tour routes now import utilities from consolidated files
- Removed duplicate function definitions
- Consistent usage of `formatEuro` for currency formatting
- Unified status color handling across all tour-related components

## Usage Guidelines

1. **Currency**: Always use `formatEuro()` for displaying prices
2. **Dates**: Use functions from `date-helpers.ts` for consistent date formatting
3. **Tour Status**: Use `getTourStatusColor()` and `getTourStatusDot()` from `tour-helpers.ts`
4. **Booking Status**: Use `getBookingStatusColor()` from `tour-helpers.ts`
5. **Images**: Use `getTourImageUrl()` or `getImageUrl()` for tour images
6. **Duration**: Use `formatDuration()` for consistent time display
7. **Stats**: Use functions from `shared-stats.ts` for data calculations

## Benefits

- ✅ Eliminated code duplication across tour routes
- ✅ Consistent formatting and styling across the application
- ✅ Centralized utility functions for easier maintenance
- ✅ Better type safety with shared functions
- ✅ Improved performance by reducing redundant code
- ✅ Easier testing and debugging of utility functions 