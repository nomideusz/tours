<script lang="ts">
	import { consentStore } from '$lib/stores/consent.js';
	import { fade, fly } from 'svelte/transition';

	let consent = $state<'pending' | 'accepted' | 'rejected'>('pending');
	
	$effect(() => {
		const unsubscribe = consentStore.subscribe(value => {
			consent = value;
		});
		
		return () => unsubscribe();
	});

	function handleAccept() {
		consentStore.accept();
	}

	function handleReject() {
		consentStore.reject();
	}

	let showBanner = $derived(consent === 'pending');
</script>

{#if showBanner}
	<div 
		class="cookie-banner"
		transition:fly={{ y: 50, duration: 300 }}
	>
		<div class="cookie-content">
			<p class="cookie-text">
				We use privacy-friendly analytics to improve your experience. No personal data is collected.
				<a href="/privacy" class="cookie-link">Learn more</a>
			</p>
			<div class="cookie-actions">
				<button 
					class="button-text button--small"
					onclick={handleReject}
					type="button"
				>
					Reject
				</button>
				<button 
					class="button-primary button--small"
					onclick={handleAccept}
					type="button"
				>
					Accept
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	.cookie-banner {
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		right: 1rem;
		z-index: 9999;
		max-width: 500px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 1rem;
	}

	@media (min-width: 640px) {
		.cookie-banner {
			left: 1.5rem;
			right: auto;
			bottom: 1.5rem;
			max-width: 420px;
		}
	}

	.cookie-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.cookie-text {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary);
		margin: 0;
	}

	.cookie-link {
		color: var(--color-primary-600);
		text-decoration: underline;
		text-underline-offset: 2px;
		transition: color 0.2s ease;
	}

	.cookie-link:hover {
		color: var(--color-primary-700);
	}

	.cookie-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	/* Dark mode adjustments */
	@media (prefers-color-scheme: dark) {
		.cookie-banner {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		}
	}

	:global(html[data-theme="dark"]) .cookie-banner {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
</style>

