<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Package from 'lucide-svelte/icons/package';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import PageContainer from '$lib/components/PageContainer.svelte';

	// Fetch real tours from the database
	let toursQuery = $derived(createQuery({
		queryKey: ['demo-tours'],
		queryFn: async () => {
			const response = await fetch('/api/public/tours');
			if (!response.ok) throw new Error('Failed to fetch tours');
			const data = await response.json();
			return data.tours || [];
		}
	}));

	let allTours = $derived($toursQuery.data || []);
	let isLoading = $derived($toursQuery.isLoading);

	// Filter tours by pricing model for demo purposes
	let demoTours = $derived.by(() => {
		if (!allTours.length) return [];
		
		const participantCategoryTour = allTours.find((t: any) => t.pricingModel === 'participant_categories');
		const groupTierTour = allTours.find((t: any) => t.pricingModel === 'group_tiers');
		const perPersonTour = allTours.find((t: any) => t.pricingModel === 'per_person');
		
		return [
			participantCategoryTour,
			groupTierTour,
			perPersonTour
		].filter(Boolean);
	});

	// Fallback demo tour examples if no real tours exist
	const fallbackDemoTours = [
		{
			id: 'participant-categories',
			name: 'Walking Food Tour',
			description: 'Explore the best local cuisine with our expert guide',
			pricingModel: 'participant_categories',
			currency: 'EUR',
			qrCode: 'DEMO001',
			participantCategories: {
				categories: [
					{
						id: 'adult',
						label: 'Adult',
						description: 'Ages 13+',
						price: 45,
						minAge: 13,
						maxAge: null,
						sortOrder: 0,
						required: true
					},
					{
						id: 'child',
						label: 'Child',
						description: 'Ages 3-12',
						price: 25,
						minAge: 3,
						maxAge: 12,
						sortOrder: 1,
						required: false
					},
					{
						id: 'infant',
						label: 'Infant',
						description: 'Ages 0-2 (Free)',
						price: 0,
						minAge: 0,
						maxAge: 2,
						sortOrder: 2,
						required: false
					}
				]
			}
		},
		{
			id: 'group-tiers',
			name: 'Private City Tour',
			description: 'Personalized tour experience for your group',
			pricingModel: 'group_tiers',
			currency: 'EUR',
			qrCode: 'DEMO002',
			groupPricingTiers: {
				tiers: [
					{ minParticipants: 1, maxParticipants: 4, price: 120, label: 'Small Group (1-4)' },
					{ minParticipants: 5, maxParticipants: 8, price: 200, label: 'Medium Group (5-8)' },
					{ minParticipants: 9, maxParticipants: 15, price: 300, label: 'Large Group (9-15)' }
				]
			}
		},
		{
			id: 'per-person-simple',
			name: 'Museum Guided Tour',
			description: 'Discover art and history with our knowledgeable guide',
			pricingModel: 'per_person',
			currency: 'EUR',
			price: '35',
			qrCode: 'DEMO003'
		}
	];
</script>

