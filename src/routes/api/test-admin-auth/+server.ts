import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createAuthenticatedPB, hasAdminCredentials } from '$lib/admin-auth.server.js';
import { generateTicketQRCode } from '$lib/ticket-qr.js';

export const POST: RequestHandler = async () => {
  try {
    // Check if admin credentials are configured
    if (!hasAdminCredentials()) {
      return json({ 
        success: false, 
        error: 'Admin credentials not configured',
        details: 'PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables are required'
      }, { status: 500 });
    }

    // Test admin authentication
    let pb;
    try {
      pb = await createAuthenticatedPB();
    } catch (authError) {
      return json({ 
        success: false, 
        error: 'Authentication failed',
        details: authError instanceof Error ? authError.message : String(authError) 
      }, { status: 500 });
    }

    // Test database access
    try {
      // Test reading collections
      const bookingsCount = await pb.collection('bookings').getList(1, 1);
      const paymentsCount = await pb.collection('payments').getList(1, 1);
      
      // Test generating ticket QR code
      const testTicketQR = generateTicketQRCode();
      
      // Test finding a recent booking to verify schema
      const recentBookings = await pb.collection('bookings').getList(1, 5, {
        sort: '-created'
      });
      
      const hasTicketFields = recentBookings.items.length > 0 && 
        'ticketQRCode' in recentBookings.items[0] &&
        'attendanceStatus' in recentBookings.items[0];
      
      return json({
        success: true,
        message: 'Admin authentication and database access successful',
        details: {
          authSuccess: true,
          databaseAccess: true,
          bookingsCount: bookingsCount.totalItems,
          paymentsCount: paymentsCount.totalItems,
          ticketQRGenerated: testTicketQR,
          schemaHasTicketFields: hasTicketFields,
          recentBookingFields: recentBookings.items.length > 0 ? Object.keys(recentBookings.items[0]) : []
        }
      });
    } catch (dbError) {
      return json({ 
        success: false, 
        error: 'Database access failed',
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      }, { status: 500 });
    }
  } catch (error) {
    return json({ 
      success: false, 
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}; 