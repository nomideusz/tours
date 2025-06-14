<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { getTourImageUrl } from '$lib/utils/tour-helpers-client.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	
	// Icons
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	
	let { data } = $props();
	let qrCode = $derived($page.params.qrCode);
	
	// Query for tour data using the same pattern as the public booking page
	let tourQuery = $derived(createQuery({
		queryKey: ['embed-tour', qrCode],
		queryFn: async () => {
			const response = await fetch(`/api/tours/by-qr/${qrCode}`);
			if (!response.ok) {
				throw new Error('Tour not found');
			}
			return response.json();
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: false
	}));

	let tour = $derived($tourQuery.data?.tour || null);
	let isLoading = $derived($tourQuery.isLoading);
	let isError = $derived($tourQuery.isError);
	
	function getImageUrl(imagePath: string | null | undefined): string {
		return getTourImageUrl(tour?.id || '', imagePath, 'medium');
	}
	
	function handleBookNow() {
		// Open the full booking page in parent window
		if (typeof window !== 'undefined') {
			window.parent.open(`${window.location.origin}/book/${qrCode}`, '_blank');
		}
	}
	
	// Theme detection - check if parent prefers dark mode
	onMount(() => {
		if (typeof window !== 'undefined') {
			// Check for theme parameter in URL
			const urlParams = new URLSearchParams(window.location.search);
			const themeParam = urlParams.get('theme');
			
			console.log('Widget theme initialization:', { themeParam });
			
			// Apply initial theme
			const applyTheme = (theme: 'light' | 'dark') => {
				if (theme === 'dark') {
					document.documentElement.setAttribute('data-theme', 'dark');
				} else {
					document.documentElement.removeAttribute('data-theme');
				}
			};
			
			// Determine initial theme
			if (themeParam === 'dark') {
				console.log('Using dark theme (explicit)');
				applyTheme('dark');
			} else if (themeParam === 'light') {
				console.log('Using light theme (explicit)');
				applyTheme('light');
			} else if (themeParam === 'auto') {
				// Auto-detect from system
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				const effectiveTheme = prefersDark ? 'dark' : 'light';
				console.log('Using auto theme:', effectiveTheme);
				applyTheme(effectiveTheme);
				
				// Listen for system theme changes
				const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
				const handleSystemThemeChange = (e: MediaQueryListEvent) => {
					applyTheme(e.matches ? 'dark' : 'light');
				};
				mediaQuery.addEventListener('change', handleSystemThemeChange);
			} else {
				// Default to light theme for widgets
				console.log('Using light theme (default)');
				applyTheme('light');
			}
			
			// Listen for theme changes from parent window (for embedded widgets)
			const handleMessage = (event: MessageEvent) => {
				if (event.data.type === 'theme-change') {
					console.log('Received theme change from parent:', event.data.theme);
					applyTheme(event.data.theme);
				}
			};
			
			window.addEventListener('message', handleMessage);
			
			// Request current theme from parent if embedded
			if (window.parent !== window) {
				window.parent.postMessage({ type: 'request-theme' }, '*');
			}
			
			return () => {
				window.removeEventListener('message', handleMessage);
			};
		}
	});
</script>

<svelte:head>
	<title>{tour?.name || 'Tour'} - Book Now</title>
	<meta name="description" content="Book {tour?.name || 'this tour'} - {tour?.description || 'Experience something amazing'}" />
	<style>
		/* Inline CSS variables for reliable iframe loading */
		:root {
			/* Professional Color Palette */
			--color-primary-50: #eff6ff;
			--color-primary-100: #dbeafe;
			--color-primary-200: #bfdbfe;
			--color-primary-300: #93c5fd;
			--color-primary-400: #60a5fa;
			--color-primary-500: #3b82f6;
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
			
			/* Semantic Colors */
			--color-success: #10b981;
			--color-success-light: #d1fae5;
			--color-error: #ef4444;
			--color-error-light: #fee2e2;
			
			/* Typography */
			--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			
			/* Font Sizes */
			--text-xs: 0.75rem;
			--text-sm: 0.875rem;
			--text-base: 1rem;
			--text-lg: 1.125rem;
			
			/* Line Heights */
			--leading-tight: 1.25;
			--leading-normal: 1.5;
			
			/* Spacing Scale */
			--space-1: 0.25rem;
			--space-2: 0.5rem;
			--space-3: 0.75rem;
			--space-4: 1rem;
			--space-8: 2rem;
			
			/* Border Radius */
			--radius-sm: 0.125rem;
			--radius-md: 0.5rem;
			--radius-lg: 0.75rem;
			--radius-xl: 1rem;
			
			/* Shadows */
			--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
			
			/* Transitions */
			--transition-fast: 150ms;
			
			/* Light theme semantic colors */
			--bg-primary: #ffffff;
			--bg-secondary: var(--color-gray-50);
			--text-primary: var(--color-gray-900);
			--text-secondary: var(--color-gray-600);
			--text-tertiary: var(--color-gray-500);
			--border-primary: var(--color-gray-200);
		}

		/* Dark mode overrides */
		[data-theme="dark"] {
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

			--bg-primary: #0d1117;
			--bg-secondary: #161b22;
			--text-primary: #f0f6fc;
			--text-secondary: #c9d1d9;
			--text-tertiary: #b1bac4;
			--border-primary: #30363d;
		}

		body {
			margin: 0;
			padding: 0;
			font-family: var(--font-sans);
			background: var(--bg-primary);
			color: var(--text-primary);
		}
	</style>
</svelte:head>

<div class="embed-widget">
	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading tour...</p>
		</div>
	{:else if isError || !tour}
		<div class="error-state">
			<h3>Tour not found</h3>
			<p>This tour may no longer be available.</p>
		</div>
	{:else}
		<div class="tour-widget">
			<div class="widget-content">
				<!-- Left side: Tour image -->
				{#if tour.images && tour.images.length > 0}
					<div class="tour-image">
						<img 
							src={getImageUrl(tour.images[0])} 
							alt={tour.name}
							loading="eager"
						/>
						{#if tour.status === 'draft'}
							<div class="status-overlay">
								<span class="status-badge">Coming Soon</span>
							</div>
						{/if}
					</div>
				{:else}
					<div class="tour-image tour-image--placeholder">
						<MapPin size={24} />
						{#if tour.status === 'draft'}
							<div class="status-overlay">
								<span class="status-badge">Coming Soon</span>
							</div>
						{/if}
					</div>
				{/if}
				
				<!-- Right side: Tour info -->
				<div class="tour-info">
					<div class="tour-content-top">
						<div class="tour-header">
							<h3 class="tour-title">{tour.name}</h3>
							<div class="tour-price">{$globalCurrencyFormatter(tour.price)}</div>
						</div>
						
						<div class="tour-meta">
							{#if tour.duration}
								<span class="meta-item">
									<Clock size={12} />
									{formatDuration(tour.duration)}
								</span>
							{/if}
							<span class="meta-item">
								<Users size={12} />
								{tour.capacity} max
							</span>
							{#if tour.location}
								<span class="meta-item">
									<MapPin size={12} />
									{tour.location}
								</span>
							{/if}
						</div>
						
						{#if tour.description}
							<p class="tour-description">{tour.description}</p>
						{/if}
					</div>
					
					<div class="widget-actions">
						{#if tour.status === 'active'}
							<button class="button-primary button--gap button--small widget-book-button" onclick={handleBookNow}>
								<Calendar size={16} />
								Book Now
							</button>
						{:else}
							<button class="button-secondary button--gap button--small widget-book-button" onclick={handleBookNow}>
								<Calendar size={16} />
								Contact Us
							</button>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="widget-footer">
				<p class="powered-by">
					Powered by <a href="https://zaur.app" target="_blank" rel="noopener noreferrer" class="zaur-link">Zaur</a>
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.embed-widget {
		width: 100%;
		height: 100%;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		font-family: var(--font-sans);
		color: var(--text-primary);
	}
	
	.loading-state, .error-state, .inactive-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: var(--space-8);
		text-align: center;
		color: var(--text-secondary);
	}
	
	.loading-state .spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-primary);
		border-top: 2px solid var(--color-primary-600);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: var(--space-4);
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.error-state h3, .inactive-state h3 {
		margin: 0 0 var(--space-2) 0;
		color: var(--color-error);
		font-size: var(--text-lg);
		font-weight: 600;
	}
	
	.error-state p, .inactive-state p {
		margin: 0;
		font-size: var(--text-sm);
	}
	
	.tour-widget {
		height: 100%;
		min-height: 220px;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		overflow: hidden;
		border: 1px solid var(--border-primary);
	}
	
	.widget-content {
		flex: 1;
		display: flex;
		min-height: 180px;
	}
	
	.tour-image {
		width: 120px;
		height: 180px;
		flex-shrink: 0;
		background: var(--bg-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}
	
	.tour-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.tour-image--placeholder {
		color: var(--text-tertiary);
	}
	
	.status-overlay {
		position: absolute;
		top: var(--space-2);
		left: var(--space-2);
		right: var(--space-2);
		display: flex;
		justify-content: center;
	}
	
	.status-badge {
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.tour-info {
		flex: 1;
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 180px;
		justify-content: space-between;
	}
	
	.tour-content-top {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.tour-header {
		margin-bottom: var(--space-2);
	}
	
	.tour-title {
		margin: 0 0 var(--space-1) 0;
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--text-primary);
		line-height: var(--leading-tight);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.tour-price {
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--color-success);
		margin-bottom: var(--space-2);
	}
	
	.tour-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}
	
	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: 11px;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.meta-item :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}
	
	.tour-description {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--text-secondary);
		line-height: var(--leading-normal);
		max-height: 39px; /* 2 lines * 1.5 line-height * 13px font-size */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-wrap: break-word;
	}
	
	.widget-actions {
		margin-top: auto;
	}
	
	.widget-book-button {
		width: 100%;
		letter-spacing: 0.025em;
	}
	
	.widget-footer {
		border-top: 1px solid var(--border-primary);
		padding: var(--space-2) var(--space-4);
		background: var(--bg-secondary);
	}
	
	.powered-by {
		margin: 0;
		text-align: center;
		font-size: 10px;
		color: var(--text-tertiary);
		font-weight: 500;
	}
	
	.zaur-link {
		color: var(--color-primary-600);
		text-decoration: none;
		font-weight: 600;
		transition: color var(--transition-fast) ease;
	}
	
	.zaur-link:hover {
		color: var(--color-primary-700);
		text-decoration: underline;
	}
	
	/* Responsive adjustments */
	@media (max-width: 480px) {
		.widget-content {
			flex-direction: column;
		}
		
		.tour-image {
			width: 100%;
			height: 100px;
		}
		
		.tour-info {
			padding: var(--space-3);
		}
		
		.tour-title {
			font-size: var(--text-sm);
		}
		
		.tour-price {
			font-size: var(--text-base);
		}
		
		.meta-item {
			font-size: 10px;
		}
		
		.tour-description {
			font-size: 12px;
		}
		
		.widget-footer {
			padding: var(--space-1) var(--space-3);
		}
	}
	
	@media (max-width: 320px) {
		.tour-meta {
			flex-direction: column;
			gap: var(--space-1);
		}
		
		.tour-title {
			font-size: var(--text-xs);
		}
		
		.tour-price {
			font-size: var(--text-sm);
		}
	}
</style> 