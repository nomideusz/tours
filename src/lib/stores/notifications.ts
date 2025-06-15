import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface Notification {
  id: string;
  type: 'new_booking' | 'booking_cancelled' | 'payment_received' | 'system' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
  actions?: Array<{
    label: string;
    url: string;
  }>;
}

interface NotificationState {
  notifications: Notification[];
  connected: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  connected: false,
  error: null
};

// Main notification store
export const notificationStore = writable<NotificationState>(initialState);

// Derived stores for easy access
export const notifications = derived(notificationStore, ($store) => $store.notifications);
export const unreadCount = derived(notificationStore, ($store) => 
  $store.notifications.filter(n => !n.read).length
);
export const hasNotifications = derived(unreadCount, ($count) => $count > 0);
export const isConnected = derived(notificationStore, ($store) => $store.connected);

// Actions
export const notificationActions = {
  // Add a new notification
  add: (notification: Omit<Notification, 'read'> | Notification) => {
    console.log('🔔 Adding notification to store:', notification);
    
    // Validate notification data
    if (!notification.id || !notification.title || !notification.message || !notification.timestamp) {
      console.error('❌ Invalid notification data, missing required fields:', notification);
      return;
    }
    
    notificationStore.update(state => {
      // Check if the notification already exists to avoid duplicates
      const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
      
      const newNotification = { 
        ...notification, 
        read: 'read' in notification ? notification.read : false // Preserve read status if provided, default to false
      };
      
      let newNotifications;
      if (existingIndex >= 0) {
        // Update existing notification (useful for read status updates)
        newNotifications = [...state.notifications];
        newNotifications[existingIndex] = newNotification;
        console.log('📊 Updated existing notification:', newNotification.id, 'read:', newNotification.read);
      } else {
        // Add new notification
        newNotifications = [
          newNotification,
          ...state.notifications
        ].slice(0, 50); // Keep only last 50 notifications
        console.log('📊 Added new notification:', newNotification.id, 'read:', newNotification.read);
      }
      
      const newState = {
        ...state,
        notifications: newNotifications
      };
      console.log('📊 Updated notification store:', newState.notifications.length, 'notifications');
      return newState;
    });
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    // Optimistically update the UI first
    notificationStore.update(state => ({
      ...state,
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));

    // Then update the database
    if (browser) {
      try {
        const response = await fetch('/api/notifications/mark-read', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notificationId: id })
        });

        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }

        console.log('✅ Notification marked as read in database:', id);
      } catch (error) {
        console.error('❌ Failed to mark notification as read in database:', error);
        // Revert the optimistic update on error
        notificationStore.update(state => ({
          ...state,
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: false } : n
          )
        }));
      }
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    // Optimistically update the UI first
    notificationStore.update(state => ({
      ...state,
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));

    // Then update the database
    if (browser) {
      try {
        const response = await fetch('/api/notifications/mark-read', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ markAll: true })
        });

        if (!response.ok) {
          throw new Error('Failed to mark all notifications as read');
        }

        console.log('✅ All notifications marked as read in database');
      } catch (error) {
        console.error('❌ Failed to mark all notifications as read in database:', error);
        // Note: We don't revert all notifications on error as it would be complex
        // The user can refresh to get the correct state
      }
    }
  },

  // Remove a notification
  remove: (id: string) => {
    notificationStore.update(state => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  // Clear all notifications
  clear: async () => {
    // Optimistically update the UI first
    notificationStore.update(state => ({
      ...state,
      notifications: []
    }));

    // Then delete from database
    if (browser) {
      try {
        const response = await fetch('/api/notifications/clear', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to clear notifications from database');
        }

        console.log('✅ All notifications cleared from database');
      } catch (error) {
        console.error('❌ Failed to clear notifications from database:', error);
        // Note: We don't revert the UI update since clearing locally is still useful
        // The user would see them again on refresh, but that's acceptable fallback behavior
      }
    }
  },

  // Set connection status
  setConnected: (connected: boolean) => {
    notificationStore.update(state => ({
      ...state,
      connected
    }));
  },

  // Set error
  setError: (error: string | null) => {
    notificationStore.update(state => ({
      ...state,
      error
    }));
  },

  // Load notifications from localStorage (DEPRECATED - now using database)
  load: () => {
    console.log('⚠️ localStorage load called - now using database instead');
    // No longer loading from localStorage since we use database
  },

  // Save notifications to localStorage (DEPRECATED - now using database)
  save: () => {
    console.log('⚠️ localStorage save called - now using database instead');
    // No longer saving to localStorage since we use database
  }
};

// Auto-save to localStorage DISABLED - now using database
if (browser) {
  console.log('📚 Notifications now managed via database, localStorage disabled');
  // No longer using localStorage - notifications are managed via database
  // The useNotifications hook will load initial data from API on startup
} 