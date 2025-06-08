import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Use the update-status endpoint with the special action
    const response = await fetch(`/api/bookings/${bookingId}/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'confirm_payment'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      return json({
        success: true,
        message: 'Payment confirmed successfully',
        booking: result
      });
    } else {
      return json({
        success: false,
        error: result.error || 'Failed to confirm payment'
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    return json({
      success: false,
      error: 'Failed to confirm payment'
    }, { status: 500 });
  }
}; 