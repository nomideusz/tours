<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { createQuery } from '@tanstack/svelte-query';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	// Umami tracking
	import { trackEvent, UMAMI_EVENTS } from '$lib/utils/umami-tracking.js';
	
	// Markdown utilities
	import { truncateMarkdown } from '$lib/utils/markdown-helpers.js';
	
	// Fetch featured tours (demo tour + Beta 1 tours)
	let toursQuery = $derived(createQuery({
		queryKey: ['featured-tours-marketing'],
		queryFn: async () => {
			const response = await fetch('/api/public/featured-tours');
			if (!response.ok) throw new Error('Failed to fetch featured tours');
			const data = await response.json();
			return data;
		},
		staleTime: 5 * 60 * 1000 // 5 minutes
	}));
	
	let allTours = $derived($toursQuery.data?.tours || []);
	let isLoading = $derived($toursQuery.isLoading);
	let meta = $derived($toursQuery.data?.meta || {});
	
	// Display all featured tours (demo tour is always first if available)
	let featuredTours = $derived.by(() => {
		if (!allTours.length) return [];
		
		// Show all featured tours (max 6: 1 demo + 5 Beta 1)
		// The API already returns them in the right order
		return allTours;
	});
	
	// Format duration - handles days, hours, minutes
	function formatDuration(minutes: number): string {
		if (minutes < 60) return `${minutes}min`;
		
		const days = Math.floor(minutes / (24 * 60));
		const remainingAfterDays = minutes % (24 * 60);
		const hours = Math.floor(remainingAfterDays / 60);
		const mins = remainingAfterDays % 60;
		
		// Multi-day tours
		if (days > 0) {
			const parts = [`${days}d`];
			if (hours > 0) parts.push(`${hours}h`);
			if (mins > 0) parts.push(`${mins}min`);
			return parts.join(' ');
		}
		
		// Single day tours (under 24 hours)
		return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
	}
	
	// Format price
	function formatPrice(tour: any): string {
		if (tour.pricingModel === 'participant_categories' && tour.participantCategories?.categories) {
			const adultCategory = tour.participantCategories.categories.find((c: any) => c.id === 'adult');
			if (adultCategory) {
				return `€${adultCategory.price}`;
			}
		}
		
		if (tour.pricingModel === 'group_tiers' && tour.groupPricingTiers?.tiers?.length > 0) {
			return `From €${tour.groupPricingTiers.tiers[0].price}`;
		}
		
		return `€${tour.price}`;
	}
	
	// Get badge text - show main category or duration
	function getBadgeText(tour: any): string {
		// Prioritize showing the main category
		if (tour.categories && tour.categories.length > 0) {
			const category = tour.categories[0];
			// Capitalize and format
			return category.charAt(0).toUpperCase() + category.slice(1);
		}
		
		// Fallback to duration if no category
		if (tour.duration) {
			return formatDuration(tour.duration);
		}
		
		return 'LIVE DEMO';
	}
	
	// Get image URL
	function getImageUrl(tour: any): string {
		if (!tour.images || tour.images.length === 0) {
			return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
		}
		return `/api/images/${tour.id}/${tour.images[0]}?size=medium`;
	}
	
	// Track demo click
	function handleDemoClick(tour: any) {
		trackEvent(UMAMI_EVENTS.DEMO_REQUEST, {
			category: 'booking_demo',
			action: 'try_live_demo',
			label: tour.name,
			pricing_model: tour.pricingModel
		});
	}
</script>

