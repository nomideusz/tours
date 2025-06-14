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
</script>

<svelte:head>
	<title>{tour?.name || 'Tour'} - Book Now</title>
	<meta name="description" content="Book {tour?.name || 'this tour'} - {tour?.description || 'Experience something amazing'}" />
	<style>
		body {
			margin: 0;
			padding: 0;
			font-family: system-ui, -apple-system, sans-serif;
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
							<button class="book-button" onclick={handleBookNow}>
								<Calendar size={16} />
								Book Now
							</button>
						{:else}
							<button class="book-button book-button--draft" onclick={handleBookNow}>
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
		background: white;
		border-radius: 8px;
		overflow: hidden;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.loading-state, .error-state, .inactive-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
		text-align: center;
		color: #6b7280;
	}
	
	.loading-state .spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.error-state h3, .inactive-state h3 {
		margin: 0 0 0.5rem 0;
		color: #dc2626;
		font-size: 1.125rem;
		font-weight: 600;
	}
	
	.error-state p, .inactive-state p {
		margin: 0;
		font-size: 0.875rem;
	}
	
	.tour-widget {
		height: 100%;
		min-height: 220px;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
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
		background: #f8fafc;
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
		color: #cbd5e1;
	}
	
	.status-overlay {
		position: absolute;
		top: 8px;
		left: 8px;
		right: 8px;
		display: flex;
		justify-content: center;
	}
	
	.status-badge {
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.tour-info {
		flex: 1;
		padding: 16px;
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
		margin-bottom: 8px;
	}
	
	.tour-title {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 700;
		color: #1f2937;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.tour-price {
		font-size: 18px;
		font-weight: 700;
		color: #059669;
		margin-bottom: 8px;
	}
	
	.tour-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 8px;
	}
	
	.meta-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: #6b7280;
		font-weight: 500;
	}
	
	.meta-item :global(svg) {
		color: #9ca3af;
		flex-shrink: 0;
	}
	
	.tour-description {
		margin: 0;
		font-size: 13px;
		color: #6b7280;
		line-height: 1.5;
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
	
	.book-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		padding: 10px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		letter-spacing: 0.025em;
	}
	
	.book-button:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
	}
	
	.book-button:active {
		transform: translateY(0);
	}
	
	.book-button--draft {
		background: #6b7280;
	}
	
	.book-button--draft:hover {
		background: #4b5563;
		box-shadow: 0 4px 12px rgba(107, 114, 128, 0.25);
	}
	
	.widget-footer {
		border-top: 1px solid #f1f5f9;
		padding: 8px 16px;
		background: #f8fafc;
	}
	
	.powered-by {
		margin: 0;
		text-align: center;
		font-size: 10px;
		color: #94a3b8;
		font-weight: 500;
	}
	
	.zaur-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s ease;
	}
	
	.zaur-link:hover {
		color: #2563eb;
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
			padding: 12px;
		}
		
		.tour-title {
			font-size: 15px;
		}
		
		.tour-price {
			font-size: 16px;
		}
		
		.meta-item {
			font-size: 10px;
		}
		
		.tour-description {
			font-size: 12px;
		}
		
		.book-button {
			padding: 8px 12px;
			font-size: 13px;
		}
		
		.widget-footer {
			padding: 6px 12px;
		}
	}
	
	@media (max-width: 320px) {
		.tour-meta {
			flex-direction: column;
			gap: 4px;
		}
		
		.tour-title {
			font-size: 14px;
		}
		
		.tour-price {
			font-size: 15px;
		}
	}
</style> 