<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
	import Shield from 'lucide-svelte/icons/shield';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Markdown from '$lib/components/ui/Markdown.svelte';
	
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
	
	<!-- Tour Info Cards -->
	<section class="info-cards">
		<div class="info-card">
			<Clock class="info-icon" />
			<div class="info-content">
				<span class="info-label">Duration</span>
				<span class="info-value">
					{#if tour.duration}
						{Math.floor(tour.duration / 60)}h {tour.duration % 60 > 0 ? `${tour.duration % 60}m` : ''}
					{:else}
						Duration TBD
					{/if}
				</span>
			</div>
		</div>
		
		<div class="info-card">
			<Users class="info-icon" />
			<div class="info-content">
				<span class="info-label">Group Size</span>
				<span class="info-value">
					{#if tour.pricingModel === 'private_tour'}
						{tour.privateTour?.minCapacity || tour.minCapacity || 4}-{tour.privateTour?.maxCapacity || tour.maxCapacity || 12} people
					{:else}
						Up to {tour.maxCapacity || tour.capacity || 20} people
					{/if}
				</span>
			</div>
		</div>
		
	</section>
	
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
	
	:global(.tour-description) {
		font-size: 1rem;
		line-height: 1.75;
	}
	
	/* Info Cards */
	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}
	
	.info-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}
	
	:global(.info-icon) {
		width: 2.5rem;
		height: 2.5rem;
		color: var(--color-primary-600);
		background: var(--color-primary-100);
		padding: 0.5rem;
		border-radius: 0.5rem;
		flex-shrink: 0;
	}
	
	:global(.dark .info-icon) {
		background: var(--color-primary-900);
	}
	
	.info-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.info-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
	}
	
	.info-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	/* Highlights Section */
	.highlights-section {
		padding: 1.5rem 0;
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
	}
	
	.policy-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		color: var(--color-primary-600);
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
		}
		
		.section-title {
			font-size: 1.25rem;
			margin-bottom: 0.75rem;
		}
		
		.description-section {
			padding-bottom: 1rem;
		}
		
		.highlights-section {
			padding: 1rem 0;
		}
		
		.info-cards {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
		
		.info-card {
			padding: 1rem;
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
