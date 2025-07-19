<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	
	// Icons
	import Settings from 'lucide-svelte/icons/settings';
	import Eye from 'lucide-svelte/icons/eye';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Copy from 'lucide-svelte/icons/copy';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Download from 'lucide-svelte/icons/download';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	
	let showcaseMounted = $state(false);
	let viewMode = $state<'guide' | 'customer' | 'qr'>('qr');
	let qrCopied = $state(false);
	
	onMount(() => {
		setTimeout(() => showcaseMounted = true, 600);
	});
	
	function switchView(mode: 'guide' | 'customer' | 'qr') {
		viewMode = mode;
	}
	
	function copyQrCode() {
		navigator.clipboard.writeText(sampleExploreUrl);
		qrCopied = true;
		setTimeout(() => qrCopied = false, 2000);
	}
	
	// Mock data for realistic showcase
	const mockTours = [
		{
			name: 'Historic Walking Tour',
			status: 'active',
			bookings: 12,
			revenue: 300,
			qrScans: 45,
			nextSlot: '10:00'
		},
		{
			name: 'Food & Culture Experience',
			status: 'active', 
			bookings: 8,
			revenue: 400,
			qrScans: 23,
			nextSlot: '14:30'
		},
		{
			name: 'Photography Workshop',
			status: 'active',
			bookings: 6,
			revenue: 180,
			qrScans: 18,
			nextSlot: '16:00'
		}
	];
	
	const sampleExploreUrl = 'https://zaur.app/explore';
</script>

