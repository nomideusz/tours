import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface UserPreferences {
  notificationSound: boolean;
  compactView: boolean;
  theme: 'light' | 'dark' | 'system';
}

const defaultPreferences: UserPreferences = {
  notificationSound: true, // Enabled by default - gentle chime for new bookings
  compactView: false,
  theme: 'system'
};

// Load preferences from localStorage
function loadPreferences(): UserPreferences {
  if (!browser) {
    console.log('🔄 Not in browser, using default preferences');
    return defaultPreferences;
  }
  
  try {
    const stored = localStorage.getItem('userPreferences');
    console.log('🔄 Loading preferences from localStorage:', stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged = { ...defaultPreferences, ...parsed };
      console.log('🔄 Merged preferences:', merged);
      return merged;
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
  
  console.log('🔄 Using default preferences:', defaultPreferences);
  return defaultPreferences;
}

// Create the store
export const preferences = writable<UserPreferences>(loadPreferences());

// Save to localStorage whenever preferences change
preferences.subscribe((value) => {
  if (browser) {
    console.log('💾 Saving preferences to localStorage:', value);
    localStorage.setItem('userPreferences', JSON.stringify(value));
    // Verify it was saved
    const saved = localStorage.getItem('userPreferences');
    console.log('✅ Verified saved preferences:', saved);
  }
});

// Derived stores for easy access
export const notificationSoundEnabled = derived(preferences, ($prefs) => $prefs.notificationSound);
export const compactViewEnabled = derived(preferences, ($prefs) => $prefs.compactView);
export const theme = derived(preferences, ($prefs) => $prefs.theme);

// Actions
export const updatePreferences = (updates: Partial<UserPreferences>) => {
  preferences.update(prefs => ({ ...prefs, ...updates }));
}; 