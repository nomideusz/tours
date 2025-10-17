<script lang="ts">
	import { currentUser } from '$lib/stores/auth.js';
	import Package from 'lucide-svelte/icons/package';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import PageContainer from '$lib/components/PageContainer.svelte';
	
	// Available feature demos
	const demos = [
		{
			id: 'pricing',
			title: 'Pricing Section',
			description: 'Test different pricing models and configurations',
			icon: DollarSign,
			href: '/demo/pricing',
			status: 'active',
			feedbackCount: 0
		},
		{
			id: 'booking-flow',
			title: 'Booking Flow',
			description: 'Experience different booking interfaces with various pricing models',
			icon: Calendar,
			href: '/demo/booking',
			status: 'active',
			feedbackCount: 0
		},
		{
			id: 'tour-display',
			title: 'Tour Display',
			description: 'Compare tour presentation layouts',
			icon: Package,
			href: '/demo/tour-display',
			status: 'coming-soon',
			feedbackCount: 0
		},
		{
			id: 'group-management',
			title: 'Group Management',
			description: 'Test participant tracking features',
			icon: Users,
			href: '/demo/groups',
			status: 'coming-soon',
			feedbackCount: 0
		}
	];
</script>

<svelte:head>
	<title>Feature Demos - Zaur Beta</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<PageContainer>
<div class="demo-hub">
	<div class="hub-header">
		<Sparkles class="w-12 h-12 text-primary" />
		<div class="header-text">
			<h1>Beta Feature Testing</h1>
			<p>Welcome {$currentUser?.name || 'Beta Tester'}! Help us build the best tour management platform.</p>
		</div>
	</div>
	
	<div class="intro-card">
		<h2>How it works</h2>
		<ol>
			<li>Choose a feature below to test different design options</li>
			<li>Try out each configuration and explore all functionality</li>
			<li>Share your feedback using the built-in feedback form</li>
			<li>Your input directly shapes what we build!</li>
		</ol>
		<p class="intro-note">
			<MessageSquare class="w-4 h-4" />
			All feedback is anonymous and helps us understand what works best for tour guides like you.
		</p>
	</div>
	
	<div class="demos-section">
		<h2>Available Feature Demos</h2>
		<div class="demo-grid">
			{#each demos as demo}
				<a 
					href={demo.href}
					class="demo-card {demo.status === 'coming-soon' ? 'disabled' : ''}"
					class:disabled={demo.status === 'coming-soon'}
				>
					<div class="card-header">
						<svelte:component this={demo.icon} class="demo-icon" />
						{#if demo.status === 'active'}
							<span class="status-badge active">Test Now</span>
						{:else}
							<span class="status-badge coming">Coming Soon</span>
						{/if}
					</div>
					<h3>{demo.title}</h3>
					<p>{demo.description}</p>
					{#if demo.feedbackCount > 0}
						<div class="feedback-count">
							<MessageSquare class="w-3 h-3" />
							{demo.feedbackCount} feedback submissions
						</div>
					{/if}
				</a>
			{/each}
		</div>
	</div>
	
	<div class="benefits-section">
		<h2>Why Your Feedback Matters</h2>
		<div class="benefits-grid">
			<div class="benefit">
				<h4>Shape the Product</h4>
				<p>Your feedback directly influences our development priorities and design decisions.</p>
			</div>
			<div class="benefit">
				<h4>Early Access</h4>
				<p>Be the first to try new features and get familiar with them before they launch.</p>
			</div>
			<div class="benefit">
				<h4>Beta Rewards</h4>
				<p>Active beta testers get special recognition and exclusive benefits when we launch.</p>
			</div>
		</div>
	</div>
	
	<div class="contact-section">
		<h3>Have ideas for features to test?</h3>
		<p>Use the feedback widget to suggest new features or improvements you'd like to see.</p>
		<button 
			class="feedback-prompt"
			onclick={() => {
				// This would trigger the FeedbackWidget
				const event = new CustomEvent('open-feedback', { detail: { type: 'feature' } });
				window.dispatchEvent(event);
			}}
		>
			<MessageSquare class="w-4 h-4" />
			Suggest a Feature
		</button>
	</div>
</div>
</PageContainer>

<style>
	.demo-hub {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
	}
	
	.hub-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.header-text h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.header-text p {
		margin: 0.25rem 0 0 0;
		font-size: 1.125rem;
		color: var(--text-secondary);
	}
	
	.intro-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 3rem;
	}
	
	.intro-card h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.intro-card ol {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}
	
	.intro-card li {
		margin-bottom: 0.5rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.intro-note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-style: italic;
	}
	
	.demos-section {
		margin-bottom: 3rem;
	}
	
	.demos-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.demo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}
	
	.demo-card {
		display: block;
		padding: 1.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		text-decoration: none;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}
	
	.demo-card:not(.disabled):hover {
		border-color: var(--color-primary-400);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.demo-card.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}
	
	:global(.demo-icon) {
		width: 2rem;
		height: 2rem;
		color: var(--color-primary-600);
	}
	
	.status-badge {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 1rem;
	}
	
	.status-badge.active {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-400);
	}
	
	.status-badge.coming {
		background: var(--bg-secondary);
		color: var(--text-tertiary);
		border: 1px solid var(--border-secondary);
	}
	
	.demo-card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.demo-card p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.feedback-count {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.benefits-section {
		margin-bottom: 3rem;
	}
	
	.benefits-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	
	.benefit {
		padding: 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
	}
	
	.benefit h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.benefit p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.contact-section {
		text-align: center;
		padding: 2rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
	}
	
	.contact-section h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.contact-section p {
		margin: 0 0 1rem 0;
		color: var(--text-secondary);
	}
	
	.feedback-prompt {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.feedback-prompt:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.hub-header {
			flex-direction: column;
			text-align: center;
		}
		
		.demo-grid {
			grid-template-columns: 1fr;
		}
	}
</style>