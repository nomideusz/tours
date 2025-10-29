<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	
	let { children } = $props();
	
	// Create a separate query client for embed pages
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes
				gcTime: 10 * 60 * 1000,   // 10 minutes
				retry: 1,
				refetchOnWindowFocus: false
			}
		}
	});
	
	// Prevent parent page scrolling when embedded and apply theme
	onMount(() => {
		if (typeof window !== 'undefined' && window.parent !== window) {
			document.body.style.overflow = 'hidden';
		}
		
		// Theme detection logic
		const urlParams = new URLSearchParams(window.location.search);
		const themeParam = urlParams.get('theme');
		
		let theme = 'light'; // Always default to light for widgets
		if (themeParam === 'dark') {
			theme = 'dark';
		} else if (themeParam === 'auto') {
			// Only auto-detect if explicitly requested
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			theme = prefersDark ? 'dark' : 'light';
		}
		// If themeParam is 'light' or null/undefined, always use light mode

		// Only apply dark theme attribute if theme is actually dark
		if (theme === 'dark') {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			// Remove any existing theme attribute to ensure light mode
			document.documentElement.removeAttribute('data-theme');
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<main class="embed-layout">
		{@render children()}
	</main>
</QueryClientProvider>

<style>
	/* Inline CSS variables and styles for embed widget */
	:root {
		/* Professional Color Palette */
		--color-primary-50: #eff6ff;
		--color-primary-100: #dbeafe;
		--color-primary-200: #bfdbfe;
		--color-primary-300: #93c5fd;
		--color-primary-400: #60a5fa;
		--color-primary-500: #3b9ef7;
		--color-primary-600: #2563eb;
		--color-primary-700: #1d4ed8;
		--color-primary-800: #1e40af;
		--color-primary-900: #1e3a8a;
		
		/* Neutral Grays */
		--color-gray-50: #f9fafb;
		--color-gray-100: #f3f4f6;
		--color-gray-200: #e5e7eb;
		--color-gray-300: #d1d5db;
		--color-gray-400: #9ca3af;
		--color-gray-500: #6b7280;
		--color-gray-600: #4b5563;
		--color-gray-700: #374151;
		--color-gray-800: #1f2937;
		--color-gray-900: #111827;
		
		/* Typography */
		--font-sans: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
		
		/* Font Sizes */
		--text-xs: 0.8125rem;
		--text-sm: 0.9375rem;
		--text-base: 1.0625rem;
		--text-lg: 1.1875rem;
		
		/* Spacing Scale */
		--space-1: 0.25rem;
		--space-2: 0.5rem;
		--space-3: 0.75rem;
		--space-4: 1rem;
		--space-6: 1.5rem;
		--space-8: 2rem;
		
		/* Border Radius */
		--radius-sm: 0.125rem;
		--radius-md: 0.5rem;
		--radius-lg: 0.75rem;
		--radius-xl: 1rem;
		
		/* Shadows */
		--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
		
		/* Transitions */
		--transition-fast: 150ms;
		
		/* Focus shadows */
		--focus-shadow-primary: 0 0 0 3px rgba(59, 130, 246, 0.1);
		
		/* Light theme semantic colors */
		--bg-primary: #ffffff;
		--bg-secondary: var(--color-gray-50);
		--bg-tertiary: var(--color-gray-100);
		--text-primary: var(--color-gray-900);
		--text-secondary: var(--color-gray-600);
		--text-tertiary: var(--color-gray-500);
		--border-primary: var(--color-gray-200);
		--border-secondary: var(--color-gray-300);
	}

	/* Dark mode overrides */
	[data-theme="dark"] {
		/* Dark mode gray scale */
		--color-gray-50: #0f1419;
		--color-gray-100: #1c2128;
		--color-gray-200: #30363d;
		--color-gray-300: #484f58;
		--color-gray-400: #656d76;
		--color-gray-500: #8b949e;
		--color-gray-600: #b1bac4;
		--color-gray-700: #c9d1d9;
		--color-gray-800: #f0f6fc;
		--color-gray-900: #ffffff;

		/* Dark theme semantic colors */
		--bg-primary: #0d1117;
		--bg-secondary: #161b22;
		--bg-tertiary: #21262d;
		--text-primary: #f0f6fc;
		--text-secondary: #c9d1d9;
		--text-tertiary: #a8b3bf;
		--border-primary: #30363d;
		--border-secondary: #21262d;

		/* Adjust shadows for dark mode */
		--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
		--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
		
		/* Focus shadows for dark mode */
		--focus-shadow-primary: 0 0 0 3px rgba(59, 130, 246, 0.3);
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
		font-family: var(--font-sans);
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.embed-layout {
		width: 100%;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-primary);
	}
	
	/* Reset some global styles for embed */
	:global(*) {
		box-sizing: border-box;
	}
	
	:global(button) {
		font-family: inherit;
	}

	/* Button styles for embed widget */
	:global(.button-primary) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		padding: 0.75rem 1.5rem;
		font-size: var(--text-sm);
		font-weight: 500;
		line-height: 1.25rem;
		cursor: pointer;
		transition: all var(--transition-fast) ease;
		text-decoration: none;
		text-align: center;
		white-space: nowrap;
		user-select: none;
		background: var(--color-primary-600);
		color: white;
		border: 1px solid var(--color-primary-600);
		box-shadow: var(--shadow-xs);
	}

	:global(.button-primary:hover:not(:disabled)) {
		background: var(--color-primary-700);
		border-color: var(--color-primary-700);
	}

	:global(.button-primary:focus) {
		outline: 2px solid transparent;
		outline-offset: 2px;
		box-shadow: var(--focus-shadow-primary);
	}

	:global(.button-primary:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.button-secondary) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		padding: 0.75rem 1.5rem;
		font-size: var(--text-sm);
		font-weight: 500;
		line-height: 1.25rem;
		cursor: pointer;
		transition: all var(--transition-fast) ease;
		text-decoration: none;
		text-align: center;
		white-space: nowrap;
		user-select: none;
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
		box-shadow: var(--shadow-xs);
	}

	:global(.button-secondary:hover:not(:disabled)) {
		background-color: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	:global(.button-secondary:focus) {
		outline: 2px solid transparent;
		outline-offset: 2px;
		box-shadow: var(--focus-shadow-primary);
	}

	:global(.button-secondary:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Button modifiers */
	:global(.button-gap) {
		gap: 0.5rem;
	}

	/* Ensure SVG icons in buttons inherit proper colors */
	:global(.button-primary svg),
	:global(.button-secondary svg) {
		color: inherit;
		stroke: currentColor;
		fill: none;
	}

	/* Ensure primary button icons are white */
	:global(.button-primary svg) {
		color: white !important;
		stroke: white !important;
	}

	/* Icon sizing for Lucide icons */
	:global(.w-4) {
		width: 1rem;
	}
	
	:global(.h-4) {
		height: 1rem;
	}
</style> 