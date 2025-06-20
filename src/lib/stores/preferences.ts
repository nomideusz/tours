import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface UserPreferences {
  notificationSound: boolean;
  compactView: boolean;
  theme: 'light' | 'dark' | 'system';
}

const defaultPreferences: UserPreferences = {
  notificationSound: false, // Off by default for non-invasive experience
  compactView: false,
  theme: 'system'
};

// Load preferences from localStorage
function loadPreferences(): UserPreferences {
  if (!browser) return defaultPreferences;
  
  try {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
  
  return defaultPreferences;
}

// Create the store
export const preferences = writable<UserPreferences>(loadPreferences());

// Save to localStorage whenever preferences change
preferences.subscribe((value) => {
  if (browser) {
    localStorage.setItem('userPreferences', JSON.stringify(value));
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