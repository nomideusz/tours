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

### `/lib/utils/tour-helpers.ts` (NEW)
Consolidates tour-specific functionality:
- `formatDuration(minutes)` - Format duration in human-readable format
- `getTourStatusColor(status)` - Tour status badge colors
- `getTourStatusDot(status)` - Tour status indicator dots
- `getBookingStatusColor(status)` - Booking status badge colors
- `getSlotStatusColor(status)` - Time slot status badge colors
- `getTourImageUrl(tourId, imagePath, size)` - Generate tour image URLs
- `getImageUrl(tour, imagePath)` - Legacy compatibility function
- `calculateConversionRate(scans, conversions)` - Calculate QR code conversion rates
- `getCapacityUtilization(bookedSpots, totalCapacity)` - Calculate capacity utilization
- `isTourBookable(tour, hasAvailableSlots)` - Check if tour is bookable

### `/lib/utils/shared-stats.ts`
- `getSharedStats(userId)` - Common statistics across pages
- `getDashboardSpecificStats(userId, sharedStats)` - Dashboard-specific metrics
- `getToursSpecificStats(userId, sharedStats)` - Tours page-specific metrics
- `getRecentBookings(userId, limit)` - Recent bookings for dashboard
- `getTourBookingData(userId, tourId)` - Tour-specific booking data
- `getTourAllBookings(userId, tourId)` - All bookings for a tour
- `getBookingDetails(userId, bookingId)` - Individual booking details

## Migration Changes

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