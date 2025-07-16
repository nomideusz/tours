<script lang="ts">
	import { fade } from 'svelte/transition';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	
	let openItems = $state<number[]>([]);
	
	const faqs = [
		{
			question: "When will Zaur be fully available?",
			answer: "We're planning our public launch in Q3 2025. Early access members get all features progressively and full access before public launch."
		},
		{
			question: "What happens to my early access pricing?",
			answer: "Your early access pricing is permanently locked in. As a founding member, your rate will never increase, even as we add features."
		},
		{
			question: "How does payment processing work?",
			answer: "Payments go directly to your bank account via Stripe. Customers pay instantly when booking, you receive funds in 2-7 business days. We never handle your money."
		},
		{
			question: "Are there contracts or cancellation fees?",
			answer: "No contracts or cancellation fees. Cancel anytime and retain access until the end of your current billing period."
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
		<HelpCircle class="w-4 h-4" />
		<span>Quick Questions</span>
	</div>
	<h2 class="marketing-heading marketing-heading-lg mb-4">
		Get Started Quickly
	</h2>
	<p class="text-lg max-w-xl mx-auto text-secondary">
		Common questions about getting started with Zaur
	</p>
</div>

<div class="max-w-4xl mx-auto">
	<div class="faq-grid">
		{#each faqs as faq, index}
			<div class="faq-item" in:fade={{ duration: 400, delay: index * 100 }}>
				<button 
					class="faq-question"
					onclick={() => toggleItem(index)}
					aria-expanded={isOpen(index)}
				>
					<span class="faq-question-text">{faq.question}</span>
					<div class="faq-toggle {isOpen(index) ? 'open' : ''}">
						<ChevronDown class="w-4 h-4" />
					</div>
				</button>
				{#if isOpen(index)}
					<div class="faq-answer" in:fade={{ duration: 200 }}>
						<p>{faq.answer}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
	
	<div class="support-cta">
		<p class="support-text">
			More questions? <button 
				class="support-link"
				onclick={() => window.location.href = '/contact'}
			>Contact our team</button>
		</p>
	</div>
</div>

<style>
	/* Professional badge */
	.professional-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--color-coral-500);
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
	
	/* FAQ Items - fixed width design */
	.faq-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}
	
	/* Coral accent line on hover */
	.faq-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.faq-item:hover::before {
		transform: scaleX(1);
	}
	
	.faq-item:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	/* Compact FAQ Questions */
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
	
	.faq-item:hover .faq-question {
		background: var(--bg-secondary);
	}

	.faq-item:hover .faq-answer {
		background: var(--bg-secondary);
	}
	
	.faq-question-text {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
		flex: 1;
		word-wrap: break-word;
		overflow-wrap: break-word;
		min-width: 0;
		max-width: 100%;
	}
	
	/* Compact FAQ Toggle */
	.faq-toggle {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-coral-500);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.3s ease;
		color: white;
	}

	.faq-question:hover .faq-toggle {
		background: var(--color-coral-600);
	}
	
	.faq-toggle.open {
		transform: rotate(180deg);
		background: var(--color-coral-600);
	}
	
	/* Compact FAQ Answers */
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
		color: var(--text-secondary);
		font-size: 0.9375rem;
		line-height: 1.6;
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

	/* Support CTA - minimal design */
	.support-cta {
		margin-top: 2rem;
		text-align: center;
	}

	.support-text {
		color: var(--text-secondary);
		font-size: 0.9375rem;
		margin: 0;
	}

	.support-link {
		color: var(--color-coral-600);
		text-decoration: underline;
		text-underline-offset: 2px;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: inherit;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.support-link:hover {
		color: var(--color-coral-700);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.faq-question {
			padding: 1rem 1.25rem;
			gap: 0.75rem;
		}

		.faq-grid {
			min-width: 0;
		}
		
		.faq-question-text {
			font-size: 0.9375rem;
		}

		.faq-toggle {
			width: 1.75rem;
			height: 1.75rem;
		}

		.faq-toggle .w-4 {
			width: 0.875rem;
			height: 0.875rem;
		}
		
		.faq-answer {
			padding: 0 1.25rem 1rem 1.25rem;
		}

		.faq-answer p {
			font-size: 0.875rem;
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