<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Mail from 'lucide-svelte/icons/mail';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
</script>

<svelte:head>
	<title>Application Submitted - Zaur Beta Program</title>
	<meta name="description" content="Thank you for applying to the Zaur beta program. We'll review your application and get back to you soon." />
</svelte:head>

<div class="success-page" in:fade={{ duration: 300 }}>
	<div class="container">
		<div class="success-card">
			<!-- Success Icon -->
			<div class="success-icon">
				<div class="icon-circle">
					<CheckCircle class="w-12 h-12" />
				</div>
			</div>
			
			<!-- Success Message -->
			<h1 class="success-title">Thank You for Your Interest!</h1>
			<p class="success-description">
				We appreciate your interest in the Zaur beta program. We've already selected 
				our 50 beta testers and are working closely with them to build the perfect booking platform.
			</p>
			
			<!-- What's Next -->
			<div class="next-steps">
				<h2 class="steps-title">What happens next?</h2>
				
				<div class="step-item">
					<div class="step-icon">
						<FlaskConical class="w-5 h-5" />
					</div>
					<div class="step-content">
						<h3>Application Review</h3>
						<p>We'll carefully review all applications to select 50 tour guides who can provide diverse perspectives and valuable feedback.</p>
					</div>
				</div>
				
				<div class="step-item">
					<div class="step-icon">
						<Calendar class="w-5 h-5" />
					</div>
					<div class="step-content">
						<h3>Selection Complete</h3>
						<p>All 50 beta testers have been selected and are actively working with the platform. Thank you for your interest!</p>
					</div>
				</div>
				
				<div class="step-item">
					<div class="step-icon">
						<Mail class="w-5 h-5" />
					</div>
					<div class="step-content">
						<h3>Check Your Email</h3>
						<p>You should receive a confirmation email shortly. Make sure to check your spam folder if you don't see it.</p>
					</div>
				</div>
			</div>
			
			<!-- CTA -->
			<div class="cta-section">
				<button 
					class="button-primary button--large"
					onclick={() => goto('/early-access')}
				>
					Join Early Access Waitlist
					<ArrowRight class="w-5 h-5" />
				</button>
				
				<button 
					class="button-secondary button--large"
					onclick={() => goto('/')}
					style="margin-top: 1rem;"
				>
					Back to Home
				</button>
				
				<p class="cta-note">
					Have questions? Email us at <a href="mailto:beta@zaur.app">beta@zaur.app</a>
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.success-page {
		min-height: 100vh;
		padding: 4rem 0;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		display: flex;
		align-items: center;
	}
	
	.container {
		max-width: 700px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	
	.success-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 1.5rem;
		padding: 3rem;
		text-align: center;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
	}
	
	/* Success Icon */
	.success-icon {
		margin-bottom: 2rem;
	}
	
	.icon-circle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		background: var(--success-light);
		color: var(--success);
		border-radius: 50%;
		animation: scaleIn 0.5s ease;
	}
	
	@keyframes scaleIn {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	
	/* Success Message */
	.success-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.success-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 500px;
		margin: 0 auto 3rem;
	}
	
	/* Next Steps */
	.next-steps {
		text-align: left;
		margin-bottom: 3rem;
	}
	
	.steps-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.step-item {
		display: flex;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 0.75rem;
		margin-bottom: 1rem;
		transition: all 0.2s ease;
	}
	
	.step-item:hover {
		transform: translateX(4px);
		border-color: var(--primary);
	}
	
	.step-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--primary-light);
		color: var(--primary);
		border-radius: 0.5rem;
	}
	
	.step-content h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.step-content p {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* CTA Section */
	.cta-section {
		text-align: center;
	}
	
	.cta-section button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.cta-note {
		margin-top: 1.5rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	.cta-note a {
		color: var(--primary);
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.2s ease;
	}
	
	.cta-note a:hover {
		opacity: 0.8;
		text-decoration: underline;
	}
	
	/* Mobile */
	@media (max-width: 640px) {
		.success-page {
			padding: 2rem 0;
		}
		
		.success-card {
			padding: 2rem 1.5rem;
		}
		
		.success-title {
			font-size: 2rem;
		}
		
		.icon-circle {
			width: 64px;
			height: 64px;
		}
		
		.step-item {
			flex-direction: column;
			text-align: center;
			padding: 1rem;
		}
		
		.step-icon {
			margin: 0 auto;
		}
	}
	
	/* Dark mode adjustments */
	:global(.dark) .success-card {
		background: var(--bg-secondary);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
	}
	
	:global(.dark) .step-item {
		background: var(--bg-primary);
	}
</style>