<svelte:head>
	<title>Booking Flow Demo - Zaur Beta</title>
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
			<Calendar class="w-10 h-10 text-primary" />
			<div>
				<h1>Booking Flow Demo</h1>
				<p>Test different booking experiences for various pricing models</p>
			</div>
		</div>
	</div>

	<div class="info-card">
		<h2>What you're testing</h2>
		<p>
			Experience our complete booking flow with different pricing configurations. 
			Each demo tour showcases a different pricing model to help you understand 
			how customers will book your tours.
		</p>
		<div class="features-list">
			<div class="feature">
				<Users class="w-5 h-5 text-primary" />
				<span>Participant category selection (Adult/Child/Infant)</span>
			</div>
			<div class="feature">
				<Package class="w-5 h-5 text-primary" />
				<span>Group tier pricing</span>
			</div>
			<div class="feature">
				<DollarSign class="w-5 h-5 text-primary" />
				<span>Real-time price calculation</span>
			</div>
			<div class="feature">
				<Calendar class="w-5 h-5 text-primary" />
				<span>Time slot selection</span>
			</div>
		</div>
	</div>

	<div class="tours-section">
		<h2>Demo Tours</h2>
		<p class="section-description">Click on any tour to experience the booking flow</p>
		
		{#if isLoading}
			<div class="loading-state">
				<Loader2 class="w-8 h-8 animate-spin text-primary" />
				<p>Loading demo tours...</p>
			</div>
		{:else if demoTours.length === 0}
			<div class="empty-state">
				<p>No tours available for demo. Please create some tours first with different pricing models:</p>
				<ul>
					<li>Tours with participant categories (Adult/Child/Infant)</li>
					<li>Tours with group tier pricing</li>
					<li>Tours with simple per-person pricing</li>
				</ul>
				<button class="create-tour-button" onclick={() => goto('/tours/new')}>
					Create Your First Tour
				</button>
			</div>
		{:else}
			<div class="tour-grid">
				{#each demoTours as tour}
				<a 
					href="/book/{tour.qrCode}" 
					class="tour-card"
					target="_blank"
				>
					<div class="tour-header">
						<h3>{tour.name}</h3>
						<span class="pricing-badge">
							{#if tour.pricingModel === 'participant_categories'}
								Category Pricing
							{:else if tour.pricingModel === 'group_tiers'}
								Group Tiers
							{:else}
								Per Person
							{/if}
						</span>
					</div>
					
					<p class="tour-description">{tour.description}</p>
					
					<div class="tour-details">
						{#if tour.pricingModel === 'participant_categories'}
							<div class="detail">
								<span class="label">Adults:</span>
								<span class="value">€{tour.participantCategories?.categories[0]?.price}</span>
							</div>
							<div class="detail">
								<span class="label">Children:</span>
								<span class="value">€{tour.participantCategories?.categories[1]?.price}</span>
							</div>
						{:else if tour.pricingModel === 'group_tiers'}
							<div class="detail">
								<span class="label">Starting from:</span>
								<span class="value">€{tour.groupPricingTiers?.tiers[0]?.price}</span>
							</div>
							<div class="detail">
								<span class="label">Tiers:</span>
								<span class="value">{tour.groupPricingTiers?.tiers.length} options</span>
							</div>
						{:else}
							<div class="detail">
								<span class="label">Price:</span>
								<span class="value">€{tour.price} per person</span>
							</div>
						{/if}
					</div>
					
					<button class="try-button">
						Try Booking Flow →
					</button>
				</a>
				{/each}
			</div>
		{/if}
	</div>

	<div class="tips-section">
		<h3>Testing Tips</h3>
		<ul>
			<li>Try different participant combinations to see how prices update</li>
			<li>Test the flow on both desktop and mobile devices</li>
			<li>Pay attention to clarity of pricing information</li>
			<li>Note any confusing or unclear elements</li>
			<li>Share your feedback using the feedback widget</li>
		</ul>
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
		margin: 0 0 1rem 0;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.features-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.feature {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.tours-section {
		margin-bottom: 2rem;
	}

	.tours-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.section-description {
		margin: 0 0 1.5rem 0;
		color: var(--text-secondary);
	}

	.tour-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.tour-card {
		display: block;
		padding: 1.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.tour-card:hover {
		border-color: var(--color-primary-400);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.tour-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.tour-card h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.pricing-badge {
		padding: 0.25rem 0.75rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border: 1px solid var(--color-primary-300);
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.tour-description {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.tour-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.detail {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
	}

	.detail .label {
		color: var(--text-secondary);
	}

	.detail .value {
		font-weight: 600;
		color: var(--text-primary);
	}

	.try-button {
		width: 100%;
		padding: 0.75rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.try-button:hover {
		background: var(--color-primary-700);
	}

	.tips-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.tips-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.tips-section ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.tips-section li {
		margin-bottom: 0.5rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

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
		margin: 0 0 1rem 0;
		color: var(--text-secondary);
	}

	.empty-state ul {
		text-align: left;
		max-width: 400px;
		margin: 1rem auto;
		padding-left: 1.5rem;
	}

	.empty-state li {
		margin-bottom: 0.5rem;
		color: var(--text-secondary);
	}

	.create-tour-button {
		margin-top: 1.5rem;
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

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			text-align: center;
		}

		.tour-grid {
			grid-template-columns: 1fr;
		}

		.features-list {
			grid-template-columns: 1fr;
		}
	}
</style>

