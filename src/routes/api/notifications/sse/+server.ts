import { type RequestHandler } from '@sveltejs/kit';
import { connections } from '$lib/notifications/server.js';
import { recordSSEConnection, recordSSEDisconnection, recordSSEError, recordSSEHeartbeat } from '$lib/notifications/sse-monitor.js';

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie',
      'Access-Control-Max-Age': '86400'
    }
  });
};

export const GET: RequestHandler = async ({ locals, url }) => {
  // Check authentication
  if (!locals.user) {
    console.warn('⚠️ SSE connection rejected: No authenticated user');
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = locals.user.id;
  const userEmail = locals.user.email;
  console.log(`🔍 SSE connection established for user: "${userId}" (${userEmail})`);
  
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
          recordSSEError(userId, error as Error);
          if (error instanceof Error && (error as any).code === 'ERR_INVALID_STATE') {
            console.log(`SSE controller closed for user ${userId}, marking as closed`);
            isControllerClosed = true;
            // Clean up heartbeat immediately
            if (heartbeat) {
              clearInterval(heartbeat);
              heartbeat = null;
            }
          } else {
            console.error(`Failed to send SSE message to user ${userId}:`, error);
          }
          connections.delete(userId);
        }
      };

      // Store connection for this user (store the sendMessage function)
      connections.set(userId, sendMessage);
      recordSSEConnection(userId);
      console.log(`🔍 SSE connection stored for user: "${userId}"`);
      console.log(`🔍 Total active connections:`, connections.size);

      // Send initial connection message
      sendMessage({
        type: 'connected',
        timestamp: new Date().toISOString(),
        userId
      });

      // Set up heartbeat to keep connection alive through proxies
      // Use more frequent heartbeats (15s) to prevent proxy timeouts
      let heartbeat: NodeJS.Timeout | null = null;
      
      const startHeartbeat = () => {
        if (heartbeat) return; // Already running
        
        heartbeat = setInterval(() => {
          // Check if connection still exists before sending heartbeat
          if (!connections.has(userId)) {
            console.log(`SSE connection no longer exists for user ${userId}, clearing heartbeat`);
            if (heartbeat) {
              clearInterval(heartbeat);
              heartbeat = null;
            }
            return;
          }
          
          if (isControllerClosed) {
            console.log(`SSE controller closed for user ${userId}, clearing heartbeat`);
            if (heartbeat) {
              clearInterval(heartbeat);
              heartbeat = null;
            }
            connections.delete(userId);
            return;
          }
          
        try {
          // Send both a comment (for proxy keep-alive) and a heartbeat message
          const comment = `: heartbeat ${Date.now()}\n\n`;
          controller.enqueue(encoder.encode(comment));
          
          sendMessage({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
          
          recordSSEHeartbeat(userId);
        } catch (error) {
          console.log(`SSE heartbeat failed for user ${userId}:`, error);
          recordSSEError(userId, error as Error);
          if (heartbeat) {
            clearInterval(heartbeat);
            heartbeat = null;
          }
          connections.delete(userId);
          isControllerClosed = true;
        }
        }, 15000); // Every 15 seconds for better proxy compatibility
      };
      
      startHeartbeat();

      // Clean up on close
      const cleanup = () => {
        isControllerClosed = true;
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        connections.delete(userId);
        recordSSEDisconnection(userId, 'cleanup');
        console.log(`SSE connection closed for user ${userId}`);
      };

      // Handle client disconnect
      return cleanup;
    },

    cancel() {
      connections.delete(userId);
      recordSSEDisconnection(userId, 'cancel');
      console.log(`SSE connection cancelled for user ${userId}`);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Critical: Prevent nginx from buffering SSE
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
};

 