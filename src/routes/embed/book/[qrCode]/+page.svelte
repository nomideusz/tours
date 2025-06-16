<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDuration, getTourDisplayPriceFormatted } from '$lib/utils/tour-helpers-client.js';
	import { getTourImageUrl } from '$lib/utils/tour-helpers-client.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	
	// Icons
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Info from 'lucide-svelte/icons/info';
	
	// Components
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	
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
	
	// Modal state
	let showContactModal = $state(false);
	
	function getImageUrl(imagePath: string | null | undefined): string {
		return getTourImageUrl(tour?.id || '', imagePath, 'medium');
	}
	
	function handleBookNow() {
		// Open the full booking page in parent window
		if (typeof window !== 'undefined') {
			window.parent.open(`${window.location.origin}/book/${qrCode}`, '_blank');
		}
	}
	
	function handleContactUs() {
		// Show the contact modal instead of browser alert
		showContactModal = true;
	}
	
	function handleVisitWebsite() {
		if (typeof window !== 'undefined') {
			window.parent.open('https://zaur.app', '_blank');
		}
		showContactModal = false;
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
				<!-- Tour image with improved aspect ratio -->
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
						<MapPin size={28} />
						{#if tour.status === 'draft'}
							<div class="status-overlay">
								<span class="status-badge">Coming Soon</span>
							</div>
						{/if}
					</div>
				{/if}
				
				<!-- Tour info with improved layout -->
				<div class="tour-info">
					<div class="tour-content">
						<!-- Header section -->
						<div class="tour-header">
							<h3 class="tour-title">{tour.name}</h3>
							
							<!-- Status indicator with consistent design -->
							<div class="tour-status">
								{#if tour.status === 'draft'}
									<div class="status-dot status-dot--draft"></div>
									<span class="status-text">Coming Soon</span>
								{:else}
									<div class="status-dot status-dot--active"></div>
									<span class="status-text">Available</span>
								{/if}
							</div>
							
							<div class="tour-price">{getTourDisplayPriceFormatted(tour)}</div>
						</div>
						
						<!-- Meta information with better spacing -->
						<div class="tour-meta">
							{#if tour.duration}
								<div class="meta-item">
									<Clock size={14} />
									<span>{formatDuration(tour.duration)}</span>
								</div>
							{/if}
							<div class="meta-item">
								<Users size={14} />
								<span>{tour.capacity} max</span>
							</div>
							{#if tour.location}
								<div class="meta-item">
									<MapPin size={14} />
									<span>{tour.location}</span>
								</div>
							{/if}
						</div>
						
						<!-- Description with better typography -->
						{#if tour.description}
							<p class="tour-description">{tour.description}</p>
						{/if}
					</div>
					
					<!-- Action button positioned on the right on desktop -->
					<div class="widget-actions">
						{#if tour.status === 'active'}
							<button class="widget-book-button widget-book-button--primary" onclick={handleBookNow}>
								<Calendar size={16} />
								<span>Book Now</span>
							</button>
						{:else}
							<button class="widget-book-button widget-book-button--secondary" onclick={handleContactUs}>
								<Calendar size={16} />
								<span>Contact Us</span>
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

<!-- Contact Modal -->
<ConfirmationModal
	bind:isOpen={showContactModal}
	title="Tour Not Available for Online Booking"
	message="This tour is currently not accepting online bookings. To inquire about availability or book this tour, please contact the tour guide directly or check back later as this tour may become available."
	confirmText="Visit Website"
	cancelText="Close"
	variant="info"
	icon={Info}
	onConfirm={handleVisitWebsite}
/>

<style>
	.embed-widget {
		width: 100%;
		min-height: 240px;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		font-family: var(--font-sans);
		color: var(--text-primary);
		display: flex;
		flex-direction: column;
		position: relative;
		box-sizing: border-box;
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
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		border: 1px solid var(--border-primary);
		min-height: 240px;
	}
	
	.widget-content {
		display: flex;
		flex: 1;
	}
	
	.tour-image {
		width: 140px;
		min-height: 200px;
		flex-shrink: 0;
		background: var(--bg-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-lg) 0 0 0;
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
		background: rgba(0, 0, 0, 0.85);
		color: white;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		backdrop-filter: blur(4px);
	}
	
	.tour-info {
		flex: 1;
		padding: var(--space-4);
		display: flex;
		min-width: 0;
		gap: var(--space-4);
	}
	
	.tour-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}
	
	.tour-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.tour-title {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--text-primary);
		line-height: var(--leading-tight);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.tour-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	
	.status-dot--draft {
		background: var(--color-gray-400);
	}
	
	.status-dot--active {
		background: var(--color-success);
	}
	
	.status-text {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.tour-price {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-success);
	}
	
	.tour-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
	
	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-xs);
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.meta-item :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}
	
	.tour-description {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: var(--leading-normal);
		max-height: 42px; /* 2 lines * 1.5 line-height * 14px font-size */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-wrap: break-word;
	}
	
	.widget-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.widget-book-button {
		padding: 12px 20px;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.025em;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		border: none;
		cursor: pointer;
		transition: all var(--transition-fast) ease;
		text-decoration: none;
		white-space: nowrap;
		min-width: 120px;
	}
	
	.widget-book-button--primary {
		background: var(--color-primary-600);
		color: white;
	}
	
	.widget-book-button--primary:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}
	
	.widget-book-button--secondary {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
	}
	
	.widget-book-button--secondary:hover {
		background: var(--color-gray-100);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
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
	
	/* Tablet and smaller screens */
	@media (max-width: 768px) {
		.tour-info {
			flex-direction: column;
			gap: var(--space-3);
		}
		
		.widget-actions {
			width: 100%;
		}
		
		.widget-book-button {
			width: 100%;
		}
	}
	
	/* Mobile screens */
	@media (max-width: 480px) {
		.embed-widget {
			height: auto !important;
			min-height: 280px;
			max-height: none !important;
		}
		
		.tour-widget {
			height: auto;
			min-height: auto;
		}
		
		.widget-content {
			flex-direction: column;
			flex: none;
		}
		
		.tour-image {
			width: 100%;
			height: 80px;
			min-height: 80px;
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		}
		
		.tour-info {
			padding: var(--space-2);
			flex-direction: column;
			gap: var(--space-1);
			flex: none;
		}
		
		.tour-content {
			gap: var(--space-1);
			flex: none;
		}
		
		.tour-header {
			gap: 4px;
		}
		
		.tour-title {
			font-size: var(--text-sm);
			-webkit-line-clamp: 1;
		}
		
		.tour-price {
			font-size: var(--text-base);
		}
		
		.tour-meta {
			gap: var(--space-1);
			flex-wrap: wrap;
		}
		
		.meta-item {
			font-size: 10px;
		}
		
		.tour-description {
			font-size: 11px;
			-webkit-line-clamp: 1;
			max-height: 14px;
		}
		
		.widget-actions {
			width: 100%;
			flex-shrink: 0;
			padding: var(--space-1) 0 0 0;
		}
		
		.widget-book-button {
			width: 100%;
			padding: 12px 16px;
			font-size: var(--text-xs);
			min-width: auto;
		}
		
		.widget-footer {
			padding: 6px var(--space-2);
			flex-shrink: 0;
		}
		
		.powered-by {
			font-size: 9px;
		}
	}
	
	/* Very small screens */
	@media (max-width: 360px) {
		.embed-widget {
			min-height: 240px;
		}
		
		.tour-image {
			height: 60px;
			min-height: 60px;
		}
		
		.tour-info {
			padding: 8px;
			gap: 4px;
		}
		
		.tour-content {
			gap: 4px;
		}
		
		.tour-header {
			gap: 2px;
		}
		
		.tour-meta {
			flex-direction: column;
			gap: 2px;
			align-items: flex-start;
		}
		
		.tour-title {
			font-size: 12px;
			-webkit-line-clamp: 1;
		}
		
		.tour-price {
			font-size: var(--text-sm);
		}
		
		.tour-description {
			display: none;
		}
		
		.widget-actions {
			padding: 4px 0 0 0;
		}
		
		.widget-book-button {
			padding: 10px 12px;
			font-size: 11px;
		}
		
		.widget-footer {
			padding: 4px 8px;
		}
		
		.powered-by {
			font-size: 8px;
		}
	}
</style> 