<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Eye from 'lucide-svelte/icons/eye';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Users from 'lucide-svelte/icons/users';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Settings from 'lucide-svelte/icons/settings';
	
	let showPreview = $state(false);
	let isHovered = $state(false);
	let viewMode = $state('guide'); // 'guide' or 'customer'
	
	// Mock tour data for guide dashboard preview
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
			name: 'Barcelona by Night',
			status: 'draft',
			bookings: 0,
			revenue: 0,
			qrScans: 0,
			nextSlot: null
		}
	];
	
	onMount(() => {
		setTimeout(() => showPreview = true, 800);
	});
	
	function viewDemo() {
		goto('/demo');
	}
	
	function switchView(mode: 'guide' | 'customer') {
		viewMode = mode;
	}
</script>

{#if showPreview}
	<div class="demo-preview-container" in:fade={{ duration: 600 }}>
		<div class="demo-preview-card" 
			 class:hovered={isHovered}
			 onmouseenter={() => isHovered = true}
			 onmouseleave={() => isHovered = false}
			 onclick={viewDemo}
			 role="button"
			 tabindex="0"
			 onkeydown={(e) => e.key === 'Enter' && viewDemo()}>
			
			<div class="demo-badge">
				<Sparkles class="w-3 h-3" />
				<span>Guide Dashboard</span>
			</div>
			
			<!-- View Toggle -->
			<div class="view-toggle">
				<button 
					class="toggle-btn {viewMode === 'guide' ? 'active' : ''}"
					onclick={(e) => { e.stopPropagation(); switchView('guide'); }}
				>
					<Settings class="w-3 h-3" />
					Guide View
				</button>
				<button 
					class="toggle-btn {viewMode === 'customer' ? 'active' : ''}"
					onclick={(e) => { e.stopPropagation(); switchView('customer'); }}
				>
					<Eye class="w-3 h-3" />
					Customer View
				</button>
			</div>
			
			<div class="demo-preview-header">
				<h3 class="demo-title">
					{viewMode === 'guide' ? 'Your Tour Dashboard' : 'Customer Experience'}
				</h3>
				<p class="demo-subtitle">
					{viewMode === 'guide' 
						? 'Professional tour management interface' 
						: 'What customers see when they scan your QR'}
				</p>
			</div>
			
			{#if viewMode === 'guide'}
				<!-- Guide Dashboard View -->
				<div class="tours-preview">
					<div class="tours-header">
						<h4 class="tours-title">Your Tours</h4>
						<div class="total-revenue">€{mockTours.reduce((sum, tour) => sum + tour.revenue, 0)}</div>
					</div>
					
					<div class="tours-list">
						{#each mockTours as tour, index}
							<div class="tour-item" 
								 in:scale={{ duration: 300, delay: 200 + index * 100 }}
								 onclick={(e) => e.stopPropagation()}>
								<div class="tour-info">
									<div class="tour-name">{tour.name}</div>
									<div class="tour-status status-{tour.status}">
										{tour.status === 'active' ? '● Active' : '○ Draft'}
									</div>
								</div>
								<div class="tour-metrics">
									<div class="metric">
										<Calendar class="w-3 h-3" />
										{tour.nextSlot || 'No slots'}
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
				<!-- Customer View (simplified booking interface) -->
				<div class="customer-preview">
					<div class="booking-header">
						<h4 class="booking-title">Historic Walking Tour</h4>
						<div class="booking-rating">⭐ 4.9 • 2 hours</div>
					</div>
					
					<div class="booking-price">
						<span class="price">€25</span>
						<span class="price-label">per person</span>
					</div>
					
					<div class="time-slots-mini">
						<div class="slot active" onclick={(e) => e.stopPropagation()}>10:00</div>
						<div class="slot" onclick={(e) => e.stopPropagation()}>14:00</div>
						<div class="slot" onclick={(e) => e.stopPropagation()}>16:30</div>
					</div>
					
					<button class="book-now-btn" onclick={(e) => e.stopPropagation()}>
						<DollarSign class="w-4 h-4" />
						Book Instantly
					</button>
				</div>
			{/if}
			
			<div class="demo-cta">
				<button class="demo-button" onclick={(e) => { e.stopPropagation(); viewDemo(); }}>
					<Eye class="w-4 h-4" />
					View Full Demo
				</button>
			</div>
			
			{#if isHovered}
				<div class="demo-shine" in:fade={{ duration: 300 }}></div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.demo-preview-container {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
	}
	
	.demo-preview-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		max-width: 480px;
		width: 100%;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}
	
	.demo-preview-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-primary-300);
	}
	
	.demo-preview-card.hovered {
		background: linear-gradient(135deg, var(--bg-primary) 0%, var(--color-primary-50) 100%);
	}
	
	.demo-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}
	
	.demo-preview-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.demo-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.demo-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.view-toggle {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		padding: 0.25rem;
	}
	
	.toggle-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.toggle-btn.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}
	
	.tours-preview {
		margin-bottom: 1.5rem;
	}
	
	.tours-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.tours-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.total-revenue {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-success-600);
	}
	
	.tours-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.tour-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.875rem;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	
	.demo-preview-card:hover .tour-item {
		background: var(--bg-primary);
		border-color: var(--border-secondary);
	}
	
	.tour-item:hover {
		background: var(--bg-primary);
		border-color: var(--color-primary-300);
		box-shadow: var(--shadow-sm);
	}
	
	.tour-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	
	.tour-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.tour-status {
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.status-active {
		color: var(--color-success-600);
	}
	
	.status-draft {
		color: var(--text-tertiary);
	}
	
	.tour-metrics {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	
	.metric {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.metric.revenue {
		color: var(--color-success-600);
		font-weight: 500;
	}
	
	.customer-preview {
		margin-bottom: 1.5rem;
	}
	
	.booking-header {
		text-align: center;
		margin-bottom: 1rem;
	}
	
	.booking-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.booking-rating {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.booking-price {
		text-align: center;
		margin-bottom: 1rem;
	}
	
	.price {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary-600);
	}
	
	.price-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-left: 0.25rem;
	}
	
	.time-slots-mini {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		justify-content: center;
	}
	
	.slot {
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.slot:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-300);
	}
	
	.slot.active {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
		color: white;
	}
	
	.book-now-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 1rem;
	}
	
	.book-now-btn:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.demo-cta {
		text-align: center;
	}
	
	.demo-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		justify-content: center;
	}
	
	.demo-button:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.demo-shine {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
		animation: shine 1.5s ease-in-out;
	}
	
	@keyframes shine {
		0% { left: -100%; }
		100% { left: 100%; }
	}
	
	@media (max-width: 640px) {
		.demo-preview-card {
			margin: 0 1rem;
			padding: 1.25rem;
		}
		
		.demo-title {
			font-size: 1.125rem;
		}
		
		.toggle-btn {
			font-size: 0.6875rem;
			padding: 0.375rem;
		}
		
		.tour-item {
			padding: 0.75rem;
		}
		
		.tour-metrics {
			grid-template-columns: 1fr;
		}
		
		.price {
			font-size: 1.25rem;
		}
		
		.time-slots-mini {
			gap: 0.375rem;
		}
		
		.slot {
			padding: 0.375rem 0.5rem;
		}
	}
</style> 