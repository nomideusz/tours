<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	
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
	let isHovered = $state(false);
	let qrCopied = $state(false);
	
	onMount(() => {
		setTimeout(() => showcaseMounted = true, 600);
	});
	
	function switchView(mode: 'guide' | 'customer' | 'qr') {
		viewMode = mode;
	}
	
	function copyQrCode() {
		const sampleUrl = 'https://zaur.app/book/TUR-BAR-A7X9';
		navigator.clipboard.writeText(sampleUrl);
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
	
	const sampleBookingUrl = 'https://zaur.app/book/TUR-BAR-A7X9';
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
			 class:hovered={isHovered}
			 onmouseenter={() => isHovered = true}
			 onmouseleave={() => isHovered = false}>
			
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
					Guide Dashboard
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
						<h4 class="qr-title">Your Tour QR Code</h4>
						<div class="qr-badge">Ready to Share</div>
					</div>
					
					<div class="qr-content">
						<div class="qr-main">
							<!-- QR Code Display -->
							<div class="qr-code-container">
								<div class="qr-code-wrapper">
									<img 
										src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sampleBookingUrl)}&qzone=2`}
										alt="Sample QR Code"
										class="qr-code-image"
									/>
								</div>
								<div class="qr-code-id">
									<p class="qr-id-text">TUR-BAR-A7X9</p>
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
							<button onclick={copyQrCode} class="qr-action-button primary">
								{#if qrCopied}
									<CheckCircle class="w-4 h-4" />
									Link Copied!
								{:else}
									<Copy class="w-4 h-4" />
									Copy Booking Link
								{/if}
							</button>
							<div class="qr-action-grid">
								<button class="qr-action-button secondary">
									<ExternalLink class="w-4 h-4" />
									Preview
								</button>
								<button class="qr-action-button secondary">
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
					
					<button class="book-now-btn">
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
			
			{#if isHovered}
				<div class="preview-shine" in:fade={{ duration: 300 }}></div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Platform Showcase Styles */
	.platform-showcase {
		max-width: 900px;
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
	
	.showcase-preview {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: var(--shadow-lg);
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.showcase-preview:hover {
		box-shadow: var(--shadow-xl);
		border-color: var(--border-secondary);
	}
	
	.showcase-preview.hovered {
		background: linear-gradient(135deg, var(--bg-primary) 0%, var(--color-primary-50) 100%);
	}
	
	/* View Toggle Styles */
	.view-toggle {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 2rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		padding: 0.5rem;
		max-width: 500px;
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
		border: none;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.toggle-btn.active {
		background: var(--color-primary-600);
		color: white;
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.toggle-btn:hover:not(.active) {
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	/* QR Showcase Styles */
	.qr-showcase {
		min-height: 400px;
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
	
	.qr-badge {
		padding: 0.25rem 0.75rem;
		background: var(--color-success-100);
		color: var(--color-success-700);
		border-radius: 9999px;
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
		border-radius: 0.75rem;
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border-primary);
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
		border-radius: 0.5rem;
	}
	
	.qr-id-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0;
	}
	
	.tour-preview-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
	
	.qr-action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}
	
	.qr-action-button.primary {
		background: var(--color-primary-600);
		color: white;
		box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
	}
	
	.qr-action-button.primary:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 6px 8px rgba(37, 99, 235, 0.3);
	}
	
	.qr-action-button.secondary {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
	}
	
	.qr-action-button.secondary:hover {
		background: var(--bg-primary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
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
		border-radius: 0.5rem;
		border: 1px dashed var(--border-secondary);
	}
	
	.url-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		word-break: break-all;
	}
	
	/* Guide Dashboard Styles */
	.guide-preview {
		min-height: 400px;
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
		border-radius: 0.5rem;
		border: 1px solid var(--color-success-200);
	}
	
	.tours-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.tour-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.2s ease;
	}
	
	.tour-item:hover {
		background: var(--bg-primary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
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
	
	/* Customer View Styles */
	.customer-preview {
		min-height: 400px;
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
	
	.booking-price {
		text-align: center;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
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
	
	.time-slots-mini {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}
	
	.slot {
		padding: 0.75rem 1.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.slot:hover {
		border-color: var(--color-primary-300);
		color: var(--text-primary);
	}
	
	.slot.active {
		background: var(--color-primary-600);
		color: white;
		border-color: var(--color-primary-600);
		box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
	}
	
	.book-now-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
	}
	
	.book-now-btn:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 6px 8px rgba(37, 99, 235, 0.3);
	}
	
	.booking-features {
		display: flex;
		justify-content: space-around;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}
	
	.feature {
		font-size: 0.875rem;
		color: var(--color-success-600);
		font-weight: 500;
		text-align: center;
	}
	
	/* Preview Shine Effect */
	.preview-shine {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		animation: shine 2s ease-in-out infinite;
	}
	
	@keyframes shine {
		0% { left: -100%; }
		100% { left: 100%; }
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.platform-showcase {
			margin-top: 2rem;
		}
		
		.showcase-preview {
			padding: 1.5rem;
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
		
		/* Mobile adjustments for guide/customer views */
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
	}
</style>
