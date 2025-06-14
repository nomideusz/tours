import { type RequestHandler } from '@sveltejs/kit';
import { connections } from '$lib/notifications/server.js';

export const GET: RequestHandler = async ({ locals, url }) => {
  // Check authentication
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = locals.user.id;
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Function to send SSE message
      const sendMessage = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection message
      sendMessage({
        type: 'connected',
        timestamp: new Date().toISOString(),
        userId
      });

      // Store connection for this user
      const writer = controller;
      connections.set(userId, writer as any);

      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
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

 