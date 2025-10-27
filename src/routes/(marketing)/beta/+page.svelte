<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Users from 'lucide-svelte/icons/users';
	import Shield from 'lucide-svelte/icons/shield';
	import Zap from 'lucide-svelte/icons/zap';
	import Globe from 'lucide-svelte/icons/globe';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	
	// Benefits of the beta program
	const betaBenefits = [
		{
			icon: Zap,
			title: "Free Access",
			description: "Full platform access during the beta period with no subscription fees"
		},
		{
			icon: Shield,
			title: "Founding Member Status",
			description: "Permanent 50% discount on all future subscriptions"
		},
		{
			icon: MessageSquare,
			title: "Direct Influence",
			description: "Shape features through direct feedback and weekly beta calls"
		},
		{
			icon: Globe,
			title: "Priority Support",
			description: "Dedicated support channel and priority feature requests"
		}
	];
	
	// What we're looking for
	const idealBetaTester = [
		"Active tour guides running regular tours",
		"Comfortable providing feedback and suggestions",
		"Willing to test new features as they're released",
		"Open to joining weekly feedback sessions (optional)",
		"Representing diverse tour types and locations"
	];
	
	// Beta timeline - Updated for closed applications
	const timeline = [
		{
			phase: "Applications",
			date: "Closed",
			description: "We received applications from tour guides around the world",
			completed: true
		},
		{
			phase: "Selection Complete",
			date: "50 Beta Testers",
			description: "Selected 50 diverse tour guides from different locations",
			completed: true
		},
		{
			phase: "Beta Program",
			date: "Now - December 2025",
			description: "Working closely with beta testers to refine the platform",
			completed: false
		},
		{
			phase: "Public Launch",
			date: "Q1 2026",
			description: "Platform opens to everyone with beta tester feedback integrated",
			completed: false
		}
	];
</script>

<svelte:head>
	<title>Zaur Beta Program - Now In Progress</title>
	<meta name="description" content="Our beta program is underway with 50 selected tour guides actively testing and shaping Zaur. Join the early access waitlist to be notified when we launch publicly in Q1 2026." />
</svelte:head>

