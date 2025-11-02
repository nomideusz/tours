<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	
	// Umami tracking
	import { trackEvent, UMAMI_EVENTS } from '$lib/utils/umami-tracking.js';
	
	let openItems = $state<number[]>([]);
	
	const faqs = [
		{
			question: "What do I get with Beta 2?",
			answer: "4 months completely free, then just €20/month (Essential) or €39/month (Premium) - a 20% lifetime discount that never expires. Full access to all features, zero commission on bookings, and you keep 100% of your tour revenue."
		},
		{
			question: "How many spots are available?",
			answer: "Exactly 100 spots. Once filled, the program closes forever. After Beta 2, everyone pays full price (€25 or €49/month) with no discount."
		},
		{
			question: "Do I need a credit card?",
			answer: "No! Beta 2 is completely free for 4 months with no credit card required. Cancel anytime with no obligations."
		},
		{
			question: "What happens after the 4-month trial?",
			answer: "You'll continue at your discounted rate (€20 or €39/month) - 20% less than public pricing. This discount is permanent and applies forever. Cancel anytime if it's not for you."
		},
		{
			question: "What if Beta 2 fills up?",
			answer: "You can join our public launch waitlist for March 2026, but you'll pay full price with no lifetime discount. Beta 2 is your last chance to lock in 20% off forever."
		},
		{
			question: "Is there any commission on bookings?",
			answer: "Never! You keep 100% of your tour revenue. We only charge a simple monthly subscription - no booking fees, no commission, no surprises."
		}
	];
	
	function toggleItem(index: number) {
		const wasOpen = openItems.includes(index);
		
		if (wasOpen) {
			openItems = openItems.filter(i => i !== index);
		} else {
			openItems = [...openItems, index];
			
			// Track FAQ expansion
			trackEvent(UMAMI_EVENTS.FAQ_EXPAND, {
				category: 'engagement',
				faq_question: faqs[index].question,
				faq_index: index,
				page: 'homepage'
			});
		}
	}
	
	function isOpen(index: number): boolean {
		return openItems.includes(index);
	}
</script>

<div class="faq-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Section Divider -->
		<hr class="section-divider" aria-hidden="true" />
		
	<!-- Header -->
	<div class="faq-header">
			<h2 class="faq-title">Frequently Asked Questions</h2>
			<p class="faq-subtitle">Everything you need to know about Beta 2</p>
	</div>

	<!-- FAQ Accordion -->
	<div class="faq-wrapper">
		{#each faqs as faq, index}
			<div class="faq-accordion-item">
				<button 
					class="faq-accordion-button"
					onclick={() => toggleItem(index)}
					aria-expanded={isOpen(index)}
				>
					<span class="faq-accordion-question">{faq.question}</span>
					<div class="faq-accordion-icon {isOpen(index) ? 'rotated' : ''}">
						<ChevronDown class="w-5 h-5" />
					</div>
				</button>
				{#if isOpen(index)}
					<div class="faq-accordion-answer" transition:slide={{ duration: 300, easing: quintOut }}>
						<p>{faq.answer}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
		
	</div>
</div>

<style>
	/* Section Background - Clean & Professional */
	.faq-section {
		background: linear-gradient(
			180deg,
			var(--bg-secondary) 0%,
			var(--bg-primary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 0 auto 4rem;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.section-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-secondary) 50%,
			transparent 100%
		);
	}
	
	.section-divider::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.6;
		z-index: 1;
		box-shadow: 0 0 0 2px var(--bg-secondary);
	}
	
	/* Header */
	.faq-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 56rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	.faq-title {
		font-size: 2.25rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
	
	.faq-subtitle {
		font-size: 1.0625rem;
		color: var(--text-secondary);
		line-height: 1.6;
		letter-spacing: -0.01em;
	}
	
	/* FAQ Wrapper - Fixed Width */
	.faq-wrapper {
		max-width: 56rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	/* Responsive wrapper width */
	@media (max-width: 960px) {
		.faq-wrapper {
			width: 100%;
		}
	}
	
	/* Accordion Item - Always Full Width */
	.faq-accordion-item {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-xl);
		overflow: hidden;
		transition: all var(--transition-slow);
		box-shadow: var(--shadow-sm);
	}
	
	.faq-accordion-item:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--color-accent-600);
	}
	
	/* Accordion Button */
	.faq-accordion-button {
		width: 100%;
		padding: 1.5rem 2rem;
		background: transparent;
		border: none;
		cursor: pointer;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1.5rem;
		text-align: left;
		transition: all var(--transition-base);
		align-items: center;
	}
	
	.faq-accordion-button:hover {
		background: rgba(var(--primary-rgb), 0.02);
	}
	
	/* Question Text */
	.faq-accordion-question {
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.5;
		letter-spacing: -0.01em;
	}
	
	/* Icon */
	.faq-accordion-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-accent-100);
		color: var(--color-accent-600);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all var(--transition-base);
		border: 2px solid var(--color-accent-200);
	}
	
	.faq-accordion-icon.rotated {
		transform: rotate(180deg);
		background: var(--color-accent-600);
		color: white;
		border-color: var(--color-accent-600);
	}
	
	.faq-accordion-icon :global(svg) {
		flex-shrink: 0;
	}
	
	/* Answer */
	.faq-accordion-answer {
		padding: 0 2rem 1.5rem 2rem;
		background: rgba(var(--primary-rgb), 0.02);
	}
	
	.faq-accordion-answer p {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.7;
		letter-spacing: -0.01em;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.section-divider {
			margin: 0 auto 3rem;
			max-width: 10rem;
		}
		
		.faq-header {
			margin-bottom: 2.5rem;
		}
		
		.faq-title {
			font-size: 1.75rem;
		}
		
		.faq-subtitle {
			font-size: 0.9375rem;
		}
		
		.faq-wrapper {
			gap: 0.5rem;
		}
		
		.faq-accordion-button {
			padding: 1.25rem 1.5rem;
			gap: 1rem;
		}
		
		.faq-accordion-question {
			font-size: 1rem;
		}
		
		.faq-accordion-icon {
			width: 1.5rem;
			height: 1.5rem;
		}
		
		.faq-accordion-icon :global(svg) {
			width: 0.875rem;
			height: 0.875rem;
		}
		
		.faq-accordion-answer {
			padding: 0 1.5rem 1.25rem 1.5rem;
		}
		
		.faq-accordion-answer p {
			font-size: 0.875rem;
		}
	}
	
	@media (max-width: 480px) {
		.section-divider {
			margin: 0 auto 2.5rem;
			max-width: 8rem;
		}
		
		.faq-header {
			margin-bottom: 2rem;
		}
		
		.faq-title {
			font-size: 1.5rem;
		}
		
		.faq-subtitle {
			font-size: 0.875rem;
		}
		
		.faq-wrapper {
			gap: 0.75rem;
		}
		
		.faq-accordion-button {
			padding: 1rem 1.25rem;
		}
		
		.faq-accordion-question {
			font-size: 0.9375rem;
		}
		
		.faq-accordion-answer {
			padding: 0 1.25rem 1rem 1.25rem;
		}
		
		.faq-accordion-answer p {
			font-size: 0.875rem;
		}
	}
</style>


