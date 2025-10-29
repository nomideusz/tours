<script lang="ts">
	import { fade } from 'svelte/transition';
	import Mail from 'lucide-svelte/icons/mail';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Check from 'lucide-svelte/icons/check';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	
	// Umami tracking
	import { trackEvent, UMAMI_EVENTS } from '$lib/utils/umami-tracking.js';
	
	interface Props {
		variant?: 'default' | 'compact' | 'inline';
		title?: string;
		description?: string;
		buttonText?: string;
		class?: string;
		apiEndpoint?: string;
	}
	
	let { 
		variant = 'default',
		title = 'Stay Updated',
		description = 'Get notified about our launch and receive exclusive updates for tour guides.',
		buttonText = 'Subscribe',
		class: className = '',
		apiEndpoint = '/api/newsletter/subscribe'
	}: Props = $props();
	
	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!email?.trim()) {
			status = 'error';
			message = 'Please enter your email address';
			return;
		}
		
		// Track newsletter signup attempt
		trackEvent(UMAMI_EVENTS.NEWSLETTER_SIGNUP, {
			category: 'newsletter',
			email_domain: email.split('@')[1] || 'unknown',
			variant: variant,
			page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
		});
		
		status = 'loading';
		
		try {
			const response = await fetch(apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});
			
			const data = await response.json();
			
			if (response.ok) {
				if (data.success) {
					status = 'success';
					message = data.message;
					
					// Track successful newsletter signup
					trackEvent('newsletter_success', {
						category: 'newsletter',
						email_domain: email.split('@')[1] || 'unknown',
						variant: variant,
						page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
					});
					
					email = '';
					
					// Reset after 5 seconds
					setTimeout(() => {
						status = 'idle';
						message = '';
					}, 5000);
				} else {
					status = 'error';
					message = data.message || 'Something went wrong. Please try again.';
					
					// Track newsletter signup error
					trackEvent('newsletter_error', {
						category: 'newsletter',
						error_type: 'server_error',
						error_message: data.message || 'Unknown server error',
						variant: variant
					});
				}
			} else {
				status = 'error';
				message = data.message || 'Something went wrong. Please try again.';
				
				// Track newsletter signup error
				trackEvent('newsletter_error', {
					category: 'newsletter',
					error_type: 'server_error',
					error_message: data.message || 'Unknown server error',
					variant: variant
				});
			}
		} catch (error) {
			status = 'error';
			message = 'Unable to subscribe. Please try again later.';
			
			// Track network error
			trackEvent('newsletter_error', {
				category: 'newsletter',
				error_type: 'network_error',
				error_message: error instanceof Error ? error.message : 'Unknown network error',
				variant: variant
			});
		}
	}
</script>

<div class="newsletter-signup newsletter-signup--{variant} {className}">
	{#if variant === 'default'}
		<div class="newsletter-content">
			<div class="newsletter-header">
				<Mail class="newsletter-icon" />
				<h3 class="newsletter-title">{title}</h3>
			</div>
			<p class="newsletter-description">{description}</p>
			
			<form onsubmit={handleSubmit} class="newsletter-form">
				<div class="form-group--inline">
					<input
						type="text"
						bind:value={email}
						placeholder="Enter your email"
						class="form-input"
						disabled={status === 'loading' || status === 'success'}

					/>
					<button 
						type="submit" 
						class="button-primary button-small"
						disabled={status === 'loading' || status === 'success'}
					>
						{#if status === 'loading'}
							<Loader2 class="w-4 h-4 animate-spin" />
						{:else if status === 'success'}
							<Check class="w-4 h-4" />
						{:else}
							{buttonText}
						{/if}
					</button>
				</div>
				
				{#if message}
					<div class={`${status === 'error' ? 'form-error' : 'form-help'} flex items-center gap-2`} in:fade>
						{#if status === 'error'}
							<AlertCircle class="w-4 h-4 flex-shrink-0" />
						{/if}
						{message}
					</div>
				{/if}
			</form>
			
			<p class="newsletter-privacy">
				We respect your privacy. Unsubscribe at any time.
			</p>
		</div>
		
	{:else if variant === 'compact'}
		<div class="newsletter-compact">
			<div class="newsletter-compact-header">
				<Mail class="w-5 h-5" />
				<h4 class="newsletter-compact-title">{title}</h4>
			</div>
			<p class="newsletter-compact-description">{description}</p>
			
			<form onsubmit={handleSubmit} class="newsletter-form">
				<div class="form-group--inline">
					<input
					type="text"
					bind:value={email}
					placeholder="Your email"
					class="form-input"
					disabled={status === 'loading' || status === 'success'}

				/>
				</div>
				<button 
					type="submit" 
					class="button-primary button-small"
					disabled={status === 'loading' || status === 'success'}
				>
					{#if status === 'loading'}
						<Loader2 class="w-4 h-4 animate-spin" />
					{:else if status === 'success'}
						<Check class="w-4 h-4" />
					{:else}
						{buttonText}
					{/if}
				</button>
				
				{#if message}
					<div class={`${status === 'error' ? 'form-error' : 'form-help'} flex items-center gap-2`} in:fade>
						{#if status === 'error'}
							<AlertCircle class="w-4 h-4 flex-shrink-0" />
						{/if}
						{message}
					</div>
				{/if}
			</form>
		</div>
		
	{:else if variant === 'inline'}
		<form onsubmit={handleSubmit} class="form-group--inline">
			<input
				type="text"
				bind:value={email}
				placeholder="Enter your email for updates"
				class="form-input"
				disabled={status === 'loading' || status === 'success'}

			/>
			<button 
				type="submit" 
				class="button-primary button-small"
				disabled={status === 'loading' || status === 'success'}
			>
				{#if status === 'loading'}
					<Loader2 class="w-4 h-4 animate-spin" />
				{:else if status === 'success'}
					<Check class="w-4 h-4" />
				{:else}
					Subscribe
				{/if}
			</button>
		</form>
	{/if}
</div>

<style>
	:global(.form-group--inline > .form-input) {
		height: 2.25rem;
	}

	/* Base Newsletter Signup */
	.newsletter-signup {
		width: 100%;
	}
	
	/* Default Variant - Card Style */
	.newsletter-signup--default {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		box-shadow: var(--shadow-sm);
	}
	
	.newsletter-content {
		max-width: 28rem;
		margin: 0 auto;
		text-align: center;
	}
	
	.newsletter-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.newsletter-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--primary);
	}
	
	.newsletter-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.newsletter-description {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}
	
	/* Form Styles */
	.newsletter-form {
		margin-bottom: 0.75rem;
	}
	

	

	

	

	
	.newsletter-privacy {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin: 0;
	}
	
	/* Compact Variant */
	.newsletter-signup--compact {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}
	
	.newsletter-compact-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		color: var(--primary);
	}
	
	.newsletter-compact-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.newsletter-compact-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		line-height: 1.5;
	}
	
	.newsletter-compact .newsletter-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	/* Mobile Responsive */
	@media (max-width: 640px) {
		.newsletter-signup--default {
			padding: 1.5rem;
		}
		
		.newsletter-title {
			font-size: 1.25rem;
		}
		
		.newsletter-description {
			font-size: 0.875rem;
		}
	}
	
	/* Animation for spinner */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>