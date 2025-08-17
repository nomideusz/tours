<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import X from 'lucide-svelte/icons/x';
	import Send from 'lucide-svelte/icons/send';
	import Bug from 'lucide-svelte/icons/bug';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Heart from 'lucide-svelte/icons/heart';
	import { currentUser } from '$lib/stores/auth.js';

	let isOpen = $state(false);
	let feedbackType = $state<'bug' | 'feature' | 'general' | 'praise'>('general');
	let description = $state('');
	let urgency = $state(3);
	let isSubmitting = $state(false);
	let submitSuccess = $state(false);
	let submitError = $state<string | null>(null);

	// Get browser info for bug reports
	function getBrowserInfo() {
		if (!browser) return '';
		return `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`;
	}

	// Submit feedback
	async function submitFeedback() {
		if (!description.trim()) return;

		isSubmitting = true;
		submitError = null;
		submitSuccess = false;

		try {
			const response = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: feedbackType,
					description: description.trim(),
					urgency,
					pageUrl: $page.url.pathname,
					browserInfo: getBrowserInfo()
				})
			});

			if (!response.ok) {
				throw new Error('Failed to submit feedback');
			}

			submitSuccess = true;
			
			// Reset form after 2 seconds
			setTimeout(() => {
				isOpen = false;
				description = '';
				urgency = 3;
				feedbackType = 'general';
				submitSuccess = false;
			}, 2000);
		} catch (error) {
			submitError = 'Failed to submit feedback. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	// Get icon for feedback type
	function getTypeIcon(type: typeof feedbackType) {
		switch (type) {
			case 'bug': return Bug;
			case 'feature': return Lightbulb;
			case 'praise': return Heart;
			default: return MessageCircle;
		}
	}

	// Get color for feedback type
	function getTypeColor(type: typeof feedbackType) {
		switch (type) {
			case 'bug': return 'var(--color-danger-600)';
			case 'feature': return 'var(--color-info-600)';
			case 'praise': return 'var(--color-success-600)';
			default: return 'var(--text-primary)';
		}
	}
</script>

{#if browser && $currentUser}
	<!-- Feedback Button -->
	{#if !isOpen}
		<button
			onclick={() => isOpen = true}
			class="feedback-button"
			aria-label="Send feedback"
		>
			<MessageSquare class="h-5 w-5" />
			<span class="feedback-label">Feedback</span>
		</button>
	{/if}

	<!-- Feedback Form -->
	{#if isOpen}
		<div class="feedback-panel">
			<div class="feedback-header">
				<h3 class="feedback-title">Send Feedback</h3>
				<button
					onclick={() => isOpen = false}
					class="feedback-close"
					aria-label="Close feedback"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			{#if submitSuccess}
				<div class="feedback-success">
					<Heart class="h-12 w-12 mx-auto mb-3" style="color: var(--color-success-600);" />
					<p class="text-center font-medium" style="color: var(--text-primary);">
						Thank you for your feedback!
					</p>
					<p class="text-center text-sm mt-1" style="color: var(--text-secondary);">
						We'll review it and get back to you soon.
					</p>
				</div>
			{:else}
				<div class="feedback-body">
					<!-- Feedback Type -->
					<div class="feedback-types">
						<button
							onclick={() => feedbackType = 'bug'}
							class="feedback-type-btn {feedbackType === 'bug' ? 'active' : ''}"
							style="--type-color: var(--color-danger-600)"
						>
							<Bug class="h-4 w-4" />
							<span>Bug</span>
						</button>
						<button
							onclick={() => feedbackType = 'feature'}
							class="feedback-type-btn {feedbackType === 'feature' ? 'active' : ''}"
							style="--type-color: var(--color-info-600)"
						>
							<Lightbulb class="h-4 w-4" />
							<span>Feature</span>
						</button>
						<button
							onclick={() => feedbackType = 'general'}
							class="feedback-type-btn {feedbackType === 'general' ? 'active' : ''}"
							style="--type-color: var(--text-primary)"
						>
							<MessageCircle class="h-4 w-4" />
							<span>General</span>
						</button>
						<button
							onclick={() => feedbackType = 'praise'}
							class="feedback-type-btn {feedbackType === 'praise' ? 'active' : ''}"
							style="--type-color: var(--color-success-600)"
						>
							<Heart class="h-4 w-4" />
							<span>Praise</span>
						</button>
					</div>

					<!-- Description -->
					<div>
						<label for="feedback-description" class="feedback-label-text">
							{#if feedbackType === 'bug'}
								What went wrong?
							{:else if feedbackType === 'feature'}
								What would you like to see?
							{:else if feedbackType === 'praise'}
								What do you love?
							{:else}
								How can we improve?
							{/if}
						</label>
						<textarea
							id="feedback-description"
							bind:value={description}
							placeholder={feedbackType === 'bug' ? 'Describe the issue...' : 
										feedbackType === 'feature' ? 'Describe your idea...' :
										feedbackType === 'praise' ? 'Share what you love...' :
										'Share your thoughts...'}
							class="feedback-textarea"
							rows="4"
							maxlength="1000"
							disabled={isSubmitting}
						></textarea>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">
							{description.length}/1000 characters
						</p>
					</div>

					<!-- Urgency (only for bugs) -->
					{#if feedbackType === 'bug'}
						<div>
							<label for="feedback-urgency" class="feedback-label-text">
								How urgent is this?
							</label>
							<div class="urgency-scale">
								{#each [1, 2, 3, 4, 5] as level}
									<button
										onclick={() => urgency = level}
										class="urgency-btn {urgency === level ? 'active' : ''}"
										disabled={isSubmitting}
									>
										{level}
									</button>
								{/each}
							</div>
							<div class="flex justify-between text-xs mt-1" style="color: var(--text-tertiary);">
								<span>Low</span>
								<span>High</span>
							</div>
						</div>
					{/if}

					{#if submitError}
						<div class="feedback-error">
							{submitError}
						</div>
					{/if}

					<!-- Submit Button -->
					<button
						onclick={submitFeedback}
						disabled={!description.trim() || isSubmitting}
						class="feedback-submit"
					>
						{#if isSubmitting}
							<span class="animate-spin">⏳</span>
						{:else}
							<Send class="h-4 w-4" />
						{/if}
						{isSubmitting ? 'Sending...' : 'Send Feedback'}
					</button>

					<p class="text-xs text-center" style="color: var(--text-tertiary);">
						Beta User #{$currentUser.id.slice(0, 3)} • Your feedback shapes Zaur
					</p>
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.feedback-button {
		position: fixed;
		bottom: 104px; /* Above mobile nav (80px) + margin (24px) */
		right: 24px;
		z-index: 9998;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 24px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}

	/* Desktop positioning */
	@media (min-width: 1024px) {
		.feedback-button {
			bottom: 24px;
		}
		
		.feedback-panel {
			bottom: 24px;
		}
	}

	.feedback-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	.feedback-label {
		display: none;
	}

	@media (min-width: 640px) {
		.feedback-label {
			display: inline;
		}
	}

	.feedback-panel {
		position: fixed;
		bottom: 104px; /* Above mobile nav */
		right: 24px;
		z-index: 9999;
		width: 90%;
		max-width: 400px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.feedback-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 1px solid var(--border-primary);
	}

	.feedback-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.feedback-close {
		padding: 4px;
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.feedback-close:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.feedback-success {
		padding: 48px 24px;
	}

	.feedback-body {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.feedback-types {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.feedback-type-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		color: var(--text-secondary);
		font-size: 12px;
	}

	.feedback-type-btn:hover {
		border-color: var(--type-color);
		color: var(--type-color);
	}

	.feedback-type-btn.active {
		background: var(--bg-primary);
		border-color: var(--type-color);
		color: var(--type-color);
		box-shadow: 0 0 0 3px rgba(var(--type-color-rgb), 0.1);
	}

	.feedback-label-text {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 6px;
	}

	.feedback-textarea {
		width: 100%;
		padding: 10px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 14px;
		resize: none;
		transition: all 0.2s;
	}

	.feedback-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
	}

	.urgency-scale {
		display: flex;
		gap: 8px;
	}

	.urgency-btn {
		flex: 1;
		padding: 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.urgency-btn:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.urgency-btn.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.feedback-error {
		padding: 8px 12px;
		background: var(--color-danger-100);
		border: 1px solid var(--color-danger-200);
		border-radius: 6px;
		color: var(--color-danger-700);
		font-size: 14px;
	}

	.feedback-submit {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 12px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.feedback-submit:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.feedback-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.feedback-panel {
			right: 12px;
			bottom: 12px;
			left: 12px;
			width: auto;
			max-width: none;
		}
	}
</style>
