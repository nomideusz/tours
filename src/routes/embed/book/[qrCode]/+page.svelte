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
							
							<div class="tour-price">
								<span>{getTourDisplayPriceFormatted(tour)} <span class="per-person">per person</span></span>
								{#if tour.enablePricingTiers && tour.pricingTiers?.child !== undefined}
									<span class="price-note">• {$globalCurrencyFormatter(tour.pricingTiers.child)} child</span>
								{/if}
							</div>
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
							<button class="button-primary button--gap" onclick={handleBookNow}>
								<Calendar class="w-4 h-4" />
								<span>Book Now</span>
							</button>
						{:else}
							<button class="button-secondary button--gap" onclick={handleContactUs}>
								<Calendar class="w-4 h-4" />
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
		height: 100%;
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
		border-right: 1px solid var(--border-primary);
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
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	
	.price-note {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	.per-person {
		font-size: var(--text-xs);
		font-weight: 400;
		color: var(--text-secondary);
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
	
	/* Ensure buttons in widget have minimum width */
	.widget-actions .button-primary,
	.widget-actions .button-secondary {
		min-width: 120px;
	}
	
	.widget-footer {
		border-top: 1px solid var(--border-primary);
		padding: var(--space-2) var(--space-4);
		background: var(--bg-secondary);
		border-radius: 0 0 var(--radius-lg) var(--radius-lg);
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
		
		.widget-actions .button-primary,
		.widget-actions .button-secondary {
			width: 100%;
		}
	}
	
	/* Mobile screens */
	@media (max-width: 480px) {
		.embed-widget {
			height: auto !important;
			min-height: auto;
			max-height: none !important;
		}
		
		.tour-widget {
			height: 100%;
			min-height: auto;
			display: flex;
			flex-direction: column;
		}
		
		.widget-content {
			flex-direction: row;
			flex: 1;
		}
		
		.tour-image {
			width: 120px;
			height: auto;
			min-height: 100%;
			border-radius: var(--radius-lg) 0 0 0;
		}
		
		.tour-image img {
			object-fit: cover;
			object-position: center;
		}
		
		.tour-info {
			padding: var(--space-3);
			flex-direction: column;
			gap: var(--space-2);
			flex: 1;
		}
		
		.tour-content {
			gap: var(--space-2);
			flex: 1;
		}
		
		.tour-header {
			gap: var(--space-1);
		}
		
		.tour-title {
			font-size: var(--text-base);
			-webkit-line-clamp: 2;
		}
		
		.tour-price {
			font-size: var(--text-lg);
		}
		
		.price-note {
			font-size: 11px;
		}
		
		.tour-meta {
			gap: var(--space-2);
			flex-wrap: wrap;
		}
		
		.meta-item {
			font-size: 11px;
		}
		
		.tour-description {
			font-size: var(--text-xs);
			-webkit-line-clamp: 2;
			max-height: 32px;
		}
		
		.widget-actions {
			width: 100%;
			flex-shrink: 0;
			padding-top: var(--space-2);
		}
		
		.widget-actions .button-primary,
		.widget-actions .button-secondary {
			width: 100%;
			padding: 12px 16px;
			font-size: var(--text-sm);
			min-width: auto;
		}
		
		.widget-footer {
			padding: 8px var(--space-3);
			flex-shrink: 0;
		}
		
		.powered-by {
			font-size: 10px;
		}
	}
	
	/* Very small screens */
	@media (max-width: 360px) {
		.embed-widget {
			min-height: auto;
		}
		
		.tour-image {
			width: 100px;
			min-height: 100%;
		}
		
		.tour-info {
			padding: var(--space-2);
			gap: var(--space-2);
		}
		
		.tour-content {
			gap: var(--space-2);
		}
		
		.tour-header {
			gap: var(--space-1);
		}
		
		.tour-meta {
			gap: var(--space-1);
			flex-wrap: wrap;
		}
		
		.meta-item {
			font-size: 10px;
		}
		
		.tour-title {
			font-size: var(--text-sm);
			-webkit-line-clamp: 2;
		}
		
		.tour-price {
			font-size: var(--text-base);
		}
		
		.price-note {
			font-size: 10px;
		}
		
		.tour-description {
			font-size: 11px;
			-webkit-line-clamp: 2;
			max-height: 28px;
		}
		
		.widget-actions {
			padding-top: var(--space-2);
		}
		
		.widget-actions .button-primary,
		.widget-actions .button-secondary {
			padding: 10px 14px;
			font-size: var(--text-xs);
		}
		
		.widget-footer {
			padding: 6px var(--space-2);
		}
		
		.powered-by {
			font-size: 9px;
		}
	}
</style> 