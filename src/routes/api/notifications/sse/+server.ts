import { type RequestHandler } from '@sveltejs/kit';
import { connections } from '$lib/notifications/server.js';

export const GET: RequestHandler = async ({ locals, url }) => {
  // Check authentication
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = locals.user.id;
  console.log(`🔍 SSE connection established for user: "${userId}" (type: ${typeof userId})`);
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      let isControllerClosed = false;
      
      // Function to send SSE message
      const sendMessage = (data: any) => {
        if (isControllerClosed) {
          console.log(`SSE controller already closed for user ${userId}, skipping message`);
          connections.delete(userId);
          return;
        }
        
        try {
          console.log(`📤 Sending SSE message to user ${userId}:`, data.type, data);
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
          console.log(`✅ SSE message enqueued successfully for user ${userId}`);
        } catch (error) {
          if (error instanceof Error && (error as any).code === 'ERR_INVALID_STATE') {
            console.log(`SSE controller closed for user ${userId}, marking as closed`);
            isControllerClosed = true;
          } else {
            console.error(`Failed to send SSE message to user ${userId}:`, error);
          }
          connections.delete(userId);
        }
      };

      // Store connection for this user (store the sendMessage function)
      connections.set(userId, sendMessage as any);
      console.log(`🔍 SSE connection stored for user: "${userId}"`);
      console.log(`🔍 Total active connections:`, connections.size);

      // Send initial connection message
      sendMessage({
        type: 'connected',
        timestamp: new Date().toISOString(),
        userId
      });

      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        // Check if connection still exists before sending heartbeat
        if (!connections.has(userId)) {
          console.log(`SSE connection no longer exists for user ${userId}, clearing heartbeat`);
          clearInterval(heartbeat);
          return;
        }
        
        try {
          sendMessage({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.log(`SSE heartbeat failed for user ${userId}:`, error);
          clearInterval(heartbeat);
          connections.delete(userId);
        }
      }, 30000); // Every 30 seconds

      // Clean up on close
      const cleanup = () => {
        isControllerClosed = true;
        clearInterval(heartbeat);
        connections.delete(userId);
        console.log(`SSE connection closed for user ${userId}`);
      };

      // Handle client disconnect
      return cleanup;
    },

    cancel() {
      connections.delete(userId);
      console.log(`SSE connection cancelled for user ${userId}`);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
};

 