<script lang="ts">
	import { fade } from 'svelte/transition';
	import NewsletterSignup from '$lib/components/NewsletterSignup.svelte';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Users from 'lucide-svelte/icons/users';
	import Bell from 'lucide-svelte/icons/bell';
	import Star from 'lucide-svelte/icons/star';
</script>

<svelte:head>
	<title>Join Early Access - Zaur</title>
	<meta name="description" content="Join the Zaur early access waitlist and be among the first to know when we launch publicly in Q1 2026." />
</svelte:head>

<div class="early-access-page" in:fade={{ duration: 300 }}>
	<div class="container">
		<!-- Hero Section -->
		<section class="hero-section">
			<div class="badge">
				<Bell class="w-4 h-4" />
				<span>Early Access Waitlist</span>
			</div>
			
			<h1 class="title">
				Be Among the First to Try
				<span class="text-primary">Zaur</span>
			</h1>
			
			<p class="description">
				Our beta program is currently underway with 50 selected tour guides. 
				Join the waitlist to be notified when we launch publicly in Q1 2026.
			</p>
		</section>
		
		<!-- Benefits Grid -->
		<section class="benefits-section">
			<div class="benefits-grid">
				<div class="benefit-card">
					<div class="benefit-icon">
						<CheckCircle class="w-6 h-6" />
					</div>
					<h3 class="benefit-title">First Access</h3>
					<p class="benefit-description">
						Get priority access when we open to the public
					</p>
				</div>
				
				<div class="benefit-card">
					<div class="benefit-icon">
						<Star class="w-6 h-6" />
					</div>
					<h3 class="benefit-title">Launch Specials</h3>
					<p class="benefit-description">
						Exclusive offers and discounts for early members
					</p>
				</div>
				
				<div class="benefit-card">
					<div class="benefit-icon">
						<Users class="w-6 h-6" />
					</div>
					<h3 class="benefit-title">Early Community</h3>
					<p class="benefit-description">
						Join a community of innovative tour guides
					</p>
				</div>
			</div>
		</section>
		
		<!-- Newsletter Signup -->
		<section class="signup-section">
			<NewsletterSignup 
				variant="default"
				title="Join the Waitlist"
				description="Enter your email and we'll notify you as soon as Zaur is ready for you."
				buttonText="Join Waitlist"
				apiEndpoint="/api/early-access"
			/>
		</section>
		
		<!-- Info Section -->
		<section class="info-section">
			<div class="info-card">
				<h3 class="info-title">What's Happening Now?</h3>
				<div class="info-content">
					<div class="info-item">
						<CheckCircle class="w-5 h-5 text-primary" />
						<div>
							<strong>Beta Testing</strong>
							<p>50 tour guides are actively using and shaping Zaur</p>
						</div>
					</div>
					<div class="info-item">
						<CheckCircle class="w-5 h-5 text-primary" />
						<div>
							<strong>Building Features</strong>
							<p>We're continuously improving based on real-world feedback</p>
						</div>
					</div>
					<div class="info-item">
						<CheckCircle class="w-5 h-5 text-primary" />
						<div>
							<strong>Preparing Launch</strong>
							<p>Getting ready for public launch in Q1 2026</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.early-access-page {
		min-height: 100vh;
		padding: 2rem 0 4rem;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
	}
	
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	
	/* Hero Section */
	.hero-section {
		text-align: center;
		margin-bottom: 3rem;
		padding: 3rem 2rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}
	
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem;
		background: var(--primary-light);
		color: var(--primary);
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}
	
	.title {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}
	
	.description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 600px;
		margin: 0 auto;
	}
	
	/* Benefits Section */
	.benefits-section {
		margin-bottom: 3rem;
	}
	
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}
	
	.benefit-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		text-align: center;
		transition: all 0.3s ease;
	}
	
	.benefit-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}
	
	.benefit-icon {
		display: inline-flex;
		padding: 0.75rem;
		background: var(--primary-light);
		color: var(--primary);
		border-radius: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.benefit-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}
	
	.benefit-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* Signup Section */
	.signup-section {
		margin-bottom: 3rem;
	}
	
	/* Info Section */
	.info-section {
		margin-bottom: 2rem;
	}
	
	.info-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
	}
	
	.info-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.info-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	
	.info-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}
	
	.info-item strong {
		display: block;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.info-item p {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.hero-section {
			padding: 2rem 1.5rem;
		}
		
		.title {
			font-size: 2rem;
		}
		
		.description {
			font-size: 1rem;
		}
		
		.benefits-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		
		.info-card {
			padding: 1.5rem;
		}
	}
	
	@media (max-width: 640px) {
		.early-access-page {
			padding: 1.5rem 0 3rem;
		}
		
		.hero-section {
			padding: 2rem 1.25rem;
		}
		
		.title {
			font-size: 1.75rem;
		}
	}
</style>