<div class="booking-demo-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Section Divider -->
		<hr class="section-divider" aria-hidden="true" />
		
		<!-- Section Header -->
		<div class="section-header" in:fade={{ delay: 100 }}>
				<h2 class="section-title">
					Try the Booking Experience
				</h2>
				<p class="section-subtitle">
				See how your customers will discover and book your tours
				</p>
			</div>
			
			{#if isLoading}
				<!-- Loading State -->
				<div class="loading-container" in:fade>
					<Loader2 class="w-8 h-8 animate-spin" />
					<p>Loading demo tours...</p>
				</div>
			{:else if featuredTours.length === 0}
				<!-- Empty State -->
				<div class="empty-state" in:fade>
					<Calendar class="w-12 h-12 mb-4 opacity-40" />
					<p>No featured tours available at the moment.</p>
					<p class="text-sm">Check back soon to see live examples!</p>
				</div>
			{:else}
				<!-- Tour Cards Grid -->
				<div class="tours-grid">
					{#each featuredTours as tour, i (tour.id)}
						<a 
							href="/book/{tour.qrCode}" 
							onclick={() => handleDemoClick(tour)}
							class="tour-card"
							in:fly={{ y: 20, delay: 100 + (i * 100), duration: 600, easing: quintOut }}
						>
							<!-- Tour Image -->
							<div class="tour-image-container">
								<img 
									src={getImageUrl(tour)} 
									alt={tour.name}
									class="tour-image"
								/>
								<div class="pricing-badge-overlay">
									{getBadgeText(tour)}
								</div>
							</div>
							
							<!-- Tour Content -->
							<div class="tour-content">
								<h3 class="tour-name">{tour.name}</h3>
								
								<p class="tour-description">
									{truncateMarkdown(tour.description || '', 120)}
								</p>
								
								<!-- Tour Details -->
								<div class="tour-details">
									<div class="detail-item">
										<MapPin class="w-4 h-4" />
										<span>{tour.location || 'Location TBD'}</span>
									</div>
									{#if tour.duration}
										<div class="detail-item">
											<Clock class="w-4 h-4" />
											<span>{formatDuration(tour.duration)}</span>
										</div>
									{/if}
									{#if tour.capacity}
										<div class="detail-item">
											<Users class="w-4 h-4" />
											<span>Up to {tour.capacity} guests</span>
										</div>
									{/if}
								</div>
								
							<!-- Price & CTA -->
							<div class="tour-footer">
								<div class="price-section">
									<span class="price">{formatPrice(tour)}</span>
									{#if tour.pricingModel === 'per_person'}
										<span class="price-unit">/ person</span>
									{/if}
								</div>
								
								<button class="button-primary button-large">
									Try Live Demo
									<ArrowRight class="w-4 h-4" />
								</button>
							</div>
							</div>
						</a>
					{/each}
			</div>
		{/if}
		
	</div>
</div>

<style>
	/* Section Background - Clean & Professional */
	.booking-demo-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 0 auto 4rem;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.section-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-secondary) 50%,
			transparent 100%
		);
	}
	
	.section-divider::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.6;
		z-index: 1;
		box-shadow: 0 0 0 2px var(--bg-primary);
	}
	
	/* Section Header */
	.section-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 56rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	.section-title {
		font-size: 2.25rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
	
	.section-subtitle {
		font-size: 1.0625rem;
		color: var(--text-secondary);
		line-height: 1.6;
		letter-spacing: -0.01em;
	}
	
	/* Loading State */
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 2rem;
		color: var(--text-secondary);
	}
	
	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		color: var(--text-secondary);
		text-align: center;
	}
	
	.empty-state p {
		margin: 0;
	}
	
	/* Tours Grid */
	.tours-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
		max-width: 1400px;
		margin-left: auto;
		margin-right: auto;
	}
	
	/* Tour Card */
	.tour-card {
		display: flex;
		flex-direction: column;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 1rem;
		overflow: hidden;
		text-decoration: none;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.tour-card:hover {
		border-color: var(--color-primary-400);
		transform: translateY(-4px);
		box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
	}
	
	/* Tour Image */
	.tour-image-container {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: var(--bg-tertiary);
	}
	
	.tour-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}
	
	.tour-card:hover .tour-image {
		transform: scale(1.05);
	}
	
	.pricing-badge-overlay {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.375rem 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		color: var(--color-primary-700);
		border: 1px solid var(--color-primary-300);
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		backdrop-filter: blur(4px);
	}
	
	/* Tour Content */
	.tour-content {
		display: flex;
		flex-direction: column;
		padding: 1.25rem;
		flex: 1;
	}
	
	.tour-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
	}
	
	.tour-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0 0 1rem 0;
		flex: 1;
	}
	
	/* Tour Details */
	.tour-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	/* Tour Footer */
	.tour-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	
	.price-section {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		color: var(--text-primary);
	}
	
	.price {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.price-unit {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}
	
	/* Mobile Responsiveness */
	@media (max-width: 768px) {
		.section-divider {
			margin: 0 auto 3rem;
			max-width: 10rem;
		}
		
		.section-header {
			margin-bottom: 2.5rem;
		}
		
		.section-title {
			font-size: 1.75rem;
		}
		
		.section-subtitle {
			font-size: 0.9375rem;
		}
		
		.tours-grid {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}
		
		.tour-image-container {
			height: 180px;
		}
		
		.tour-footer {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
	}
	
	/* Extra small screens */
	@media (max-width: 400px) {
		.section-divider {
			margin: 0 auto 2.5rem;
			max-width: 8rem;
		}
		
		.section-header {
			margin-bottom: 2rem;
		}
		
		.section-title {
			font-size: 1.5rem;
		}
		
		.section-subtitle {
			font-size: 0.875rem;
		}
		
		.tour-name {
			font-size: 1.125rem;
		}
		
		.tour-content {
			padding: 1rem;
		}
	}
	
	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.pricing-badge-overlay {
			background: rgba(0, 0, 0, 0.85);
			color: var(--color-primary-300);
		}
	}
</style>