<div class="beta-page" in:fade={{ duration: 300 }}>
	<!-- Hero Section -->
	<section class="hero-section">
		<div class="container">
			<div class="hero-content">
				<div class="beta-badge-large">
					<FlaskConical class="w-6 h-6" />
					<span>Beta Program</span>
				</div>
				
				<h1 class="hero-title">
					Beta Program
					<span class="text-primary">In Progress</span>
				</h1>
				
				<p class="hero-description">
					We've selected 50 tour guides from around the world who are actively testing 
					and shaping Zaur. Applications are now closed as we work closely with our 
					beta testers to build the perfect booking platform.
				</p>
				
				<div class="hero-stats">
					<div class="stat-item">
						<Users class="w-5 h-5 text-primary" />
						<span><strong>50</strong> beta testers selected</span>
					</div>
					<div class="stat-item">
						<Globe class="w-5 h-5 text-primary" />
						<span><strong>Global</strong> participation</span>
					</div>
				<div class="stat-item">
					<Sparkles class="w-5 h-5 text-primary" />
					<span><strong>Q1 2026</strong> public launch</span>
				</div>
				</div>
				
				<div class="hero-actions">
					<div class="closed-notice">
					<CheckCircle class="w-5 h-5" />
					<span>Beta 1 completed - Beta 2 now open!</span>
				</div>
				<p class="action-note">
					Apply now to lock in your 20% lifetime discount
				</p>
				<button 
					class="button-secondary button--large"
					onclick={() => goto('/beta-2/apply')}
				>
					Apply for Beta 2
				</button>
			</div>
			</div>
		</div>
	</section>
	
	<!-- Benefits Section -->
	<section class="benefits-section">
		<div class="container">
			<h2 class="section-title">Beta Member Benefits</h2>
			<p class="section-description">
				As a beta tester, you'll get exclusive benefits that last beyond the testing period
			</p>
			
			<div class="benefits-grid">
				{#each betaBenefits as benefit}
					<div class="benefit-card">
						<div class="benefit-icon">
							<svelte:component this={benefit.icon} class="w-6 h-6" />
						</div>
						<h3 class="benefit-title">{benefit.title}</h3>
						<p class="benefit-description">{benefit.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
	
	<!-- Ideal Tester Section -->
	<section class="ideal-section">
		<div class="container">
			<div class="ideal-content">
				<div class="ideal-text">
					<h2 class="section-title">Who We're Looking For</h2>
					<p class="section-description">
						We want tour guides who are excited about improving how tours are booked and managed
					</p>
					
					<ul class="ideal-list">
						{#each idealBetaTester as item}
							<li class="ideal-item">
								<CheckCircle class="w-5 h-5 text-primary flex-shrink-0" />
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
				
				<div class="ideal-image">
					<div class="image-placeholder">
						<Users class="w-24 h-24 text-primary opacity-20" />
					</div>
				</div>
			</div>
		</div>
	</section>
	
	<!-- Timeline Section -->
	<section class="timeline-section">
		<div class="container">
			<h2 class="section-title">Beta Timeline</h2>
			<p class="section-description">
				Here's how the beta program will unfold
			</p>
			
			<div class="timeline-container">
				{#each timeline as item, i}
					<div class="timeline-item" class:completed={item.completed}>
						<div class="timeline-marker">
							<div class="marker-dot">
								{#if item.completed}
									<CheckCircle class="w-3 h-3" style="color: white;" />
								{/if}
							</div>
							{#if i < timeline.length - 1}
								<div class="marker-line"></div>
							{/if}
						</div>
						<div class="timeline-content">
							<div class="timeline-date">{item.date}</div>
							<h3 class="timeline-phase">{item.phase}</h3>
							<p class="timeline-description">{item.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
	
	<!-- CTA Section -->
	<section class="cta-section">
		<div class="container">
			<div class="cta-card">
			<h2 class="cta-title">Join Beta 2</h2>
			<p class="cta-description">
				Beta 1 was a success with 50 tour guides! We're now opening Beta 2 with 100 spots. 
				Apply now to lock in your 20% lifetime discount and 4 months free trial.
			</p>
			<button 
				class="button-primary button--large"
				onclick={() => goto('/beta-2/apply')}
			>
				Apply for Beta 2
			</button>
			<p class="cta-note">
				Limited spots - Apply before we launch publicly in Q1 2026
			</p>
			</div>
		</div>
	</section>
</div>

<style>
	.beta-page {
		min-height: 100vh;
	}
	
	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	
	/* Hero Section */
	.hero-section {
		padding: 4rem 0;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		text-align: center;
	}
	
	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.beta-badge-large {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.5rem;
		background: var(--primary);
		color: white;
		border-radius: 9999px;
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 2rem;
	}
	
	.hero-title {
		font-size: 3rem;
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}
	
	.hero-description {
		font-size: 1.25rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		line-height: 1.6;
	}
	
	.hero-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		color: var(--text-secondary);
	}
	
	.stat-item strong {
		color: var(--text-primary);
	}
	
	.hero-actions {
		margin-top: 2rem;
	}
	
	.action-note {
		margin-top: 1rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	.closed-notice {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--success-light);
		color: var(--success);
		border-radius: 0.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}
	
	/* Benefits Section */
	.benefits-section {
		padding: 5rem 0;
		background: var(--bg-primary);
	}
	
	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}
	
	.section-description {
		text-align: center;
		color: var(--text-secondary);
		font-size: 1.125rem;
		margin-bottom: 3rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.benefit-card {
		background: var(--bg-secondary);
		padding: 2rem;
		border-radius: 1rem;
		text-align: center;
		border: 1px solid var(--border-color);
		transition: all 0.3s ease;
	}
	
	.benefit-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}
	
	.benefit-icon {
		display: inline-flex;
		padding: 1rem;
		background: var(--primary-light);
		color: var(--primary);
		border-radius: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.benefit-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}
	
	.benefit-description {
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* Ideal Tester Section */
	.ideal-section {
		padding: 5rem 0;
		background: var(--bg-secondary);
	}
	
	.ideal-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.ideal-list {
		list-style: none;
		padding: 0;
		margin-top: 2rem;
	}
	
	.ideal-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.ideal-item span {
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.ideal-image {
		display: flex;
		justify-content: center;
	}
	
	.image-placeholder {
		width: 300px;
		height: 300px;
		background: var(--bg-tertiary);
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px dashed var(--border-color);
	}
	
	/* Timeline Section */
	.timeline-section {
		padding: 5rem 0;
		background: var(--bg-primary);
	}
	
	.timeline-container {
		max-width: 700px;
		margin: 0 auto;
	}
	
	.timeline-item {
		display: flex;
		gap: 2rem;
		margin-bottom: 3rem;
		position: relative;
	}
	
	.timeline-marker {
		position: relative;
		flex-shrink: 0;
	}
	
	.marker-dot {
		width: 16px;
		height: 16px;
		background: var(--border-color);
		border-radius: 50%;
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}
	
	.timeline-item.completed .marker-dot {
		background: var(--primary);
	}
	
	.marker-line {
		position: absolute;
		width: 2px;
		height: calc(100% + 3rem);
		background: var(--border-color);
		left: 7px;
		top: 16px;
		z-index: 1;
	}
	
	.timeline-date {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		margin-bottom: 0.25rem;
	}
	
	.timeline-phase {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.timeline-description {
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* CTA Section */
	.cta-section {
		padding: 5rem 0 8rem;
		background: var(--bg-secondary);
	}
	
	.cta-card {
		background: var(--bg-primary);
		padding: 3rem;
		border-radius: 1.5rem;
		text-align: center;
		border: 1px solid var(--border-color);
		max-width: 600px;
		margin: 0 auto;
	}
	
	.cta-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}
	
	.cta-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
	}
	
	.cta-note {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	/* Mobile styles */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2rem;
		}
		
		.hero-description {
			font-size: 1.125rem;
		}
		
		.hero-stats {
			gap: 1rem;
		}
		
		.benefits-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.ideal-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
		
		.ideal-image {
			display: none;
		}
		
		.section-title {
			font-size: 2rem;
		}
		
		.cta-card {
			padding: 2rem 1.5rem;
		}
	}
</style>