{#if showcaseMounted}
	<div class="platform-showcase" in:fade={{ duration: 600 }}>
		<div class="showcase-header">
			<h3 class="showcase-title">See Zaur in Action</h3>
			<p class="showcase-subtitle">
				Professional tour management meets seamless customer experience
			</p>
		</div>
		
		<div class="showcase-preview" 
			 role="region"
			 aria-label="Interactive platform showcase">
			
			<!-- View Toggle -->
			<div class="view-toggle">
				<button 
					class="toggle-btn {viewMode === 'qr' ? 'active' : ''}"
					onclick={() => switchView('qr')}
				>
					<QrCode class="w-3 h-3" />
					QR Code
				</button>
				<button 
					class="toggle-btn {viewMode === 'guide' ? 'active' : ''}"
					onclick={() => switchView('guide')}
				>
					<Settings class="w-3 h-3" />
					Dashboard
				</button>
				<button 
					class="toggle-btn {viewMode === 'customer' ? 'active' : ''}"
					onclick={() => switchView('customer')}
				>
					<Eye class="w-3 h-3" />
					Customer View
				</button>
			</div>
			
			{#if viewMode === 'qr'}
				<!-- QR Code Showcase -->
				<div class="qr-showcase" in:fade={{ duration: 300 }}>
					<div class="qr-header">
						<h4 class="qr-title">Discover Tours</h4>
						<div class="qr-badge">Browse Real Tours</div>
					</div>
					
					<div class="qr-content">
						<div class="qr-main">
							<!-- QR Code Display -->
							<div class="qr-code-container">
								<div 
									class="qr-code-wrapper"
									onclick={() => goto('/explore')}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											goto('/explore');
										}
									}}
									role="button"
									tabindex="0"
									aria-label="Explore real tours - click to browse available tours"
								>
									<img 
										src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sampleExploreUrl)}&qzone=2`}
										alt="Sample QR Code - Click to explore tours"
										class="qr-code-image"
									/>
								</div>
								<div class="qr-code-id">
									<p class="qr-id-text">EXPLORE</p>
								</div>
							</div>
							
							<!-- Tour Preview Card -->
							<div class="tour-preview-card">
								<div class="tour-preview-header">
									<div class="tour-preview-title">Historic Walking Tour</div>
									<div class="tour-preview-location">
										<MapPin class="w-3 h-3" />
										Barcelona, Spain
									</div>
								</div>
								
								<div class="tour-preview-details">
									<div class="tour-detail">
										<DollarSign class="w-4 h-4" />
										<span>€25</span>
									</div>
									<div class="tour-detail">
										<Clock class="w-4 h-4" />
										<span>2 hours</span>
									</div>
									<div class="tour-detail">
										<Users class="w-4 h-4" />
										<span>12 max</span>
									</div>
								</div>
								
								<div class="tour-preview-stats">
									<div class="preview-stat">
										<span class="stat-value">45</span>
										<span class="stat-label">QR Scans</span>
									</div>
									<div class="preview-stat">
										<span class="stat-value">12</span>
										<span class="stat-label">Bookings</span>
									</div>
									<div class="preview-stat">
										<span class="stat-value">27%</span>
										<span class="stat-label">Conversion</span>
									</div>
								</div>
							</div>
						</div>
						
						<!-- QR Actions -->
						<div class="qr-actions">
							<button onclick={copyQrCode} class="button-coral button--large button--gap button--full-width">
								{#if qrCopied}
									<CheckCircle class="w-4 h-4" />
									Link Copied!
								{:else}
									<Copy class="w-4 h-4" />
									Copy Explore Link
								{/if}
							</button>
							<div class="qr-action-grid">
								<button class="button-secondary button--gap">
									<ExternalLink class="w-4 h-4" />
									Preview
								</button>
								<button class="button-secondary button--gap">
									<Download class="w-4 h-4" />
									Download
								</button>
							</div>
						</div>
						
						<div class="qr-url">
							<p class="url-text">{sampleExploreUrl}</p>
						</div>
					</div>
				</div>
			{:else if viewMode === 'guide'}
				<!-- Guide Dashboard Preview -->
				<div class="guide-preview" in:fade={{ duration: 300 }}>
					<div class="preview-header">
						<h4 class="preview-title">Your Tour Dashboard</h4>
						<div class="total-revenue">€{mockTours.reduce((sum, tour) => sum + tour.revenue, 0)}</div>
					</div>
					
					<div class="tours-list">
						{#each mockTours as tour, index}
							<div class="tour-item" 
								 in:scale={{ duration: 300, delay: index * 100 }}>
								<div class="tour-info">
									<div class="tour-name">{tour.name}</div>
									<div class="tour-status status-{tour.status}">
										● Active
									</div>
								</div>
								<div class="tour-metrics">
									<div class="metric">
										<Calendar class="w-3 h-3" />
										Next: {tour.nextSlot}
									</div>
									<div class="metric">
										<Users class="w-3 h-3" />
										{tour.bookings} bookings
									</div>
									<div class="metric">
										<QrCode class="w-3 h-3" />
										{tour.qrScans} scans
									</div>
									<div class="metric revenue">
										<DollarSign class="w-3 h-3" />
										€{tour.revenue}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Customer Booking Preview -->
				<div class="customer-preview" in:fade={{ duration: 300 }}>
					<div class="booking-header">
						<h4 class="booking-title">Historic Walking Tour</h4>
						<div class="booking-rating">⭐ 4.9 • 2 hours • Barcelona</div>
					</div>
					
					<div class="booking-price">
						<span class="price">€25</span>
						<span class="price-label">per person</span>
					</div>
					
					<div class="time-slots-mini">
						<div class="slot active">10:00</div>
						<div class="slot">14:00</div>
						<div class="slot">16:30</div>
					</div>
					
					<button class="button-coral button--large button--gap button--full-width">
						<DollarSign class="w-4 h-4" />
						Book Instantly
					</button>
					
					<div class="booking-features">
						<div class="feature">✓ Instant confirmation</div>
						<div class="feature">✓ Secure payment</div>
						<div class="feature">✓ QR ticket</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Professional Platform Showcase - matches HeroSection */
	.platform-showcase {
		max-width: 1200px;
		margin: 0 auto;
		margin-top: 4rem;
	}
	
	.showcase-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.showcase-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.showcase-subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
	}
	
	/* Main showcase container - matches HeroSection trust cards */
	.showcase-preview {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: 2rem;
		box-shadow: var(--shadow-lg);
		transition: all var(--transition-base) ease;
		position: relative;
		overflow: hidden;
		min-height: 500px;
		min-width: 800px;
	}

	/* Subtle coral accent on hover - matches HeroSection */
	.showcase-preview::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.showcase-preview:hover::before {
		transform: scaleX(1);
	}
	
	.showcase-preview:hover {
		box-shadow: var(--shadow-xl);
		transform: translateY(-2px);
		border-color: var(--border-secondary);
	}
	
	/* View Toggle - professional design */
	.view-toggle {
		display: flex;
		gap: 0;
		justify-content: center;
		margin-bottom: 2rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 0.5rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.toggle-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		padding: 1rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base) ease;
		min-width: 140px;
		height: 44px;
		position: relative;
		overflow: hidden;
	}
	
	/* Coral accent on hover */
	.toggle-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-fast) ease;
	}
	
	.toggle-btn:hover:not(.active) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		transform: translateY(-1px);
	}
	
	.toggle-btn:hover:not(.active)::before {
		transform: scaleX(1);
	}
	
	.toggle-btn.active {
		background: var(--color-primary-100);
		color: var(--color-primary-900);
		border-color: var(--color-primary-200);
		box-shadow: var(--shadow-md);
	}

	.toggle-btn.active::before {
		transform: scaleX(1);
	}
	
	/* QR Showcase */
	.qr-showcase {
		min-height: 420px;
		width: 100%;
	}
	
	.qr-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.qr-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	/* QR Badge - matches HeroSection professional badge */
	.qr-badge {
		padding: 0.25rem 0.75rem;
		background: var(--bg-primary);
		color: var(--text-secondary);
		border: 1px solid var(--color-coral-500);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.qr-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.qr-main {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		align-items: start;
	}
	
	.qr-code-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	
	.qr-code-wrapper {
		background: white;
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border-primary);
		cursor: pointer;
		transition: all var(--transition-base) ease;
		position: relative;
		overflow: hidden;
	}

	/* Coral accent on hover - matches HeroSection */
	.qr-code-wrapper::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.qr-code-wrapper:hover::before {
		transform: scaleX(1);
	}

	.qr-code-wrapper:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-coral-500);
	}

	.qr-code-wrapper:focus {
		outline: 2px solid var(--color-coral-500);
		outline-offset: 2px;
	}
	
	.qr-code-image {
		width: 160px;
		height: 160px;
		object-fit: contain;
	}
	
	.qr-code-id {
		text-align: center;
		padding: 0.5rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
	}
	
	.qr-id-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	/* Tour Preview Card - matches HeroSection trust cards */
	.tour-preview-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all var(--transition-base) ease;
		position: relative;
		overflow: hidden;
	}

	/* Subtle coral accent on hover - matches HeroSection */
	.tour-preview-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.tour-preview-card:hover::before {
		transform: scaleX(1);
	}

	.tour-preview-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.tour-preview-header {
		text-align: center;
	}
	
	.tour-preview-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.tour-preview-location {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.tour-preview-details {
		display: flex;
		justify-content: space-around;
		padding: 1rem 0;
		border-top: 1px solid var(--border-primary);
		border-bottom: 1px solid var(--border-primary);
	}
	
	.tour-detail {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.tour-preview-stats {
		display: flex;
		justify-content: space-around;
		gap: 1rem;
		padding: 0 0.5rem;
	}
	
	.preview-stat {
		text-align: center;
	}
	
	.stat-value {
		display: block;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}
	
	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	
	.qr-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.qr-action-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	
	.qr-url {
		text-align: center;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		border: 1px dashed var(--border-secondary);
	}
	
	.url-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		word-break: break-all;
	}
	
	/* Guide Dashboard */
	.guide-preview {
		min-height: 420px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.preview-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	.total-revenue {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-success-600);
		background: var(--color-success-50);
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-success-200);
	}
	
	.tours-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	/* Tour Items - matches HeroSection trust cards */
	.tour-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all var(--transition-base) ease;
		position: relative;
		overflow: hidden;
	}

	/* Subtle coral accent on hover - matches HeroSection */
	.tour-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.tour-item:hover::before {
		transform: scaleX(1);
	}
	
	.tour-item:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-sm);
		transform: translateY(-2px);
	}
	
	.tour-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.tour-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1rem;
	}
	
	.tour-status {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.tour-status.status-active {
		color: var(--color-success-600);
	}
	
	.tour-metrics {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}
	
	.metric {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.metric.revenue {
		color: var(--color-success-600);
		font-weight: 600;
	}
	
	/* Customer View */
	.customer-preview {
		min-height: 420px;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.booking-header {
		text-align: center;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.booking-title {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}
	
	.booking-rating {
		font-size: 0.875rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}
	
	/* Price Card - matches HeroSection trust cards */
	.booking-price {
		text-align: center;
		padding: 1.5rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
		transition: all var(--transition-base) ease;
		position: relative;
		overflow: hidden;
	}

	/* Subtle coral accent on hover - matches HeroSection */
	.booking-price::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.booking-price:hover::before {
		transform: scaleX(1);
	}

	.booking-price:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-sm);
		transform: translateY(-2px);
	}
	
	.price {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		display: block;
		line-height: 1;
	}
	
	.price-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	
	/* Time Slots - matches HeroSection trust cards */
	.time-slots-mini {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		padding: 1rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
	}
	
	.slot {
		padding: 0.75rem 1.25rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base) ease;
	}
	
	.slot:hover {
		border-color: var(--color-coral-500);
		color: var(--text-primary);
	}
	
	.slot.active {
		background: var(--color-coral-500);
		color: white;
		border-color: var(--color-coral-500);
		box-shadow: var(--shadow-md);
	}
	
	/* Booking Features - matches HeroSection trust cards */
	.booking-features {
		display: flex;
		justify-content: space-around;
		padding: 1rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
	}
	
	.feature {
		font-size: 0.875rem;
		color: var(--color-success-600);
		font-weight: 500;
		text-align: center;
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.platform-showcase {
			margin-top: 2rem;
		}
		
		.showcase-preview {
			padding: 1.5rem;
			min-width: auto;
		}
		
		.view-toggle {
			flex-direction: column;
			gap: 0.25rem;
		}
		
		.toggle-btn {
			padding: 0.5rem;
			font-size: 0.8rem;
		}
		
		.qr-main {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.qr-code-image {
			width: 120px;
			height: 120px;
		}
		
		.qr-action-grid {
			grid-template-columns: 1fr;
		}
		
		.showcase-title {
			font-size: 1.25rem;
		}
		
		.showcase-subtitle {
			font-size: 0.9rem;
		}
		
		/* Mobile adjustments */
		.tour-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		
		.tour-metrics {
			flex-wrap: wrap;
			gap: 1rem;
		}
		
		.time-slots-mini {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.slot {
			text-align: center;
		}
		
		.booking-features {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.customer-preview {
			max-width: none;
		}
	}
</style>
