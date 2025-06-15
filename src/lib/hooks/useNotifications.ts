import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { notificationActions, type Notification } from '$lib/stores/notifications.js';
import { useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from '$lib/queries/shared-stats.js';

export function useNotifications() {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const queryClient = useQueryClient();

  function connect() {
    if (!browser) return;

    // Clean up existing connection
    if (eventSource) {
      eventSource.close();
    }

    try {
      console.log('🔗 Establishing SSE connection for notifications...');
      notificationActions.setError(null);
      
      eventSource = new EventSource('/api/notifications/sse', {
        withCredentials: true
      });

      eventSource.onopen = () => {
        console.log('✅ SSE connection established');
        notificationActions.setConnected(true);
        reconnectAttempts = 0;
        
        // Clear any reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          console.log('📨 Raw SSE message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('📨 SSE message received:', data.type, data);

          switch (data.type) {
            case 'connected':
              console.log('🎉 SSE connected for user:', data.userId);
              break;

            case 'heartbeat':
              // Silent heartbeat - just keep connection alive
              console.log('💓 SSE heartbeat received');
              break;

            case 'new_booking':
              console.log('🎉 Processing new booking notification:', data);
              handleNewBookingNotification(data);
              break;

            case 'booking_cancelled':
            case 'payment_received':
            case 'system':
            case 'info':
              console.log('📝 Adding notification to store:', data);
              notificationActions.add(data);
              break;

            default:
              console.log('❓ Unknown SSE message type:', data.type, data);
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error, event.data);
          console.error('❌ Full error details:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        notificationActions.setConnected(false);
        
        if (eventSource?.readyState === EventSource.CLOSED) {
          attemptReconnect();
        }
      };

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      notificationActions.setError('Failed to connect to notification service');
      attemptReconnect();
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn('⚠️ Max SSE reconnection attempts reached');
      notificationActions.setError('Connection lost. Please refresh the page.');
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
    
    // Show browser notification if permitted
    console.log('🔔 Attempting to show browser notification...');
    try {
      showBrowserNotification(data);
    } catch (error) {
      console.error('❌ Error showing browser notification:', error);
    }
    
    // Play notification sound (optional)
    console.log('🔊 Playing notification sound...');
    try {
      playNotificationSound();
    } catch (error) {
      console.error('❌ Error playing notification sound:', error);
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

  function showBrowserNotification(data: any) {
    if (!browser || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: '/favicon-32x32.png',
        badge: '/favicon-16x16.png',
        tag: data.id, // Prevent duplicate notifications
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        if (data.actions?.[0]?.url) {
          window.location.href = data.actions[0].url;
        }
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  function playNotificationSound() {
    if (!browser) return;

    try {
      // Create a subtle notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Ignore audio errors - not critical
      console.debug('Notification sound failed:', error);
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    notificationActions.setConnected(false);
    console.log('🔌 SSE connection closed');
  }

  // Request notification permission
  function requestNotificationPermission() {
    if (!browser || !('Notification' in window)) return Promise.resolve('denied');
    
    if (Notification.permission === 'default') {
      return Notification.requestPermission();
    }
    
    return Promise.resolve(Notification.permission);
  }

  onMount(() => {
    connect();
    
    // Request notification permission on mount
    requestNotificationPermission().then(permission => {
      console.log('🔔 Notification permission:', permission);
    });

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
    requestNotificationPermission
  };
} 