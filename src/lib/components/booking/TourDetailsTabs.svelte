<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
	import Shield from 'lucide-svelte/icons/shield';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Markdown from '$lib/components/ui/Markdown.svelte';
	import MeetingPointCard from '$lib/components/MeetingPointCard.svelte';
	import { formatShortAddress } from '$lib/utils/location.js';
	
	interface Props {
		tour: Tour;
	}
	
	let { tour }: Props = $props();
</script>

<div class="tour-details">
	<!-- Description Section -->
	{#if tour.description}
		<section class="description-section">
			<h2 class="section-title">About This Experience</h2>
			<Markdown content={tour.description} class="tour-description" />
		</section>
	{/if}
	
	<!-- Meeting Point Section with Photos -->
	{#if tour.location}
		<section class="meeting-point-section">
			{#if (tour as any).locationPlaceId}
				<!-- Rich card with photos -->
				<MeetingPointCard
					locationName={formatShortAddress(tour.location)}
					locationAddress={tour.location}
					placeId={(tour as any).locationPlaceId}
					showPhotos={true}
					photoCount={3}
				/>
			{:else}
				<!-- Simple fallback for locations without Place ID -->
				<div class="simple-meeting-point">
					<div class="meeting-point-header">
						<div class="flex items-center gap-2">
							<MapPin class="w-5 h-5" style="color: var(--color-primary-600);" />
							<h3 class="meeting-point-title">Meeting Point</h3>
						</div>
					</div>
					<p class="location-text">{tour.location}</p>
				<button 
					onclick={() => {
						window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tour.location ?? '')}`, '_blank');
					}}
					class="button-accent button-gap"
				>
						<MapPin class="w-4 h-4" />
						View on Google Maps
					</button>
				</div>
			{/if}
		</section>
	{/if}
	
	<!-- What's Included & Requirements -->
	<section class="highlights-section">
		<div class="highlights-grid">
			<!-- What's Included -->
			{#if tour.includedItems && tour.includedItems.length > 0}
				<div class="highlights-card">
					<h3 class="highlights-title">
						<Check class="w-5 h-5" />
						What's Included
					</h3>
					<ul class="highlights-list">
						{#each tour.includedItems as item}
							<li class="highlight-item">
								<Check class="highlight-icon success" />
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			
			<!-- Requirements -->
			{#if tour.requirements && tour.requirements.length > 0}
				<div class="highlights-card">
					<h3 class="highlights-title">
						<Info class="w-5 h-5" />
						Requirements
					</h3>
					<ul class="highlights-list">
						{#each tour.requirements as requirement}
							<li class="highlight-item">
								<Info class="highlight-icon info" />
								<span>{requirement}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</section>
	
	<!-- Cancellation Policy - Always Visible -->
	{#if tour.cancellationPolicy}
		<section class="policy-section">
			<div class="policy-header">
				<Shield class="w-5 h-5" />
				<h3>Cancellation Policy</h3>
			</div>
			<div class="policy-content">
				<Markdown content={tour.cancellationPolicy} />
			</div>
		</section>
	{/if}
</div>

<style>
	.tour-details {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 0; /* Remove extra margin after last section */
	}
	
	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.description-section {
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.meeting-point-section {
		padding: 1.5rem 0;
		border-bottom: 1px solid var(--border-primary);
	}
	
	/* Simple meeting point fallback */
	.simple-meeting-point {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.meeting-point-header {
		border-bottom: 1px solid var(--border-primary);
		padding-bottom: 0.75rem;
	}
	
	.meeting-point-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.location-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.maps-link-simple {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		text-decoration: none;
		transition: all 0.2s ease;
	}
	
	.maps-link-simple:hover {
		background: var(--color-primary-100);
		transform: translateY(-1px);
	}
	
	:global(.tour-description) {
		font-size: 1rem;
		line-height: 1.75;
	}
	
	/* Highlights Section */
	.highlights-section {
		padding: 1.5rem 0;
		margin-bottom: 0; /* Remove extra margin */
	}
	
	.highlights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}
	
	.highlights-card {
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}
	
	.highlights-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.highlights-title :global(svg) {
		flex-shrink: 0;
		vertical-align: middle;
	}
	
	.highlights-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.highlight-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	:global(.highlight-icon) {
		width: 1rem;
		height: 1rem;
		margin-top: 0.125rem;
		flex-shrink: 0;
	}
	
	:global(.highlight-icon.success) {
		color: var(--color-success-600);
	}
	
	:global(.highlight-icon.info) {
		color: var(--color-info-600);
	}
	
	/* Cancellation Policy */
	.policy-section {
		padding: 2rem;
		background: var(--bg-secondary);
		border-radius: 1rem;
		border: 1px solid var(--border-primary);
		margin-bottom: 0; /* Remove extra margin */
	}
	
	@media (max-width: 640px) {
		.policy-section {
			padding: 1.25rem;
		}
	}
	
	.policy-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		color: var(--color-info-600);
	}
	
	.policy-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.policy-content {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	/* Mobile Adjustments */
	@media (max-width: 640px) {
		.tour-details {
			gap: 1rem;
			margin-bottom: 0;
		}
		
		.section-title {
			font-size: 1.25rem;
			margin-bottom: 0.75rem;
		}
		
		.description-section {
			padding-bottom: 1rem;
		}
		
		.highlights-section {
			padding: 0.5rem 0;
		}
		
		.highlights-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		
		.highlights-card {
			padding: 1rem;
		}
		
	}
</style>
