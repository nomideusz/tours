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
	import Sparkles from 'lucide-svelte/icons/sparkles';
	
	// Umami tracking
	import { trackEvent, UMAMI_EVENTS } from '$lib/utils/umami-tracking.js';
	
	// Fetch demo tours from the API
	let toursQuery = $derived(createQuery({
		queryKey: ['demo-tours-marketing'],
		queryFn: async () => {
			const response = await fetch('/api/public/tours?limit=6');
			if (!response.ok) throw new Error('Failed to fetch tours');
			const data = await response.json();
			return data;
		},
		staleTime: 5 * 60 * 1000 // 5 minutes
	}));
	
	let allTours = $derived($toursQuery.data?.tours || []);
	let isLoading = $derived($toursQuery.isLoading);
	
	// Filter for demo tours with different pricing models
	let demoTours = $derived.by(() => {
		if (!allTours.length) return [];
		
		// Try to get one of each pricing model for variety
		const participantCategoryTour = allTours.find((t: any) => t.pricingModel === 'participant_categories');
		const groupTierTour = allTours.find((t: any) => t.pricingModel === 'group_tiers');
		const perPersonTour = allTours.find((t: any) => t.pricingModel === 'per_person');
		
		// Return up to 3 diverse tours, or fall back to first 3 if we don't have variety
		const diverseTours = [participantCategoryTour, groupTierTour, perPersonTour].filter(Boolean);
		
		if (diverseTours.length >= 2) {
			return diverseTours.slice(0, 3);
		}
		
		// Fallback to first 3 tours
		return allTours.slice(0, 3);
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

<div class="booking-demo-section max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20">
		
		<!-- Section Header -->
		<div class="text-center mb-8 sm:mb-12" in:fade={{ delay: 100 }}>
				<div class="badge-container mb-4">
					<div class="demo-badge">
						<Sparkles class="w-3.5 h-3.5" />
						<span>INTERACTIVE DEMO</span>
					</div>
				</div>
				
				<h2 class="section-title">
					Try the Booking Experience
				</h2>
				<p class="section-subtitle">
					See how your customers will discover and book your tours. Click any tour to experience the complete booking flow.
				</p>
			</div>
			
			{#if isLoading}
				<!-- Loading State -->
				<div class="loading-container" in:fade>
					<Loader2 class="w-8 h-8 animate-spin" />
					<p>Loading demo tours...</p>
				</div>
			{:else if demoTours.length === 0}
				<!-- Empty State -->
				<div class="empty-state" in:fade>
					<Calendar class="w-12 h-12 mb-4 opacity-40" />
					<p>No demo tours available at the moment.</p>
					<p class="text-sm">Check back soon to see live examples!</p>
				</div>
			{:else}
				<!-- Tour Cards Grid -->
				<div class="tours-grid">
					{#each demoTours as tour, i (tour.id)}
						<a 
							href="/book/{tour.qrCode}" 
							target="_blank"
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
									{tour.description?.slice(0, 120)}{tour.description?.length > 120 ? '...' : ''}
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
								
								<button class="button-primary button--large">
									Try Live Demo
									<ArrowRight class="w-4 h-4" />
								</button>
							</div>
							</div>
						</a>
					{/each}
				</div>
				
			<!-- Bottom CTA -->
			<div class="bottom-cta" in:fade={{ delay: 500 }}>
				<p class="cta-text">
					These are real booking pages powered by Zaur. Your customers get the same seamless experience.
				</p>
			</div>
		{/if}
		
</div>

<style>
	/* Badge */
	.badge-container {
		display: flex;
		justify-content: center;
	}
	
	.demo-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border: 1px solid var(--color-primary-300);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}
	
	/* Section Header */
	.section-title {
		font-size: 2.5rem;
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.section-subtitle {
		font-size: 1.125rem;
		line-height: 1.6;
		color: var(--text-secondary);
		max-width: 48rem;
		margin: 0 auto;
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
	
	/* Bottom CTA */
	.bottom-cta {
		text-align: center;
		padding: 2rem 1rem 0;
	}
	
	.cta-text {
		font-size: 0.9375rem;
		color: var(--text-tertiary);
		font-style: italic;
		margin: 0;
	}
	
	/* Mobile Responsiveness */
	@media (max-width: 768px) {
		.section-title {
			font-size: 2rem;
		}
		
		.section-subtitle {
			font-size: 1rem;
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
		.section-title {
			font-size: 1.75rem;
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

