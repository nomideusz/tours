<script lang="ts">
	import { fade } from 'svelte/transition';
	import Shield from 'lucide-svelte/icons/shield';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import HeartHandshake from 'lucide-svelte/icons/heart-handshake';
	import Clock from 'lucide-svelte/icons/clock';
</script>

<section class="py-16" style="background: var(--bg-primary);" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="guarantee-container">
			<div class="text-center mb-12">
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
					style="background: var(--color-success-100); color: var(--color-success-700);">
					<Shield class="w-4 h-4" />
					<span class="text-sm font-medium">Our Promise</span>
				</div>
				<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
					Start Completely Free
				</h2>
				<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
					We're confident you'll love Zaur. That's why we offer a generous free plan with no time limits or hidden catches.
				</p>
			</div>
			
			<div class="guarantee-grid">
				<div class="guarantee-card">
					<div class="guarantee-icon">
						<RefreshCw class="w-6 h-6" />
					</div>
					<h3 class="guarantee-title">Free Forever Plan</h3>
					<p class="guarantee-description">
						Start with our Free Starter plan - no time limits, no credit card required. Upgrade only when you're ready to scale.
					</p>
				</div>
				
				<div class="guarantee-card">
					<div class="guarantee-icon">
						<HeartHandshake class="w-6 h-6" />
					</div>
					<h3 class="guarantee-title">Cancel Anytime</h3>
					<p class="guarantee-description">
						No contracts, no cancellation fees. If Zaur isn't right for you, cancel with one click.
					</p>
				</div>
				
				<div class="guarantee-card">
					<div class="guarantee-icon">
						<Clock class="w-6 h-6" />
					</div>
					<h3 class="guarantee-title">Keep Your Data</h3>
					<p class="guarantee-description">
						Export all your bookings and customer data anytime. Your business data always belongs to you.
					</p>
				</div>
			</div>
			
			<div class="guarantee-badge">
				<Shield class="w-8 h-8" style="color: var(--color-success-600);" />
				<div class="guarantee-badge-content">
					<h4 class="guarantee-badge-title">100% Satisfaction Promise</h4>
					<p class="guarantee-badge-text">
						If you're not happy with our platform, we'll work with you to make it right. Your success is our priority.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.guarantee-container {
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.guarantee-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}
	
	.guarantee-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem;
		text-align: center;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.guarantee-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--color-success-500);
		transform: scaleX(0);
		transition: transform 0.3s ease;
	}
	
	.guarantee-card:hover {
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}
	
	.guarantee-card:hover::before {
		transform: scaleX(1);
	}
	
	.guarantee-icon {
		width: 3.5rem;
		height: 3.5rem;
		background: var(--color-success-100);
		color: var(--color-success-600);
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
		transition: all 0.3s ease;
	}
	
	.guarantee-card:hover .guarantee-icon {
		transform: scale(1.1);
		background: var(--color-success-600);
		color: white;
	}
	
	.guarantee-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}
	
	.guarantee-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	.guarantee-badge {
		background: linear-gradient(135deg, var(--color-success-50), var(--color-success-100));
		border: 1px solid var(--color-success-200);
		border-radius: 1rem;
		padding: 2rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		max-width: 700px;
		margin: 0 auto;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}
	
	.guarantee-badge-content {
		flex: 1;
	}
	
	.guarantee-badge-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-success-800);
		margin-bottom: 0.5rem;
	}
	
	.guarantee-badge-text {
		font-size: 0.875rem;
		color: var(--color-success-700);
		line-height: 1.5;
	}
	
	@media (max-width: 768px) {
		.guarantee-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.guarantee-card {
			padding: 1.5rem;
		}
		
		.guarantee-icon {
			width: 3rem;
			height: 3rem;
			margin-bottom: 1rem;
		}
		
		.guarantee-title {
			font-size: 1.125rem;
		}
		
		.guarantee-badge {
			flex-direction: column;
			text-align: center;
			padding: 1.5rem;
		}
	}
</style> 