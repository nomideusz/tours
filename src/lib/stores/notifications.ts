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
  add: (notification: Omit<Notification, 'read'>) => {
    notificationStore.update(state => ({
      ...state,
      notifications: [
        { ...notification, read: false },
        ...state.notifications
      ].slice(0, 50) // Keep only last 50 notifications
    }));
  },

  // Mark notification as read
  markAsRead: (id: string) => {
    notificationStore.update(state => ({
      ...state,
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    notificationStore.update(state => ({
      ...state,
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },

  // Remove a notification
  remove: (id: string) => {
    notificationStore.update(state => ({
      ...state,
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  // Clear all notifications
  clear: () => {
    notificationStore.update(state => ({
      ...state,
      notifications: []
    }));
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

  // Load notifications from localStorage (for persistence)
  load: () => {
    if (!browser) return;
    
    try {
      const stored = localStorage.getItem('zaur_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        notificationStore.update(state => ({
          ...state,
          notifications: parsed.notifications || []
        }));
      }
    } catch (error) {
      console.warn('Failed to load notifications from localStorage:', error);
    }
  },

  // Save notifications to localStorage
  save: () => {
    if (!browser) return;
    
    notificationStore.subscribe(state => {
      try {
        localStorage.setItem('zaur_notifications', JSON.stringify({
          notifications: state.notifications.slice(0, 20) // Save only 20 most recent
        }));
      } catch (error) {
        console.warn('Failed to save notifications to localStorage:', error);
      }
    });
  }
};

// Auto-save to localStorage
if (browser) {
  notificationActions.load();
  notificationStore.subscribe(() => {
    notificationActions.save();
  });
} 