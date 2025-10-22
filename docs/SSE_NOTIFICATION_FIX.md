# SSE Notification System Fix

## Problem

The SSE (Server-Sent Events) notification system was experiencing connection closures in production with the error:
```
❌ SSE connection error: readyState: 2 (CLOSED)
❌ EventSource closed unexpectedly
```

## Root Causes

1. **Missing nginx buffering prevention**: The SSE endpoint was missing the `X-Accel-Buffering: no` header, causing nginx to buffer the SSE stream and close idle connections
2. **Insufficient heartbeat frequency**: 30-second heartbeats weren't frequent enough to keep connections alive through proxy servers
3. **Missing SSE comment format**: Not using the standard SSE comment format (`: comment\n\n`) for keep-alive messages

## Solutions Implemented

### 1. Added Critical nginx Header

```typescript
headers: {
  'X-Accel-Buffering': 'no', // Critical: Prevent nginx from buffering SSE
  'Cache-Control': 'no-cache, no-transform',
  // ... other headers
}
```

This header tells nginx not to buffer the SSE stream, which is essential for real-time event delivery.

### 2. Increased Heartbeat Frequency

**Server-side** (`src/routes/api/notifications/sse/+server.ts`):
- Changed heartbeat interval from **30s → 15s**
- Added SSE comment format in addition to data messages
- Better error handling for closed controllers

```typescript
// Send both a comment (for proxy keep-alive) and a heartbeat message
const comment = `: heartbeat ${Date.now()}\n\n`;
controller.enqueue(encoder.encode(comment));

sendMessage({
  type: 'heartbeat',
  timestamp: new Date().toISOString()
});
```

**Client-side** (`src/lib/hooks/useNotifications.ts`):
- Updated heartbeat timeout from **60s → 45s** (3x server heartbeat)
- Updated health check interval from **30s → 20s** for faster detection
- Reduced console logging noise

### 3. Improved Error Handling

- Added `isControllerClosed` flag to prevent operations on closed streams
- Better cleanup of intervals and connections
- Graceful fallback to polling when SSE fails
- Reduced logging noise (only log first failure)

### 4. Added Test Endpoint

Created `/api/notifications/sse-test` endpoint for easy verification of SSE functionality without authentication.

## Testing

### 1. Test SSE Functionality

Open browser console and navigate to:
```
https://zaur.app/api/notifications/sse-test
```

You should see messages every 5 seconds with no connection closures.

### 2. Test Authenticated Notifications

1. Log in to the dashboard
2. Open browser console
3. Look for logs showing SSE connection establishment:
   ```
   ✅ Instance X: SSE connection established
   💓 Heartbeat received
   ```

### 3. Monitor Connection Stability

The connection should remain open indefinitely with heartbeats every 15 seconds. If the connection closes, the system will:
1. Automatically start polling as fallback
2. Attempt to reconnect with exponential backoff (up to 5 attempts)
3. Continue showing notifications via polling

## Architecture

The notification system uses a **hybrid approach**:

1. **Primary**: SSE (Server-Sent Events) for real-time push notifications
2. **Fallback**: HTTP polling every 60 seconds if SSE fails
3. **Persistence**: All notifications stored in database

This ensures notifications are delivered even if SSE connections fail.

## CapRover Configuration

The `captain-definition` file already includes appropriate proxy timeout settings:

```json
{
  "nginxConfig": {
    "proxy_read_timeout": "300s",
    "proxy_connect_timeout": "300s",
    "proxy_send_timeout": "300s"
  }
}
```

These timeouts (5 minutes) are sufficient for SSE connections with 15-second heartbeats.

## Expected Behavior

### Normal Operation
- SSE connection establishes immediately on login
- Heartbeats every 15 seconds (mostly silent in console)
- New notifications appear instantly
- Polling is disabled when SSE is working

### Degraded Operation (SSE fails)
- Warning logged once about connection closure
- Polling starts automatically as fallback
- Notifications still delivered (with 60s delay)
- Automatic reconnection attempts with backoff

## Monitoring

Watch for these console messages:

✅ **Good signs:**
```
✅ SSE connection established
💓 Heartbeat received (every 15s)
```

⚠️ **Warning signs (handled automatically):**
```
⚠️ SSE connection error (readyState: 2)
⚠️ SSE connection closed, starting fallback polling...
🔄 Attempting SSE reconnection 1/5 in 2000ms...
```

❌ **Error signs (manual intervention needed):**
```
⚠️ Max SSE reconnection attempts reached
❌ Failed to load initial notifications
```

## Notification Sound Improvements

In addition to fixing SSE connection issues, the notification sound system was improved:

### Previous Issues
- Sound was disabled by default (users had to manually enable it)
- No handling of browser autoplay policies (AudioContext suspended state)
- No way to test if sound was working
- No logging to diagnose sound issues

### Improvements Made

1. **Enabled by default**: Sound now plays for new bookings by default (can be disabled in preferences)
2. **Browser autoplay handling**: AudioContext now properly resumes when suspended
3. **Test button**: Added "Test Sound" button in preferences when sound is enabled
4. **Better logging**: Added console logs to track sound playback and diagnose issues
5. **Improved reliability**: Better error handling and AudioContext cleanup

### How to Use

Users can control notification sounds in **Profile → Preferences**:
- Toggle the switch to enable/disable sounds
- Click "Test Sound" button to verify it's working
- Sound plays a gentle two-tone chime (C5 → E5) when new bookings arrive

### Browser Compatibility

The sound uses the Web Audio API which is supported in:
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (desktop and iOS)
- ✅ Opera (all versions)

**Note**: Some browsers require user interaction before allowing audio. The first sound after page load may require clicking something on the page first.

## Files Modified

1. `src/routes/api/notifications/sse/+server.ts` - SSE endpoint improvements
2. `src/lib/hooks/useNotifications.ts` - Client-side handling improvements, sound reliability
3. `src/routes/api/notifications/sse-test/+server.ts` - New test endpoint
4. `src/lib/stores/preferences.ts` - Enabled sound by default
5. `src/lib/components/profile/PreferencesSection.svelte` - Added test sound button

## Further Improvements (if issues persist)

If SSE connections still fail in production:

1. **Check CapRover nginx logs** for connection closure reasons
2. **Increase heartbeat frequency** to 10s if 15s isn't enough
3. **Consider WebSocket alternative** (more complex but more reliable)
4. **Add server-side connection monitoring** to detect and log closure causes

## Related Documentation

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [nginx SSE configuration](https://www.nginx.com/blog/event-driven-data-management-nginx/)
- Memory ID: 939323 (Notification system refactoring)

