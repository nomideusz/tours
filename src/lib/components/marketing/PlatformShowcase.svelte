<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { createPublicTourQuery } from '$lib/queries/public-queries.js';
	
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
	import House from 'lucide-svelte/icons/house';
	import Heart from 'lucide-svelte/icons/heart';
	
	let showcaseMounted = $state(false);
	let viewMode = $state<'guide' | 'customer' | 'qr'>('qr');
	let qrCopied = $state(false);
	
	onMount(() => {
		setTimeout(() => showcaseMounted = true, 600);
	});
	
	function copyQrCode() {
		navigator.clipboard.writeText(sampleBookingUrl);
		qrCopied = true;
		setTimeout(() => qrCopied = false, 2000);
	}
	
	function downloadQrCode() {
		const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(sampleBookingUrl)}&qzone=2`;
		const link = document.createElement('a');
		link.href = qrUrl;
		link.download = `tour-qr-${tourCode}.png`;
		link.click();
	}
	
	function previewTour() {
		window.open(sampleBookingUrl, '_blank');
	}
	
	// Helper to format next slot time
	function formatNextSlot(timeSlots: any[]) {
		if (!timeSlots || timeSlots.length === 0) return 'No slots';
		const nextSlot = new Date(timeSlots[0].startTime);
		return nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
	}
	
	const sampleBookingUrl = 'https://zaur.app/book/WYC-ZOCA2O';
	const tourCode = 'WYC-ZOCA2O';
	
	// Fetch real tour data
	const tourQuery = createPublicTourQuery(tourCode, { 
		refetchInterval: undefined,
		refetchOnWindowFocus: false 
	});
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
					class="button-toggle {viewMode === 'qr' ? 'active' : ''}"
					onclick={() => viewMode = 'qr'}
					aria-label="View QR Code preview"
				>
					<QrCode class="w-4 h-4" />
					QR Code
				</button>
				<button 
					class="button-toggle {viewMode === 'guide' ? 'active' : ''}"
					onclick={() => viewMode = 'guide'}
					aria-label="View Tour Guide Dashboard"
				>
					<House class="w-4 h-4" />
					Tour Guide
				</button>
				<button 
					class="button-toggle {viewMode === 'customer' ? 'active' : ''}"
					onclick={() => viewMode = 'customer'}
					aria-label="View Customer Booking Experience"
				>
					<Heart class="w-4 h-4" />
					Customer
				</button>
			</div>
			
			{#if viewMode === 'qr'}
				<!-- QR Code Showcase -->
				<div class="qr-showcase" in:fade={{ duration: 300 }}>
					<div class="qr-header">
						<h4 class="qr-title">Promote Your Tour</h4>
						<div class="qr-badge">Real Tour Example</div>
					</div>
					
					<div class="qr-content">
						<div class="qr-main">
							<!-- QR Code Display -->
							<div class="qr-code-container">
								<div 
									class="qr-code-wrapper"
									onclick={() => goto('/book/WYC-ZOCA2O')}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											goto('/book/WYC-ZOCA2O');
										}
									}}
									role="button"
									tabindex="0"
									aria-label="View tour booking page - click to see how customers book your tour"
								>
									<img 
										src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sampleBookingUrl)}&qzone=2`}
										alt="Sample QR Code - Click to book tour"
										class="qr-code-image"
									/>
								</div>
								<div class="qr-code-id">
									<p class="qr-id-text">{tourCode}</p>
								</div>
							</div>
							
							<!-- Tour Preview Card -->
							<div class="tour-preview-card">
								{#if $tourQuery.isLoading}
									<div class="tour-preview-loading">Loading tour data...</div>
								{:else if $tourQuery.error}
									<div class="tour-preview-error">Unable to load tour</div>
								{:else if $tourQuery.data}
									{@const tour = $tourQuery.data.tour}
									{@const currency = $tourQuery.data.tourOwner?.currency || 'EUR'}
									{@const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'PLN' ? 'zł' : currency}
									<div class="tour-preview-header">
										<div class="tour-preview-title">{tour.name}</div>
										<div class="tour-preview-location">
											<MapPin class="w-3 h-3" />
											{tour.location}
										</div>
									</div>
									
									<div class="tour-preview-details">
										<div class="tour-detail">
											<DollarSign class="w-4 h-4" />
											<span>{currency === 'PLN' ? `${tour.price} ${currencySymbol}` : `${currencySymbol}${tour.price}`}</span>
										</div>
										<div class="tour-detail">
											<Clock class="w-4 h-4" />
											<span>{tour.duration >= 60 ? `${(tour.duration / 60).toFixed(1)} hours` : `${tour.duration} min`}</span>
										</div>
										<div class="tour-detail">
											<Users class="w-4 h-4" />
											<span>6 max</span>
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
								{/if}
							</div>
						</div>
						
						<!-- QR Actions -->
						<div class="qr-actions">
							<button onclick={copyQrCode} class="button-primary button-large button-gap button--full-width">
								{#if qrCopied}
									<CheckCircle class="w-4 h-4" />
									Link Copied!
								{:else}
									<Copy class="w-4 h-4" />
									Copy Booking Link
								{/if}
							</button>
							<div class="qr-action-grid">
								<button onclick={previewTour} class="button-secondary button-gap">
									<ExternalLink class="w-4 h-4" />
									Preview
								</button>
								<button onclick={downloadQrCode} class="button-secondary button-gap">
									<Download class="w-4 h-4" />
									Download
								</button>
							</div>
						</div>
						
						<div class="qr-url">
							<p class="url-text">{sampleBookingUrl}</p>
						</div>
					</div>
				</div>
			{:else if viewMode === 'guide'}
				<!-- Guide Dashboard Preview -->
				<div class="guide-preview" in:fade={{ duration: 300 }}>
					{#if $tourQuery.isLoading}
						<div class="guide-loading">Loading dashboard...</div>
					{:else if $tourQuery.error}
						<div class="guide-error">Unable to load dashboard</div>
					{:else if $tourQuery.data}
						{@const tour = $tourQuery.data.tour}
						{@const currency = $tourQuery.data.tourOwner?.currency || 'EUR'}
						{@const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'PLN' ? 'zł' : currency}
						{@const timeSlots = $tourQuery.data.timeSlots || []}
						
						<div class="preview-header">
							<h4 class="preview-title">Your Tour Dashboard</h4>
							<div class="total-revenue">{currency === 'PLN' ? `${12 * tour.price} ${currencySymbol}` : `${currencySymbol}${12 * tour.price}`}</div>
						</div>
						
						<div class="tours-list">
							<!-- Show the real tour -->
							<div class="tour-item" in:scale={{ duration: 300 }}>
								<div class="tour-info">
									<div class="tour-name">{tour.name}</div>
									<div class="tour-status status-active">
										● Active
									</div>
								</div>
								<div class="tour-metrics">
									<div class="metric">
										<Calendar class="w-3 h-3" />
										Next: {formatNextSlot(timeSlots)}
									</div>
									<div class="metric">
										<Users class="w-3 h-3" />
										12 bookings
									</div>
									<div class="metric">
										<QrCode class="w-3 h-3" />
										45 scans
									</div>
									<div class="metric revenue">
										<DollarSign class="w-3 h-3" />
										{currency === 'PLN' ? `${12 * tour.price} ${currencySymbol}` : `${currencySymbol}${12 * tour.price}`}
									</div>
								</div>
							</div>
							
							<!-- Show example additional tours for realistic dashboard -->
							<div class="tour-item" in:scale={{ duration: 300, delay: 100 }}>
								<div class="tour-info">
									<div class="tour-name">Food & Culture Experience</div>
									<div class="tour-status status-active">
										● Active
									</div>
								</div>
								<div class="tour-metrics">
									<div class="metric">
										<Calendar class="w-3 h-3" />
										Next: 14:30
									</div>
									<div class="metric">
										<Users class="w-3 h-3" />
										8 bookings
									</div>
									<div class="metric">
										<QrCode class="w-3 h-3" />
										23 scans
									</div>
									<div class="metric revenue">
										<DollarSign class="w-3 h-3" />
										{currency === 'PLN' ? `400 ${currencySymbol}` : `${currencySymbol}400`}
									</div>
								</div>
							</div>
							
							<div class="tour-item" in:scale={{ duration: 300, delay: 200 }}>
								<div class="tour-info">
									<div class="tour-name">Photography Workshop</div>
									<div class="tour-status status-active">
										● Active
									</div>
								</div>
								<div class="tour-metrics">
									<div class="metric">
										<Calendar class="w-3 h-3" />
										Next: 16:00
									</div>
									<div class="metric">
										<Users class="w-3 h-3" />
										6 bookings
									</div>
									<div class="metric">
										<QrCode class="w-3 h-3" />
										18 scans
									</div>
									<div class="metric revenue">
										<DollarSign class="w-3 h-3" />
										{currency === 'PLN' ? `180 ${currencySymbol}` : `${currencySymbol}180`}
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Customer Booking Preview -->
				<div class="customer-preview" in:fade={{ duration: 300 }}>
					{#if $tourQuery.isLoading}
						<div class="booking-loading">Loading tour...</div>
					{:else if $tourQuery.error}
						<div class="booking-error">Unable to load tour</div>
					{:else if $tourQuery.data}
						{@const tour = $tourQuery.data.tour}
						{@const currency = $tourQuery.data.tourOwner?.currency || 'EUR'}
						{@const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'PLN' ? 'zł' : currency}
						<div class="booking-header">
							<h4 class="booking-title">{tour.name}</h4>
							<div class="booking-rating">⭐ 4.9 • {tour.duration >= 60 ? `${(tour.duration / 60).toFixed(1)} hours` : `${tour.duration} min`} • {tour.location}</div>
						</div>
						
						<div class="booking-price">
							<span class="price">{currency === 'PLN' ? `${tour.price} ${currencySymbol}` : `${currencySymbol}${tour.price}`}</span>
							<span class="price-label">per person</span>
						</div>
					
					<div class="time-slots-mini">
						<div class="slot active">10:00</div>
						<div class="slot">14:00</div>
						<div class="slot">16:30</div>
					</div>
					
					<button class="button-primary button-large button-gap button--full-width">
						<DollarSign class="w-4 h-4" />
						Book Instantly
					</button>
					
						<div class="booking-features">
							<div class="feature">✓ Instant confirmation</div>
							<div class="feature">✓ Secure payment</div>
							<div class="feature">✓ QR ticket</div>
						</div>
					{/if}
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
		border: 2px solid var(--border-primary); /* Updated to 2px */
		border-radius: var(--radius-lg);
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
		background: var(--color-primary-500);
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
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 2rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary); /* Updated to 2px */
		border-radius: 0.75rem;
		padding: 0.5rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	/* QR Showcase */
	.qr-showcase {
		min-height: 420px;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
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
		border: 2px solid var(--color-primary-500); /* Updated to 2px */
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.qr-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.qr-main {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 2rem;
		align-items: start;
		max-width: 700px;
		margin: 0 auto;
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
		border: 2px solid var(--border-primary); /* Updated to 2px */
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
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.qr-code-wrapper:hover::before {
		transform: scaleX(1);
	}

	.qr-code-wrapper:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-primary-500);
	}

	.qr-code-wrapper:focus {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}
	
	.qr-code-image {
		width: 180px;
		height: 180px;
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
		background: var(--color-primary-500);
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
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		line-height: 1.3;
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
		max-width: 700px;
		margin: 0 auto;
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
		max-width: 700px;
		margin: 0 auto;
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
		background: var(--color-primary-500);
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
		background: var(--color-primary-500);
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
		border-color: var(--color-primary-500);
		color: var(--text-primary);
	}
	
	.slot.active {
		background: var(--color-primary-500);
		color: white;
		border-color: var(--color-primary-500);
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
	
	/* Loading and Error States */
	.tour-preview-loading,
	.tour-preview-error,
	.booking-loading,
	.booking-error,
	.guide-loading,
	.guide-error {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.tour-preview-error,
	.booking-error,
	.guide-error {
		color: var(--color-danger-600);
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
			max-width: none;
		}
		
		.qr-code-image {
			width: 140px;
			height: 140px;
		}
		
		.qr-showcase,
		.qr-actions,
		.qr-url {
			max-width: none;
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
