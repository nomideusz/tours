<script lang="ts">
	import { getTourDisplayPriceFormattedWithCurrency, formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	import { truncateMarkdown } from '$lib/utils/markdown-helpers.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	// Props
	interface Props {
		tour: any;
		href?: string;
		showCategories?: boolean;
	}
	
	let { tour, href = `/book/${tour.qrCode}`, showCategories = false }: Props = $props();
	
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
	
	// Get badge text - show duration (not category to avoid duplication)
	function getBadgeText(tour: any): string {
		// Show duration if available
		if (tour.duration) {
			return formatDuration(tour.duration);
		}
		
		// Fallback to category if no duration
		if (tour.categories && tour.categories.length > 0) {
			const category = tour.categories[0];
			return category.charAt(0).toUpperCase() + category.slice(1);
		}
		
		return 'Available';
	}
	
	// Get image URL
	function getImageUrl(tour: any): string {
		if (!tour.images || tour.images.length === 0) {
			return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
		}
		return `/api/images/${tour.id}/${tour.images[0]}?size=medium`;
	}
	
	// Format price
	function formatPrice(tour: any): string {
		if (tour.pricingModel === 'participant_categories' && tour.participantCategories?.categories) {
			const adultCategory = tour.participantCategories.categories.find((c: any) => c.id === 'adult');
			if (adultCategory) {
				const currency = tour.operator.currency || 'EUR';
				return `${currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency}${adultCategory.price}`;
			}
		}
		
		if (tour.pricingModel === 'group_tiers' && tour.groupPricingTiers?.tiers?.length > 0) {
			const currency = tour.operator.currency || 'EUR';
			return `From ${currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency}${tour.groupPricingTiers.tiers[0].price}`;
		}
		
		return getTourDisplayPriceFormattedWithCurrency(tour, tour.operator.currency);
	}
</script>

<a 
	{href}
	class="tour-card"
>
	<!-- Tour Image -->
	<div class="tour-image-container">
		<img 
			src={getImageUrl(tour)} 
			alt={tour.name}
			class="tour-image"
			loading="lazy"
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
		
		<!-- Categories (always reserve space when showCategories is true) -->
		{#if showCategories}
			<div class="tour-categories">
				{#if tour.categories && tour.categories.length > 0}
					{#each tour.categories.slice(0, 2) as category}
						<span class="category-badge">
							{formatCategoryName(category)}
						</span>
					{/each}
					{#if tour.categories.length > 2}
						<span class="category-badge category-badge-more">
							+{tour.categories.length - 2}
						</span>
					{/if}
				{/if}
			</div>
		{/if}
		
		<!-- Price & CTA -->
		<div class="tour-footer">
			<div class="price-section">
				<span class="price">{formatPrice(tour)}</span>
				{#if tour.pricingModel === 'per_person'}
					<span class="price-unit">/ person</span>
				{/if}
			</div>
			
			<button class="button-primary button-large">
				Book Now
				<ArrowRight class="w-4 h-4" />
			</button>
		</div>
	</div>
</a>

<style>
	/* Tour Card - Matching BookingDemoSection Style */
	.tour-card {
		display: flex;
		flex-direction: column;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 1rem;
		overflow: hidden;
		text-decoration: none;
		transition: all 0.3s ease;
		height: 100%;
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
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		min-height: 3.25rem;
	}
	
	.tour-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0 0 1rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		min-height: 4rem;
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
	
	/* Categories */
	.tour-categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
		min-height: 2rem;
		align-items: flex-start;
	}
	
	.category-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	
	.category-badge-more {
		background: var(--color-primary-100);
		border-color: var(--color-primary-300);
		color: var(--color-primary-700);
	}
	
	:global([data-theme="dark"]) .category-badge-more {
		background: var(--color-primary-900);
		color: var(--color-primary-300);
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.tour-image-container {
			height: 180px;
		}
		
		.tour-footer {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
	}
	
	@media (max-width: 640px) {
		.tour-content {
			padding: 1rem;
		}
		
		.tour-name {
			font-size: 1.125rem;
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

