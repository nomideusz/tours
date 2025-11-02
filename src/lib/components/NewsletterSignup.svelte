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
		<form onsubmit={handleSubmit} class="newsletter-inline-form">
			<input
				type="email"
				bind:value={email}
				placeholder="your@email.com"
				class="inline-input"
				disabled={status === 'loading' || status === 'success'}
			/>
			<button 
				type="submit" 
				class="inline-button"
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
		{#if message}
			<div class={`inline-message ${status === 'error' ? 'inline-message--error' : 'inline-message--success'}`} in:fade>
				{#if status === 'error'}
					<AlertCircle class="w-4 h-4 flex-shrink-0" />
				{/if}
				{message}
			</div>
		{/if}
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
		max-width: 28rem;
		margin: 0 auto;
	}
	
	.newsletter-content {
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
	
	/* Inline Variant */
	.newsletter-inline-form {
		display: flex;
		gap: 0.5rem;
		max-width: 32rem;
		width: 100%;
		margin: 0 auto;
	}

	.inline-input {
		flex: 1;
		padding: 0.875rem 1.25rem;
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 1rem;
		transition: all 0.2s ease;
	}

	.inline-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-500-rgb), 0.1);
	}

	.inline-input::placeholder {
		color: var(--text-tertiary);
	}

	.inline-button {
		padding: 0.875rem 2rem;
		background: var(--color-primary-600);
		color: white;
		border: 2px solid var(--color-primary-600);
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 8rem;
	}

	.inline-button:hover:not(:disabled) {
		background: var(--color-primary-700);
		border-color: var(--color-primary-700);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(var(--color-primary-500-rgb), 0.3);
	}

	.inline-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.inline-message {
		margin-top: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		max-width: 32rem;
		margin-left: auto;
		margin-right: auto;
	}

	.inline-message--success {
		background: var(--color-success-50);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}

	.inline-message--error {
		background: var(--color-danger-50);
		color: var(--color-danger-700);
		border: 1px solid var(--color-danger-200);
	}

	/* Dark mode support for inline variant */
	:root[data-theme='dark'] .inline-message--success {
		background: rgba(var(--color-success-500-rgb), 0.1);
		border-color: rgba(var(--color-success-500-rgb), 0.3);
	}

	:root[data-theme='dark'] .inline-message--error {
		background: rgba(var(--color-danger-500-rgb), 0.1);
		border-color: rgba(var(--color-danger-500-rgb), 0.3);
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

		.newsletter-inline-form {
			flex-direction: column;
			max-width: 100%;
		}

		.inline-button {
			width: 100%;
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