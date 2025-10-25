<script lang="ts">
	import { fade } from 'svelte/transition';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import BetaBadge from '$lib/components/BetaBadge.svelte';
	
	// Umami tracking
	import { trackEvent, UMAMI_EVENTS } from '$lib/utils/umami-tracking.js';
	
	let openItems = $state<number[]>([]);
	
	const faqs = [
		{
			question: "What do I get with Beta 2?",
			answer: "6 months completely free, then just €20/month (Essential) or €39.20/month (Premium) - a 20% lifetime discount that never expires. Full access to all features, zero commission on bookings, and you keep 100% of your tour revenue."
		},
		{
			question: "How many spots are available?",
			answer: "Exactly 100 spots. Once filled, the program closes forever. After Beta 2, everyone pays full price (€25 or €49/month) with no discount."
		},
		{
			question: "Do I need a credit card?",
			answer: "No! Beta 2 is completely free for 6 months with no credit card required. Cancel anytime with no obligations."
		},
		{
			question: "What happens after the 6-month trial?",
			answer: "You'll continue at your discounted rate (€20 or €39.20/month) - 20% less than public pricing. This discount is permanent and applies forever. Cancel anytime if it's not for you."
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
	<!-- Header -->
	<div class="faq-header">
		<BetaBadge text="Frequently Asked Questions" icon={HelpCircle} variant="large" class="mb-6" />
		<h2 class="faq-title">Got Questions?</h2>
		<p class="faq-subtitle">Everything you need to know about Beta 2 and Zaur</p>
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
					<div class="faq-accordion-answer" transition:fade={{ duration: 200 }}>
						<p>{faq.answer}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	/* Main Section */
	.faq-section {
		width: 100%;
		max-width: 100%;
	}
	
	/* Header */
	.faq-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	.faq-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
		margin-bottom: 1rem;
	}
	
	.faq-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	/* FAQ Wrapper - Fixed Width */
	.faq-wrapper {
		width: 56rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	/* Responsive wrapper width */
	@media (max-width: 960px) {
		.faq-wrapper {
			width: 100%;
		}
	}
	
	/* Accordion Item - Always Full Width */
	.faq-accordion-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: box-shadow 0.3s ease;
	}
	
	.faq-accordion-item:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
		transition: background 0.2s ease;
		align-items: center;
	}
	
	.faq-accordion-button:hover {
		background: var(--bg-secondary);
	}
	
	/* Question Text */
	.faq-accordion-question {
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.5;
	}
	
	/* Icon */
	.faq-accordion-icon {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background: var(--primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: transform 0.3s ease;
	}
	
	.faq-accordion-icon.rotated {
		transform: rotate(180deg);
	}
	
	.faq-accordion-icon :global(svg) {
		flex-shrink: 0;
	}
	
	/* Answer */
	.faq-accordion-answer {
		padding: 0 2rem 1.5rem 2rem;
	}
	
	.faq-accordion-answer p {
		margin: 0;
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.7;
	}
	
	/* Mobile Responsive */
	@media (max-width: 640px) {
		.faq-header {
			margin-bottom: 2rem;
		}
		
		.faq-title {
			font-size: 1.75rem;
			margin-bottom: 0.75rem;
		}
		
		.faq-subtitle {
			font-size: 0.9375rem;
			line-height: 1.5;
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
			font-size: 0.9375rem;
			line-height: 1.6;
		}
	}
	
	/* Very Small Phones */
	@media (max-width: 360px) {
		.faq-title {
			font-size: 1.5rem;
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

