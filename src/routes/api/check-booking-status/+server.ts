import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Use the existing status endpoint
    const response = await fetch(`/api/bookings/${bookingId}/status`);
    const result = await response.json();
    
    if (response.ok) {
      return json({
        success: true,
        booking: result
      });
    } else {
      return json({
        success: false,
        error: result.error || 'Failed to get booking status'
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Error checking booking status:', error);
    return json({
      success: false,
      error: 'Failed to check booking status'
    }, { status: 500 });
  }
}; 