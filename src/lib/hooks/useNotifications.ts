import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { notificationActions, notifications, type Notification } from '$lib/stores/notifications.js';
import { useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from '$lib/queries/shared-stats.js';
import { get } from 'svelte/store';
import { notificationSoundEnabled } from '$lib/stores/preferences.js';

// Global tracking to prevent multiple instances
let globalEventSource: EventSource | null = null;
let globalReconnectTimeout: NodeJS.Timeout | null = null;
let globalHealthCheckInterval: NodeJS.Timeout | null = null;
let globalPollingInterval: NodeJS.Timeout | null = null;
let globalInstanceCount = 0;

export function useNotifications() {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let healthCheckInterval: NodeJS.Timeout | null = null;
  let pollingInterval: NodeJS.Timeout | null = null;
  let pollingFallbackTimeout: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;
  let lastHeartbeat = Date.now();
  let isConnecting = false;
  let hasLoadedInitial = false;
  let processedNotificationIds = new Set<string>();
  let instanceCleanedUp = false;
  
  const maxReconnectAttempts = 5; // Reduced from 10 to prevent spam
  const heartbeatTimeout = 60000; // 60 seconds
  const healthCheckInterval_ms = 30000; // 30 seconds - reduced frequency
  const pollingInterval_ms = 60000; // 60 seconds fallback polling - reduced frequency
  const queryClient = useQueryClient();

  // Track this instance
  globalInstanceCount++;
  const instanceId = globalInstanceCount;
  console.log(`🆕 NotificationHook instance ${instanceId} created. Total instances: ${globalInstanceCount}`);

  function cleanup() {
    if (instanceCleanedUp) {
      console.log(`🧹 Instance ${instanceId} already cleaned up, skipping...`);
      return;
    }
    
    console.log(`🧹 Instance ${instanceId}: Cleaning up connections and intervals...`);
    
    // Clear global references BEFORE clearing local ones
    if (globalEventSource === eventSource) {
      console.log(`🧹 Instance ${instanceId}: Clearing global SSE connection...`);
      globalEventSource = null;
    }
    if (globalReconnectTimeout === reconnectTimeout) {
      globalReconnectTimeout = null;
    }
    if (globalHealthCheckInterval === healthCheckInterval) {
      globalHealthCheckInterval = null;
    }
    if (globalPollingInterval === pollingInterval) {
      globalPollingInterval = null;
    }
    
    // Clear local references
    if (eventSource) {
      console.log(`🧹 Instance ${instanceId}: Closing local SSE connection...`);
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
    
    if (pollingFallbackTimeout) {
      clearTimeout(pollingFallbackTimeout);
      pollingFallbackTimeout = null;
    }
    
    isConnecting = false;
    instanceCleanedUp = true;
    
    // Decrement global instance count
    globalInstanceCount = Math.max(0, globalInstanceCount - 1);
    console.log(`🧹 Instance ${instanceId} cleaned up. Remaining instances: ${globalInstanceCount}`);
  }

  // Clean up any existing global connections before creating new ones
  function cleanupGlobalConnections() {
    console.log('🌍 Cleaning up global connections...');
    
    if (globalEventSource) {
      console.log('🌍 Closing global SSE connection...');
      globalEventSource.close();
      globalEventSource = null;
    }
    
    if (globalReconnectTimeout) {
      clearTimeout(globalReconnectTimeout);
      globalReconnectTimeout = null;
    }
    
    if (globalHealthCheckInterval) {
      clearInterval(globalHealthCheckInterval);
      globalHealthCheckInterval = null;
    }
    
    if (globalPollingInterval) {
      clearInterval(globalPollingInterval);
      globalPollingInterval = null;
    }
  }

  function connect() {
    if (!browser || isConnecting) return;
    
    // Prevent multiple connections - clean up any existing global connections first
    cleanupGlobalConnections();
    
    isConnecting = true;
    console.log(`🔄 Instance ${instanceId}: Creating new SSE connection...`);
    
    // Don't call cleanup() here - it will immediately close the connection we're about to create!
    
    try {
      console.log('🔗 Establishing SSE connection for notifications...');
      
      // Use relative URL for current environment (works in both dev and production)
      const sseUrl = '/api/notifications/sse';
      eventSource = new EventSource(sseUrl, {
        withCredentials: true
      });
      
      // Store globally to track across instances
      globalEventSource = eventSource;
      
      console.log('📡 EventSource created:', {
        url: eventSource.url,
        readyState: eventSource.readyState,
        withCredentials: true
      });

      eventSource.onopen = () => {
        console.log(`✅ Instance ${instanceId}: SSE connection established`);
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
          
          // Check if we've already processed this notification
          if (data.id && processedNotificationIds.has(data.id)) {
            console.log('🔄 Skipping duplicate notification:', data.id);
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
          console.log(`❌ Instance ${instanceId}: SSE connection error:`, error);
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
      console.error(`❌ Instance ${instanceId}: Failed to create SSE connection:`, error);
      isConnecting = false;
      notificationActions.setConnected(false);
      notificationActions.setError('Failed to establish connection');
      
      // Start polling as fallback
      startPolling();
    }
  }

  function startHealthCheck() {
    if (healthCheckInterval) return;
    
    console.log(`🏥 Instance ${instanceId}: Starting health check interval...`);
    healthCheckInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
      console.log('🔍 Health check - readyState:', eventSource?.readyState, 'timeSinceLastHeartbeat:', timeSinceLastHeartbeat);
      
      if (timeSinceLastHeartbeat > heartbeatTimeout) {
        console.log('⚠️ No heartbeat for 60 seconds, forcing reconnect...');
        
        // Start polling as fallback
        startPolling();
        
        // Close current connection and attempt reconnect
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        attemptReconnect();
      }
    }, healthCheckInterval_ms);
    
    // Store globally
    globalHealthCheckInterval = healthCheckInterval;
  }

  function startPolling() {
    if (pollingInterval || instanceCleanedUp) return;
    
    console.log(`🔄 Instance ${instanceId}: Starting notification polling as fallback...`);
    
    // Poll immediately
    pollNotifications();
    
    // Then poll every 30 seconds
    pollingInterval = setInterval(() => {
      pollNotifications();
    }, pollingInterval_ms);
    
    // Store globally
    globalPollingInterval = pollingInterval;
  }

  function stopPolling() {
    if (pollingInterval) {
      console.log(`⏹️ Instance ${instanceId}: Stopping notification polling (SSE working)`);
      
      // Clear global reference if it matches BEFORE clearing local
      if (globalPollingInterval === pollingInterval) {
        globalPollingInterval = null;
      }
      
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  async function pollNotifications() {
    // Don't poll if instance is cleaned up
    if (instanceCleanedUp) return;
    
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
          // Skip if we've already processed this notification
          if (processedNotificationIds.has(notification.id)) {
            console.log('🔄 Skipping duplicate notification from polling:', notification.id);
            return;
          }
          
          console.log('📬 Adding notification from polling:', notification.id, 'read:', notification.read);
          
          // Mark as processed
          processedNotificationIds.add(notification.id);
          
          // Add to store preserving read status (don't trigger browser notifications for existing ones)
          notificationActions.add(notification);
        });
      }
      
    } catch (error) {
      console.error('❌ Notification polling failed:', error);
    }
  }

  async function loadInitialNotifications() {
    if (hasLoadedInitial) {
      console.log('📚 Initial notifications already loaded, skipping...');
      return;
    }
    
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
        
        // Don't clear existing notifications - just add new ones
        // This prevents losing notifications that might have come via SSE
        
        // Add notifications in reverse order since add() prepends to array
        // API returns newest first, but we need to add oldest first to maintain correct order
        data.notifications.reverse().forEach((notification: any) => {
          console.log('📚 Loading notification:', notification.id, 'read:', notification.read);
          
          // Mark as processed to prevent duplicates
          processedNotificationIds.add(notification.id);
          
          notificationActions.add(notification);
        });
        
        console.log('✅ Initial notifications loaded successfully');
      }
      
      hasLoadedInitial = true;
      
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
    
    // Store globally
    globalReconnectTimeout = reconnectTimeout;
  }

  function handleNewBookingNotification(data: any) {
    console.log('🎉 New booking notification received:', data);
    
    // Validate notification data
    if (!data.id || !data.title || !data.message || !data.timestamp) {
      console.error('❌ Invalid notification data structure:', data);
      return;
    }
    
    // Check if already processed
    if (processedNotificationIds.has(data.id)) {
      console.log('🔄 Notification already processed:', data.id);
      return;
    }
    
    // Mark as processed
    processedNotificationIds.add(data.id);
    
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
      queryClient.invalidateQueries({ queryKey: queryKeys.recentBookings(10) });
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
    console.log(`🔌 Instance ${instanceId}: Disconnecting notifications...`);
    
    // Force cleanup global connections first
    cleanupGlobalConnections();
    
    // Then cleanup this instance
    cleanup();
    
    // Set connection state to false
    notificationActions.setConnected(false);
  }

  // Define handleForceCleanup at the hook level
  const handleForceCleanup = () => {
    console.log(`🚨 Instance ${instanceId}: Force cleanup requested`);
    disconnect();
  };
  
  const handleBeforeUnload = () => {
    console.log(`🚨 Instance ${instanceId}: Page unloading, cleaning up...`);
    
    // Force cleanup all global connections immediately
    cleanupGlobalConnections();
    
    // Then cleanup this instance
    disconnect();
    
    // Force clear all global state
    globalInstanceCount = 0;
  };

  // Initialize
  if (browser) {
    // Listen for force cleanup events
    window.addEventListener('force-cleanup', handleForceCleanup);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Just connect to the internal notification system
    
    // Always load initial notifications from database on page load
    // This ensures persisted notifications are shown after refresh
    loadInitialNotifications().then(() => {
      console.log('📚 Initial notifications loaded, starting SSE connection...');
    }).catch((error) => {
      console.error('❌ Failed to load initial notifications:', error);
    });
    
    // Try to connect SSE immediately
    connect();
    
    // Start with polling as fallback after a delay
    pollingFallbackTimeout = setTimeout(() => {
      // Check if instance is still active before starting polling
      if (!instanceCleanedUp && (!eventSource || eventSource.readyState !== EventSource.OPEN)) {
        console.log('🔄 SSE not ready after 5s, starting polling fallback...');
        startPolling();
      }
    }, 5000); // Give SSE 5 seconds to connect
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
      // Remove force cleanup listener
      if (browser) {
        window.removeEventListener('force-cleanup', handleForceCleanup);
      }
    };
  });

  onDestroy(() => {
    console.log(`🔌 Instance ${instanceId}: Component destroying, cleaning up...`);
    
    // Remove all event listeners
    if (browser) {
      window.removeEventListener('force-cleanup', handleForceCleanup);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
    
    // Disconnect and cleanup
    disconnect();
  });

  return {
    connect,
    disconnect,
    cleanup
  };
} 