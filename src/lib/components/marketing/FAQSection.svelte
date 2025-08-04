<script lang="ts">
	import { fade } from 'svelte/transition';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	
	let openItems = $state<number[]>([]);
	
	const faqs = [
		{
			question: "What does being a beta member include?",
			answer: "Beta members get free access to all features during the beta period, 30% lifetime discount after launch, direct input on feature development, and priority support. You'll help shape the future of tour booking."
		},
		{
			question: "How long does the beta program last?",
			answer: "Our beta program runs until September 2025. Beta members get exclusive access to new features as we build them, plus early access to the full platform before public launch."
		},
		{
			question: "What happens to my beta pricing after launch?",
			answer: "Your 30% lifetime discount is permanently locked in. As a beta member, you'll pay 30% less than regular pricing forever, even as we add new features and expand the platform."
		},
		{
			question: "How does the application process work?",
			answer: "We review all applications and select beta members based on experience, location diversity, and commitment to providing feedback. Successful applicants receive access within 2-3 business days."
		},
		{
			question: "Is there any commitment required?",
			answer: "No contracts or long-term commitments. We simply ask that beta members provide feedback on features and help us improve the platform. Cancel anytime if it's not the right fit."
		}
	];
	
	function toggleItem(index: number) {
		if (openItems.includes(index)) {
			openItems = openItems.filter(i => i !== index);
		} else {
			openItems = [...openItems, index];
		}
	}
	
	function isOpen(index: number): boolean {
		return openItems.includes(index);
	}
</script>

<div class="text-center mb-12">
	<div class="professional-badge mb-6">
		<FlaskConical class="w-4 h-4" />
		<span>Beta Program FAQ</span>
	</div>
	<h2 class="marketing-heading marketing-heading-lg mb-4">
		Beta Program Questions
	</h2>
	<p class="text-lg max-w-xl mx-auto text-secondary">
		Everything you need to know about joining our beta program
	</p>
</div>

<div class="max-w-4xl mx-auto">
	<div class="faq-grid">
		{#each faqs as faq, index}
			<div class="card card--elevated faq-card" in:fade={{ duration: 400, delay: index * 100 }}>
				<button 
					class="faq-question"
					onclick={() => toggleItem(index)}
					aria-expanded={isOpen(index)}
				>
					<span class="card-title card-title--small faq-question-text">{faq.question}</span>
					<div class="faq-toggle {isOpen(index) ? 'open' : ''}">
						<ChevronDown class="w-4 h-4" />
					</div>
				</button>
				{#if isOpen(index)}
					<div class="faq-answer" in:fade={{ duration: 200 }}>
						<p class="card-description">{faq.answer}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	/* Professional badge */
	.professional-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--primary);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* FAQ Grid - prevents width expansion */
	.faq-grid {
		display: grid;
		gap: 1rem;
		width: 100%;
		max-width: 100%;
		min-width: 960px;
	}
	
	/* FAQ Cards - Enhanced with card system */
	.faq-card {
		/* Card system handles base styling, animations, and hover effects */
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}
	
	/* FAQ Questions */
	.faq-question {
		width: 100%;
		max-width: 100%;
		padding: 1.25rem 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 1rem;
		text-align: left;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}
	
	.faq-question-text {
		/* Card system handles typography */
		flex: 1;
		word-wrap: break-word;
		overflow-wrap: break-word;
		min-width: 0;
		max-width: 100%;
		margin: 0;
	}
	
	/* FAQ Toggle */
	.faq-toggle {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--primary);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.3s ease;
		color: white;
	}

	.faq-question:hover .faq-toggle {
		background: var(--primary);
		opacity: 0.8;
	}
	
	.faq-toggle.open {
		transform: rotate(180deg);
		background: var(--primary);
		opacity: 0.9;
	}
	
	/* FAQ Answers */
	.faq-answer {
		padding: 0 1.5rem 1.25rem 1.5rem;
		box-sizing: border-box;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		width: 100%;
		max-width: 100%;
	}

	.faq-answer p {
		/* Card system handles typography */
		margin: 0;
		flex: 1;
		word-wrap: break-word;
		overflow-wrap: break-word;
		min-width: 0;
		max-width: 100%;
	}

	/* Invisible spacer to match toggle button width */
	.faq-answer::after {
		content: '';
		width: 2rem;
		flex-shrink: 0;
	}

	/* Support Card - Card system handles base styling */

	.support-link {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: inherit;
		font-weight: 500;
		transition: opacity 0.2s ease;
	}

	.support-link:hover {
		opacity: 0.8;
	}

	/* Responsive Design - Card system handles most styling */
	@media (max-width: 768px) {
		.faq-question {
			padding: 1rem 1.25rem;
			gap: 0.75rem;
		}

		.faq-grid {
			min-width: 0;
		}

		.faq-toggle {
			width: 1.75rem;
			height: 1.75rem;
		}

		.faq-toggle :global(.w-4) {
			width: 0.875rem;
			height: 0.875rem;
		}
		
		.faq-answer {
			padding: 0 1.25rem 1rem 1.25rem;
		}

		.faq-answer::after {
			width: 1.75rem; /* Match smaller mobile toggle */
		}
	}
	
	@media (max-width: 480px) {
		.faq-question {
			padding: 0.875rem 1rem;
		}

		.faq-grid {
			min-width: 0;
		}
		
		.faq-answer {
			padding: 0 1rem 0.875rem 1rem;
		}
	}
</style> 