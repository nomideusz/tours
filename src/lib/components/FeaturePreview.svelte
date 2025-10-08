<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Star from 'lucide-svelte/icons/star';
	import Info from 'lucide-svelte/icons/info';
	import Check from 'lucide-svelte/icons/check';
	
	interface Props {
		featureId: string;
		featureName: string;
		version: string;
		description?: string;
		onFeedback?: (feedback: FeatureFeedback) => void;
	}
	
	interface FeatureFeedback {
		featureId: string;
		version: string;
		rating: number | null;
		usability: number | null;
		comment: string;
		improvements: string[];
		wouldUse: boolean;
	}
	
	let { 
		featureId,
		featureName,
		version,
		description,
		onFeedback = () => {}
	}: Props = $props();
	
	let showFeedback = $state(false);
	let rating = $state<number | null>(null); // 1-5 stars
	let usability = $state<number | null>(null); // 1-5 ease of use
	let comment = $state('');
	let improvements = $state<string[]>([]);
	let wouldUse = $state(false);
	let isSubmitting = $state(false);
	let submitted = $state(false);
	
	const improvementOptions = [
		'Simpler interface',
		'More options',
		'Better visual design',
		'Clearer labels',
		'Better mobile experience',
		'Faster workflow',
		'More intuitive',
		'Add documentation'
	];
	
	const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
	const usabilityLabels = ['Very Difficult', 'Difficult', 'Okay', 'Easy', 'Very Easy'];
	
	function toggleImprovement(improvement: string) {
		if (improvements.includes(improvement)) {
			improvements = improvements.filter(i => i !== improvement);
		} else {
			improvements = [...improvements, improvement];
		}
	}
	
	async function submitFeedback() {
		if (!rating) return;
		
		isSubmitting = true;
		
		const feedback: FeatureFeedback = {
			featureId,
			version,
			rating,
			usability,
			comment,
			improvements,
			wouldUse
		};
		
		try {
			// Submit to API
			const response = await fetch('/api/feature-feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...feedback,
					pageUrl: $page.url.pathname,
					userAgent: browser ? navigator.userAgent : ''
				})
			});
			
			if (!response.ok) {
				throw new Error('Failed to submit feedback');
			}
			
			// Call parent callback
			onFeedback(feedback);
			
			submitted = true;
			
			// Reset after delay
			setTimeout(() => {
				showFeedback = false;
				rating = null;
				usability = null;
				comment = '';
				improvements = [];
				wouldUse = false;
				submitted = false;
			}, 2500);
			
		} catch (error) {
			console.error('Error submitting feature feedback:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if browser}
	<div class="feature-preview">
		<div class="preview-header">
			<div class="header-content">
				<Info class="info-icon" />
				<div class="header-text">
					<h4>Beta Preview: {featureName}</h4>
					<p>Version {version} • Your feedback shapes this feature</p>
				</div>
			</div>
			{#if !showFeedback && !submitted}
				<button
					onclick={() => showFeedback = true}
					class="feedback-btn"
				>
					<MessageSquare class="w-4 h-4" />
					Give Feedback
				</button>
			{/if}
		</div>
		
		{#if description}
			<p class="preview-description">{description}</p>
		{/if}
		
		{#if showFeedback && !submitted}
			<div class="feedback-form">
				<!-- Overall Rating -->
				<div class="rating-section">
					<p class="question">How would you rate this design?</p>
					<div class="star-rating">
						{#each [1, 2, 3, 4, 5] as star}
							<button
								type="button"
								onclick={() => rating = star}
								class="star-btn"
								class:active={rating !== null && star <= rating}
								aria-label="{star} stars"
							>
								<Star class="w-6 h-6" />
							</button>
						{/each}
					</div>
					{#if rating}
						<span class="rating-label">{ratingLabels[rating - 1]}</span>
					{/if}
				</div>
				
				{#if rating}
					<!-- Usability Rating -->
					<div class="usability-section">
						<p class="question">How easy is this to use?</p>
						<div class="usability-scale">
							{#each [1, 2, 3, 4, 5] as level}
								<button
									type="button"
									onclick={() => usability = level}
									class="scale-btn"
									class:active={usability === level}
								>
									{level}
								</button>
							{/each}
						</div>
						{#if usability}
							<span class="usability-label">{usabilityLabels[usability - 1]}</span>
						{/if}
					</div>
					
					<!-- Improvements -->
					<div class="improvements-section">
						<p class="question">What could be improved? (select all that apply)</p>
						<div class="improvement-chips">
							{#each improvementOptions as option}
								<button
									type="button"
									onclick={() => toggleImprovement(option)}
									class="chip"
									class:selected={improvements.includes(option)}
								>
									{#if improvements.includes(option)}
										<Check class="w-3 h-3" />
									{/if}
									{option}
								</button>
							{/each}
						</div>
					</div>
					
					<!-- Comment -->
					<div class="comment-section">
						<label for="feature-comment" class="question">
							Additional thoughts? (optional)
						</label>
						<textarea
							id="feature-comment"
							bind:value={comment}
							placeholder="What did you like? What confused you? Any suggestions?"
							rows="3"
							class="comment-input"
						></textarea>
					</div>
					
					<!-- Would Use -->
					<div class="usage-section">
						<label class="usage-checkbox">
							<input
								type="checkbox"
								bind:checked={wouldUse}
							/>
							<span>I would use this feature in my tours</span>
						</label>
					</div>
					
					<!-- Submit Button -->
					<button
						type="button"
						onclick={submitFeedback}
						disabled={!rating || isSubmitting}
						class="submit-btn"
					>
						{isSubmitting ? 'Submitting...' : 'Submit Feedback'}
					</button>
				{/if}
			</div>
		{/if}
		
		{#if submitted}
			<div class="success-message">
				<Check class="w-5 h-5" />
				Thank you! Your feedback helps us build better features.
			</div>
		{/if}
	</div>
{/if}

<style>
	.feature-preview {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}
	
	.header-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		flex: 1;
	}
	
	:global(.info-icon) {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-info-600);
		margin-top: 0.125rem;
		flex-shrink: 0;
	}
	
	.header-text h4 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.header-text p {
		margin: 0.25rem 0 0 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.feedback-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border: 1px solid var(--color-primary-400);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	
	.feedback-btn:hover {
		background: var(--color-primary-200);
		transform: translateY(-1px);
	}
	
	.preview-description {
		margin: 0.75rem 0 0 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.feedback-form {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	
	.question {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	/* Star Rating */
	.star-rating {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	.star-btn {
		padding: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--border-secondary);
		transition: all 0.15s ease;
	}
	
	.star-btn:hover {
		color: var(--color-warning-400);
		transform: scale(1.1);
	}
	
	.star-btn.active {
		color: var(--color-warning-500);
	}
	
	.rating-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-warning-600);
	}
	
	/* Usability Scale */
	.usability-scale {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	.scale-btn {
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.scale-btn:hover {
		border-color: var(--color-primary-400);
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		transform: translateY(-2px);
	}
	
	.scale-btn.active {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
		color: white;
	}
	
	.usability-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-primary-600);
	}
	
	/* Improvement Chips */
	.improvement-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 1rem;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.chip:hover {
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.chip.selected {
		background: var(--color-primary-100);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
	}
	
	/* Comment Input */
	.comment-input {
		width: 100%;
		padding: 0.625rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		resize: vertical;
		min-height: 4rem;
		font-family: inherit;
	}
	
	.comment-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.comment-input::placeholder {
		color: var(--text-tertiary);
	}
	
	/* Usage Checkbox */
	.usage-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--text-primary);
	}
	
	.usage-checkbox input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: var(--color-primary-600);
	}
	
	/* Submit Button */
	.submit-btn {
		align-self: flex-start;
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
	
	.submit-btn:hover:not(:disabled) {
		background: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	/* Success Message */
	.success-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--color-success-100);
		border: 1px solid var(--color-success-400);
		border-radius: 0.5rem;
		color: var(--color-success-700);
		font-size: 0.875rem;
		font-weight: 500;
		animation: fadeSlideIn 0.3s ease-out;
	}
	
	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.preview-header {
			flex-direction: column;
		}
		
		.feedback-btn {
			align-self: flex-start;
		}
		
		.star-rating {
			gap: 0.375rem;
		}
		
		.usability-scale {
			gap: 0.375rem;
		}
		
		.scale-btn {
			width: 2.5rem;
			height: 2.5rem;
			font-size: 0.875rem;
		}
		
		.submit-btn {
			width: 100%;
		}
	}
</style>