import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { notificationActions, notifications, type Notification } from '$lib/stores/notifications.js';
import { useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from '$lib/queries/shared-stats.js';
import { get } from 'svelte/store';
import { notificationSoundEnabled } from '$lib/stores/preferences.js';

export function useNotifications() {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let healthCheckInterval: NodeJS.Timeout | null = null;
  let pollingInterval: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;
  let lastHeartbeat = Date.now();
  let isConnecting = false;
  
  const maxReconnectAttempts = 5; // Reduced from 10 to prevent spam
  const heartbeatTimeout = 60000; // 60 seconds
  const healthCheckInterval_ms = 15000; // 15 seconds
  const pollingInterval_ms = 30000; // 30 seconds fallback polling
  const queryClient = useQueryClient();

  function cleanup() {
    console.log('🧹 Cleaning up existing connections and intervals...');
    
    if (eventSource) {
      console.log('🧹 Closing existing SSE connection...');
      eventSource.close();
      eventSource = null;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    
    isConnecting = false;
  }

  function connect() {
    if (!browser || isConnecting) return;
    
    isConnecting = true;
    console.log('🔄 Creating new SSE connection...');
    
    cleanup();
    
    try {
      console.log('🔗 Establishing SSE connection for notifications...');
      
      // Use relative URL for current environment (works in both dev and production)
      const sseUrl = '/api/notifications/sse';
      eventSource = new EventSource(sseUrl, {
        withCredentials: true
      });
      
      console.log('📡 EventSource created:', {
        url: eventSource.url,
        readyState: eventSource.readyState,
        withCredentials: true
      });

      eventSource.onopen = () => {
        console.log('✅ SSE connection established');
        console.log('🔗 EventSource readyState:', eventSource?.readyState);
        console.log('🔗 EventSource URL:', eventSource?.url);
        
        reconnectAttempts = 0;
        lastHeartbeat = Date.now();
        isConnecting = false;
        
        notificationActions.setConnected(true);
        notificationActions.setError(null);
        
        // Start health check
        startHealthCheck();
        
        // Stop polling since SSE is working
        stopPolling();
      };

      eventSource.onmessage = (event) => {
        console.log('📨 Raw SSE event received:', event);
        console.log('📨 Event data:', event.data);
        
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Parsed SSE data:', data);
          
          if (data.type === 'heartbeat') {
            console.log('💓 Heartbeat received');
            lastHeartbeat = Date.now();
            return;
          }
          
          if (data.type === 'connected') {
            console.log('🔗 Connection confirmation received');
            lastHeartbeat = Date.now();
            return;
          }
          
          // Handle actual notifications
          console.log('🔔 Processing notification:', data.type);
          handleNewBookingNotification(data);
          
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
          console.error('❌ Raw event data:', event.data);
        }
      };

      eventSource.onerror = (error) => {
        // Reduce noise in development - only log first few failures
        if (reconnectAttempts < 3) {
          console.log('❌ SSE connection error:', error);
          console.log('❌ SSE readyState:', eventSource?.readyState);
          console.log('❌ SSE url:', eventSource?.url);
        }
        
        isConnecting = false;
        notificationActions.setConnected(false);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (reconnectAttempts < 3) {
            console.log('❌ EventSource closed unexpectedly');
          }
          
          // Start polling as fallback
          startPolling();
          
          // Attempt to reconnect with backoff
          attemptReconnect();
        }
      };

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      isConnecting = false;
      notificationActions.setConnected(false);
      notificationActions.setError('Failed to establish connection');
      
      // Start polling as fallback
      startPolling();
    }
  }

  function startHealthCheck() {
    if (healthCheckInterval) return;
    
    console.log('🏥 Starting health check interval...');
    healthCheckInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
      console.log('🔍 Health check - readyState:', eventSource?.readyState, 'timeSinceLastHeartbeat:', timeSinceLastHeartbeat);
      
      if (timeSinceLastHeartbeat > heartbeatTimeout) {
        console.log('⚠️ No heartbeat for 60 seconds, forcing reconnect...');
        
        // Start polling as fallback
        startPolling();
        
        // Force reconnect
        connect();
      }
    }, healthCheckInterval_ms);
  }

  function startPolling() {
    if (pollingInterval) return;
    
    console.log('🔄 Starting notification polling as fallback...');
    
    // Poll immediately
    pollNotifications();
    
    // Then poll every 30 seconds
    pollingInterval = setInterval(() => {
      pollNotifications();
    }, pollingInterval_ms);
  }

  function stopPolling() {
    if (pollingInterval) {
      console.log('⏹️ Stopping notification polling (SSE working)');
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  async function pollNotifications() {
    try {
      console.log('📡 Polling for notifications...');
      
      const response = await fetch('/api/notifications/poll', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📡 Polling response:', data);
      
      if (data.success && data.notifications?.length > 0) {
        console.log(`📬 Found ${data.notifications.length} notifications via polling`);
        
        // Process each notification, preserving read status from database
        // For polling, add in reverse order since add() prepends to array
        data.notifications.reverse().forEach((notification: any) => {
          console.log('📬 Adding notification from polling:', notification.id, 'read:', notification.read);
          
          // Add to store preserving read status (don't trigger browser notifications for existing ones)
          notificationActions.add(notification);
        });
      }
      
    } catch (error) {
      console.error('❌ Notification polling failed:', error);
    }
  }

  async function loadInitialNotifications() {
    try {
      console.log('📚 Loading initial notifications from database...');
      
      const response = await fetch('/api/notifications/poll', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Initial load failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📚 Initial notifications response:', data);
      
      if (data.success && data.notifications?.length > 0) {
        console.log(`📚 Loading ${data.notifications.length} notifications with read status`);
        
        // Clear existing notifications first to avoid mixing localStorage with database
        notificationActions.clear();
        
        // Add notifications in reverse order since add() prepends to array
        // API returns newest first, but we need to add oldest first to maintain correct order
        data.notifications.reverse().forEach((notification: any) => {
          console.log('📚 Loading notification:', notification.id, 'read:', notification.read);
          notificationActions.add(notification);
        });
        
        console.log('✅ Initial notifications loaded successfully');
      }
      
    } catch (error) {
      console.error('❌ Failed to load initial notifications:', error);
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn('⚠️ Max SSE reconnection attempts reached');
      notificationActions.setError('Connection lost. Using polling fallback.');
      return;
    }

    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    console.log(`🔄 Attempting SSE reconnection ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms...`);
    
    reconnectTimeout = setTimeout(() => {
      connect();
    }, delay);
  }

  function handleNewBookingNotification(data: any) {
    console.log('🎉 New booking notification received:', data);
    
    // Validate notification data
    if (!data.id || !data.title || !data.message || !data.timestamp) {
      console.error('❌ Invalid notification data structure:', data);
      return;
    }
    
    // Add notification to store
    console.log('📝 Adding new booking notification to store...');
    try {
      notificationActions.add(data);
      console.log('✅ Notification added to store successfully');
    } catch (error) {
      console.error('❌ Error adding notification to store:', error);
      return;
    }
    
    // Play optional notification sound based on user preference
    if (get(notificationSoundEnabled)) {
      playNotificationSound();
    }
    
    // Invalidate relevant queries to refresh data
    try {
      queryClient.invalidateQueries({ queryKey: queryKeys.recentBookings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
      
      // If on dashboard, also refresh tour-specific data
      if (data.data?.tourId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(data.data.tourId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(data.data.tourId) });
      }
      console.log('✅ Query invalidation completed');
    } catch (error) {
      console.error('❌ Error invalidating queries:', error);
    }
  }

  // Optional notification sound (only plays if user has enabled it)
  function playNotificationSound() {
    if (!browser) return;
    
    try {
      // Create a simple, pleasant notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant two-tone chime
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Lower volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  function disconnect() {
    console.log('🔌 Disconnecting notifications...');
    cleanup();
    notificationActions.setConnected(false);
  }

  // Initialize
  if (browser) {
    // Just connect to the internal notification system
    
    // Load initial notifications from database first
    loadInitialNotifications().then(() => {
      console.log('📚 Initial notifications loaded, starting SSE connection...');
      connect();
      
      // Start with polling as immediate fallback
      setTimeout(() => {
        if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
          console.log('🔄 SSE not ready, starting polling fallback...');
          startPolling();
        }
      }, 5000); // Give SSE 5 seconds to connect
    }).catch((error) => {
      console.error('❌ Failed to load initial notifications, continuing with SSE:', error);
      connect();
      
      // Start with polling as immediate fallback
      setTimeout(() => {
        if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
          console.log('🔄 SSE not ready, starting polling fallback...');
          startPolling();
        }
      }, 5000); // Give SSE 5 seconds to connect
    });
  }

  onMount(() => {
    // Reconnect when tab becomes visible (user returns)
    const handleVisibilityChange = () => {
      if (!document.hidden && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
        console.log('👁️ Tab became visible, reconnecting SSE...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });

  onDestroy(() => {
    disconnect();
  });

  return {
    connect,
    disconnect,
    cleanup
  };
} 