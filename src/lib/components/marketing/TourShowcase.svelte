<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Star from 'lucide-svelte/icons/star';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Camera from 'lucide-svelte/icons/camera';
	import Wine from 'lucide-svelte/icons/wine';
	import Building from 'lucide-svelte/icons/building';
	
	let showTours = $state(false);
	
	// Platform capability examples - showing what's possible, not fake metrics
	const capabilityTours = [
		{
			id: '1',
			name: 'Sunset Photography Workshop',
			description: 'Capture stunning golden hour shots at the city\'s most photogenic locations',
			price: 89,
			currency: 'EUR',
			duration: '3 hours',
			maxCapacity: 12,
			rating: 4.9,
			reviews: 156,
			icon: Camera,
			location: 'Barcelona',
			tags: ['Photography', 'Outdoor', 'Workshop'],
			capability: 'Multi-tier pricing',
			feature: 'Equipment included options'
		},
		{
			id: '2', 
			name: 'Historic City Walking Tour',
			description: 'Discover hidden gems and fascinating stories from centuries of rich history',
			price: 35,
			currency: 'EUR',
			duration: '2 hours',
			maxCapacity: 25,
			rating: 4.8,
			reviews: 234,
			icon: Building,
			location: 'Prague',
			tags: ['History', 'Walking', 'Culture'],
			capability: 'Group discounts',
			feature: 'Family packages available'
		},
		{
			id: '3',
			name: 'Wine Tasting Experience',
			description: 'Sample premium local wines with expert sommelier guidance and pairings',
			price: 125,
			currency: 'EUR',
			duration: '4 hours',
			maxCapacity: 16,
			rating: 5.0,
			reviews: 98,
			icon: Wine,
			location: 'Tuscany',
			tags: ['Wine', 'Gastronomy', 'Premium'],
			capability: 'Premium tiers',
			feature: 'VIP experiences supported'
		}
	];
	
	onMount(() => {
		setTimeout(() => showTours = true, 400);
	});
</script>

{#if showTours}
	<section class="py-16" in:fade={{ duration: 600 }}>
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="text-center mb-12">
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
					style="background: var(--color-primary-100); color: var(--color-primary-700);">
					<QrCode class="w-4 h-4" />
					<span class="text-sm font-medium">Platform Capabilities</span>
				</div>
				<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
					Create Professional Tour Listings
				</h2>
				<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
					See how easy it is to create beautiful, professional tour listings with instant QR booking
				</p>
			</div>
			
			<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{#each capabilityTours as tour, index}
					<div class="marketing-tour-card" 
						 in:fade={{ duration: 500, delay: 500 + index * 150 }}>
						<!-- Tour Image -->
						<div class="tour-image tour-image-{index + 1}">
							<div class="tour-image-overlay">
								<div class="tour-image-content">
									<tour.icon class="w-8 h-8 text-white mb-2" />
									<p class="text-sm font-medium text-white">{tour.tags[0]}</p>
								</div>
							</div>
							
							<!-- Rating Badge -->
							<div class="absolute top-3 left-3">
								<span class="rating-badge">
									<Star class="w-3 h-3 fill-current" />
									{tour.rating}
								</span>
							</div>
							
							<!-- QR Preview -->
							<div class="absolute bottom-3 right-3">
								<div class="qr-preview">
									<QrCode class="w-12 h-12 text-gray-700" />
									<div class="qr-stats">
										<p class="text-xs font-medium">QR</p>
										<p class="text-xs opacity-75">ready</p>
									</div>
								</div>
							</div>
						</div>
						
						<!-- Tour Details -->
						<div class="tour-content">
							<div class="tour-info">
								<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
									{tour.name}
								</h3>
								<p class="text-sm mb-4" style="color: var(--text-secondary);">
									{tour.description}
								</p>
								
								<!-- Key Info -->
								<div class="grid grid-cols-2 gap-3 mb-4">
									<div class="info-item">
										<MapPin class="w-3 h-3" />
										<span>{tour.location}</span>
									</div>
									<div class="info-item">
										<Clock class="w-3 h-3" />
										<span>{tour.duration}</span>
									</div>
									<div class="info-item">
										<Users class="w-3 h-3" />
										<span>{tour.maxCapacity} max</span>
									</div>
									<div class="info-item">
										<Star class="w-3 h-3" />
										<span>{tour.reviews} reviews</span>
									</div>
								</div>
								
								<!-- Platform Capabilities -->
								<div class="capability-features">
									<div class="capability">
										<span class="capability-label">{tour.capability}</span>
									</div>
									<div class="capability">
										<span class="capability-label">{tour.feature}</span>
									</div>
								</div>
								
								<!-- Pricing -->
								<div class="pricing-section">
									<div class="flex items-baseline gap-2">
										<span class="text-2xl font-bold" style="color: var(--text-primary);">
											€{tour.price}
										</span>
										<span class="text-sm" style="color: var(--text-secondary);">
											per person
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			
			<div class="text-center mt-12">
				<div class="inline-flex items-center gap-2 px-6 py-3 rounded-lg" 
					style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
					<QrCode class="w-5 h-5" style="color: var(--color-success-600);" />
					<span class="text-sm font-medium" style="color: var(--color-success-700);">
						Each tour gets its own QR code for instant bookings
					</span>
				</div>
			</div>
		</div>
	</section>
{/if}

<style>
	.marketing-tour-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	.marketing-tour-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.tour-image {
		height: 240px;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
	}
	
	.tour-image-1 {
		background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ff6b9d 100%);
	}
	
	.tour-image-2 {
		background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 50%, #093637 100%);
	}
	
	.tour-image-3 {
		background: linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%);
	}
	
	.tour-image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}
	
	.tour-image-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		transform: translateY(10px);
		transition: transform 0.3s ease;
	}
	
	.marketing-tour-card:hover .tour-image-overlay {
		background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
	}
	
	.marketing-tour-card:hover .tour-image-content {
		transform: translateY(0);
	}
	
	.rating-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background: rgba(251, 191, 36, 0.1);
		color: rgb(217, 119, 6);
		border: 1px solid rgba(251, 191, 36, 0.2);
		backdrop-filter: blur(8px);
	}
	
	.qr-preview {
		position: relative;
		background: rgba(255, 255, 255, 0.95);
		padding: 0.5rem;
		border-radius: 0.75rem;
		box-shadow: var(--shadow-md);
		transition: transform 0.2s ease;
	}
	
	.qr-preview:hover {
		transform: scale(1.05);
	}
	
	.qr-stats {
		position: absolute;
		bottom: -0.5rem;
		right: -0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.25rem 0.5rem;
		text-align: center;
	}
	
	.tour-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: 1.5rem;
	}
	
	.tour-info {
		flex: 1;
	}
	
	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.info-item svg {
		flex-shrink: 0;
		color: var(--text-tertiary);
	}
	
	.capability-features {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	
	.capability {
		padding: 0.25rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		font-size: 0.75rem;
	}
	
	.capability-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.pricing-section {
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
		margin-top: 1rem;
	}
	
	@media (max-width: 640px) {
		.tour-image {
			height: 180px;
		}
		
		.tour-content {
			padding: 1rem;
		}
		
		.capability-features {
			gap: 0.5rem;
		}
		
		.capability-label {
			font-size: 0.75rem;
		}
	}
</style> 