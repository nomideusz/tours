import { type RequestHandler } from '@sveltejs/kit';

/**
 * Simple SSE test endpoint to verify SSE functionality
 * Access at /api/notifications/sse-test
 */
export const GET: RequestHandler = async () => {
  console.log('🧪 SSE test endpoint accessed');
  
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let counter = 0;
      
      // Send initial message
      const initialMessage = `data: ${JSON.stringify({ type: 'connected', counter: counter++ })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));
      
      // Send a message every 5 seconds
      const interval = setInterval(() => {
        try {
          // Send SSE comment (for proxy keep-alive)
          const comment = `: keep-alive ${Date.now()}\n\n`;
          controller.enqueue(encoder.encode(comment));
          
          // Send actual data message
          const message = `data: ${JSON.stringify({ 
            type: 'test', 
            counter: counter++,
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(message));
          
          console.log(`🧪 SSE test message ${counter} sent`);
        } catch (error) {
          console.error('🧪 SSE test error:', error);
          clearInterval(interval);
        }
      }, 5000);
      
      // Cleanup function
      return () => {
        console.log('🧪 SSE test connection closed');
        clearInterval(interval);
      };
    },
    cancel() {
      console.log('🧪 SSE test connection cancelled');
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

