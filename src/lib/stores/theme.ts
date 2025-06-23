import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

// Create the theme store
function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('light');

	// Get initial theme from localStorage or default to light
	const getInitialTheme = (): Theme => {
		if (!browser) return 'light';
		
		const stored = localStorage.getItem('theme');
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}
		// If stored theme is 'system' or not set, detect user preference
		// This handles backward compatibility for users who had 'system' selected
		if (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			// User had system theme and prefers dark, so set to dark
			localStorage.setItem('theme', 'dark');
			return 'dark';
		}
		// Default to light mode
		return 'light';
	};

	// Apply theme to document
	const applyTheme = (theme: Theme) => {
		if (!browser) return;

		const root = document.documentElement;
		
		// Remove existing theme attributes
		root.removeAttribute('data-theme');
		
		if (theme === 'system') {
			// Use system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (prefersDark) {
				root.setAttribute('data-theme', 'dark');
			}
		} else {
			// Use explicit theme
			root.setAttribute('data-theme', theme);
		}
	};

	// Get effective theme (resolves 'system' to actual theme)
	const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
		if (theme === 'system') {
			return browser && window.matchMedia('(prefers-color-scheme: dark)').matches 
				? 'dark' 
				: 'light';
		}
		return theme;
	};

	return {
		subscribe,
		// Set theme and persist to localStorage
		setTheme: (theme: Theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);
				applyTheme(theme);
			}
			set(theme);
		},
		// Initialize theme on mount
		init: () => {
			const initialTheme = getInitialTheme();
			applyTheme(initialTheme);
			set(initialTheme);

			// Listen for system theme changes
			if (browser) {
				const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
				const handleChange = () => {
					// Only update if current theme is 'system'
					update(currentTheme => {
						if (currentTheme === 'system') {
							applyTheme('system');
						}
						return currentTheme;
					});
				};

				mediaQuery.addEventListener('change', handleChange);
				
				// Cleanup function
				return () => mediaQuery.removeEventListener('change', handleChange);
			}
		},
		// Get the effective theme (light/dark, not system)
		getEffective: (theme: Theme) => getEffectiveTheme(theme)
	};
}

export const themeStore = createThemeStore(); 