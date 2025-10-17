<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Package from 'lucide-svelte/icons/package';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Euro from 'lucide-svelte/icons/euro';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import PageContainer from '$lib/components/PageContainer.svelte';
	import { getTourDisplayPriceFormattedWithCurrency } from '$lib/utils/tour-helpers-client.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';

	// State for layout selection
	let selectedLayout = $state<'compact' | 'detailed' | 'grid'>('compact');

	// Fetch real tours
	let toursQuery = $derived(createQuery({
		queryKey: ['demo-display-tours'],
		queryFn: async () => {
			const response = await fetch('/api/public/tours');
			if (!response.ok) throw new Error('Failed to fetch tours');
			const data = await response.json();
			return data.tours || [];
		}
	}));

	let tours = $derived($toursQuery.data || []);
	let isLoading = $derived($toursQuery.isLoading);

	// Get sample tours (up to 6 for demo)
	let sampleTours = $derived(tours.slice(0, 6));
</script>

<svelte:head>
	<title>Tour Display Demo - Zaur Beta</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<PageContainer>
<div class="demo-container">
	<div class="demo-header">
		<button class="back-button" onclick={() => goto('/demo')}>
			<ArrowLeft class="w-4 h-4" />
			Back to Demos
		</button>
		<div class="header-content">
			<Package class="w-10 h-10 text-primary" />
			<div>
				<h1>Tour Display Demo</h1>
				<p>Compare different tour card layouts and presentation styles</p>
			</div>
		</div>
	</div>

	<div class="info-card">
		<h2>What you're testing</h2>
		<p>
			Explore different ways to display your tours. Each layout option presents tour information 
			differently to help you find the most effective presentation for your audience.
		</p>
	</div>

	<div class="layout-selector">
		<h3>Choose a Layout</h3>
		<div class="layout-options">
			<button 
				class="layout-option {selectedLayout === 'compact' ? 'active' : ''}"
				onclick={() => selectedLayout = 'compact'}
			>
				<div class="option-icon">📋</div>
				<div class="option-label">Compact</div>
				<div class="option-description">Dense information, more tours visible</div>
			</button>
			<button 
				class="layout-option {selectedLayout === 'detailed' ? 'active' : ''}"
				onclick={() => selectedLayout = 'detailed'}
			>
				<div class="option-icon">📝</div>
				<div class="option-label">Detailed</div>
				<div class="option-description">Full descriptions, engaging visuals</div>
			</button>
			<button 
				class="layout-option {selectedLayout === 'grid' ? 'active' : ''}"
				onclick={() => selectedLayout = 'grid'}
			>
				<div class="option-icon">▦</div>
				<div class="option-label">Grid</div>
				<div class="option-description">Card-based, modern aesthetic</div>
			</button>
		</div>
	</div>

	<div class="tours-section">
		<h2>Your Tours - {selectedLayout.charAt(0).toUpperCase() + selectedLayout.slice(1)} Layout</h2>
		
		{#if isLoading}
			<div class="loading-state">
				<Loader2 class="w-8 h-8 animate-spin text-primary" />
				<p>Loading tours...</p>
			</div>
		{:else if sampleTours.length === 0}
			<div class="empty-state">
				<p>No tours available for demo. Create your first tour to see how different layouts work!</p>
				<button class="create-tour-button" onclick={() => goto('/tours/new')}>
					Create Your First Tour
				</button>
			</div>
		{:else}
			<!-- Compact Layout -->
			{#if selectedLayout === 'compact'}
				<div class="compact-list">
					{#each sampleTours as tour}
						<div class="compact-card">
							<div class="compact-main">
								<h3 class="compact-title">{tour.name}</h3>
								<div class="compact-details">
									<span class="detail-item">
										<MapPin class="w-4 h-4" />
										{tour.location || 'Location TBD'}
									</span>
									<span class="detail-item">
										<Clock class="w-4 h-4" />
										{formatDuration(tour.duration)}
									</span>
									<span class="detail-item">
										<Users class="w-4 h-4" />
										{tour.capacity} max
									</span>
								</div>
							</div>
							<div class="compact-price">
								<div class="price-value">{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator?.currency || 'EUR')}</div>
								<a href="/book/{tour.qrCode}" target="_blank" class="book-link">Book →</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Detailed Layout -->
			{#if selectedLayout === 'detailed'}
				<div class="detailed-list">
					{#each sampleTours as tour}
						<div class="detailed-card">
							<div class="detailed-header">
								<h3 class="detailed-title">{tour.name}</h3>
								<div class="detailed-price">{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator?.currency || 'EUR')}</div>
							</div>
							<p class="detailed-description">{tour.description || 'Discover an amazing experience with this tour.'}</p>
							<div class="detailed-info">
								<div class="info-item">
									<MapPin class="w-5 h-5 text-primary" />
									<div>
										<div class="info-label">Location</div>
										<div class="info-value">{tour.location || 'Location TBD'}</div>
									</div>
								</div>
								<div class="info-item">
									<Clock class="w-5 h-5 text-primary" />
									<div>
										<div class="info-label">Duration</div>
										<div class="info-value">{formatDuration(tour.duration)}</div>
									</div>
								</div>
								<div class="info-item">
									<Users class="w-5 h-5 text-primary" />
									<div>
										<div class="info-label">Group Size</div>
										<div class="info-value">Up to {tour.capacity}</div>
									</div>
								</div>
							</div>
							<a href="/book/{tour.qrCode}" target="_blank" class="detailed-button">
								Book This Tour →
							</a>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Grid Layout -->
			{#if selectedLayout === 'grid'}
				<div class="grid-layout">
					{#each sampleTours as tour}
						<div class="grid-card">
							<div class="grid-badge">{tour.operator?.currency || 'EUR'}</div>
							<div class="grid-content">
								<h3 class="grid-title">{tour.name}</h3>
								<p class="grid-description">{tour.description?.slice(0, 100) || 'Discover an amazing experience'}{tour.description?.length > 100 ? '...' : ''}</p>
								<div class="grid-details">
									<div class="grid-detail">
										<MapPin class="w-4 h-4" />
										<span>{tour.location || 'Location TBD'}</span>
									</div>
									<div class="grid-detail">
										<Clock class="w-4 h-4" />
										<span>{formatDuration(tour.duration)}</span>
									</div>
									<div class="grid-detail">
										<Users class="w-4 h-4" />
										<span>{tour.capacity} max</span>
									</div>
								</div>
							</div>
							<div class="grid-footer">
								<div class="grid-price">{getTourDisplayPriceFormattedWithCurrency(tour, tour.operator?.currency || 'EUR')}</div>
								<a href="/book/{tour.qrCode}" target="_blank" class="grid-button">Book</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>

	<div class="feedback-prompt">
		<h3>Which layout do you prefer?</h3>
		<p>Share your thoughts using the feedback widget to help us choose the best default layout.</p>
	</div>
</div>
</PageContainer>

<style>
	.demo-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
	}

	.demo-header {
		margin-bottom: 2rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		margin-bottom: 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.back-button:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.header-content h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.header-content p {
		margin: 0.25rem 0 0 0;
		color: var(--text-secondary);
	}

	.info-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.info-card h2 {
		margin: 0 0 0.75rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.info-card p {
		margin: 0;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.layout-selector {
		margin-bottom: 3rem;
	}

	.layout-selector h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.layout-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.layout-option {
		padding: 1.5rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.layout-option:hover {
		border-color: var(--color-primary-400);
		transform: translateY(-2px);
	}

	.layout-option.active {
		border-color: var(--color-primary-600);
		background: var(--color-primary-50);
	}

	.option-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.option-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.option-description {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.tours-section {
		margin-bottom: 2rem;
	}

	.tours-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Compact Layout Styles */
	.compact-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.compact-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.15s ease;
	}

	.compact-card:hover {
		border-color: var(--color-primary-400);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.compact-main {
		flex: 1;
	}

	.compact-title {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.compact-details {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.compact-price {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: 1rem;
	}

	.price-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.book-link {
		padding: 0.5rem 1rem;
		background: var(--color-primary-600);
		color: white;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.book-link:hover {
		background: var(--color-primary-700);
	}

	/* Detailed Layout Styles */
	.detailed-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detailed-card {
		padding: 2rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
	}

	.detailed-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.detailed-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.detailed-price {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary-600);
		white-space: nowrap;
	}

	.detailed-description {
		margin: 0 0 1.5rem 0;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.detailed-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.info-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.detailed-button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--color-primary-600);
		color: white;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.detailed-button:hover {
		background: var(--color-primary-700);
	}

	/* Grid Layout Styles */
	.grid-layout {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.grid-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.grid-card:hover {
		border-color: var(--color-primary-400);
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}

	.grid-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.25rem 0.75rem;
		background: var(--color-primary-600);
		color: white;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		z-index: 1;
	}

	.grid-content {
		padding: 1.5rem;
		flex: 1;
	}

	.grid-title {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.grid-description {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.grid-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.grid-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-primary);
	}

	.grid-price {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.grid-button {
		padding: 0.5rem 1.25rem;
		background: var(--color-primary-600);
		color: white;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.grid-button:hover {
		background: var(--color-primary-700);
	}

	/* Loading & Empty States */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		color: var(--text-secondary);
	}

	.empty-state {
		padding: 2rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		color: var(--text-secondary);
	}

	.create-tour-button {
		padding: 0.75rem 1.5rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.create-tour-button:hover {
		background: var(--color-primary-700);
	}

	.feedback-prompt {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		text-align: center;
	}

	.feedback-prompt h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.feedback-prompt p {
		margin: 0;
		color: var(--text-secondary);
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			text-align: center;
		}

		.compact-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.compact-price {
			width: 100%;
			justify-content: space-between;
			margin-left: 0;
		}

		.detailed-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.grid-layout {
			grid-template-columns: 1fr;
		}

		.layout-options {
			grid-template-columns: 1fr;
		}
	}
</style>

