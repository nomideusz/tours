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
			question: "When will Zaur launch publicly?",
			answer: "We're currently in beta testing with 50 selected tour guides. Based on their feedback, we're planning a public launch in Q1 2026. Join our waitlist to be among the first to know when we're ready!"
		},
		{
			question: "What is Zaur and how does it work?",
			answer: "Zaur is the simplest QR-based booking system for tour guides. Create your tour, get a QR code, share it anywhere (cards, flyers, t-shirts), and customers can scan to see availability and book instantly. You keep 100% of your revenue with no commission fees."
		},
		{
			question: "How much does Zaur cost?",
			answer: "We offer a free plan to get started, plus paid plans starting at €17/month for more features and bookings. No booking commissions ever – just simple, transparent monthly pricing."
		},
		{
			question: "Can I join the beta program?",
			answer: "Beta applications are now closed. We're working with 50 selected tour guides to refine the platform. Join our early access waitlist to be notified when we launch publicly in Q1 2026."
		},
		{
			question: "What happens if I join the waitlist?",
			answer: "You'll be among the first to know when Zaur launches. We'll send you an email with early access information, launch specials, and instructions to get started. No spam, just valuable updates."
		},
		{
			question: "Do you support multiple languages and currencies?",
			answer: "Yes! Zaur supports multiple currencies and we're continuously expanding language support. Our goal is to serve tour guides worldwide with localized experiences."
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

<!-- Simple Header -->
<div class="section-header">
	<BetaBadge text="Frequently Asked Questions" icon={HelpCircle} variant="large" class="mb-6" />
	<h2 class="section-title">
		Got Questions?
	</h2>
	<p class="section-subtitle">
		Everything you need to know about Zaur and our upcoming launch
	</p>
</div>

<!-- FAQ Items -->
<div class="faq-container">
	<div class="faq-list">
		{#each faqs as faq, index}
			<div class="faq-item">
				<button 
					class="faq-question"
					onclick={() => toggleItem(index)}
					aria-expanded={isOpen(index)}
				>
					<span class="faq-question-text">{faq.question}</span>
					<div class="faq-icon {isOpen(index) ? 'open' : ''}">
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
</div>

<style>
	/* Section Header */
	.section-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
		margin-bottom: 1rem;
	}
	
	.section-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		max-width: 42rem;
		margin: 0 auto;
	}
	
	/* FAQ Container */
	.faq-container {
		max-width: 48rem;
		margin: 0 auto;
	}
	
	/* FAQ List */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	/* FAQ Item */
	.faq-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all 0.3s ease;
	}
	
	.faq-item:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
	
	/* FAQ Question Button */
	.faq-question {
		width: 100%;
		padding: 1.25rem 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		text-align: left;
		transition: all 0.2s ease;
	}
	
	.faq-question:hover {
		background: var(--bg-secondary);
	}
	
	.faq-question-text {
		flex: 1;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
	}
	
	/* FAQ Icon */
	.faq-icon {
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
	
	.faq-icon.open {
		transform: rotate(180deg);
	}
	
	.faq-icon :global(svg) {
		width: 1rem;
		height: 1rem;
	}
	
	/* FAQ Answer */
	.faq-answer {
		padding: 0 1.5rem 1.25rem 1.5rem;
	}
	
	.faq-answer p {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	/* Mobile responsive - Mobile First! */
	@media (max-width: 640px) {
		/* Header adjustments */
		.section-header {
			margin-bottom: 2rem;
		}
		
		.section-title {
			font-size: 1.75rem;
			line-height: 1.15;
			margin-bottom: 0.75rem;
		}
		
		.section-subtitle {
			font-size: 0.9375rem;
			line-height: 1.5;
		}
		
		/* FAQ adjustments */
		.faq-list {
			gap: 0.5rem;
		}
		
		.faq-question {
			padding: 1rem 1.25rem;
			gap: 0.75rem;
		}
		
		.faq-question-text {
			font-size: 0.9375rem;
		}
		
		.faq-icon {
			width: 1.5rem;
			height: 1.5rem;
		}
		
		.faq-icon :global(svg) {
			width: 0.875rem;
			height: 0.875rem;
		}
		
		.faq-answer {
			padding: 0 1.25rem 1rem 1.25rem;
		}
		
		.faq-answer p {
			font-size: 0.875rem;
			line-height: 1.5;
		}
	}
	
	/* Very small phones */
	@media (max-width: 360px) {
		.section-title {
			font-size: 1.5rem;
		}
		
		.faq-question {
			padding: 0.875rem 1rem;
		}
		
		.faq-question-text {
			font-size: 0.875rem;
		}
		
		.faq-answer {
			padding: 0 1rem 0.875rem 1rem;
		}
		
		.faq-answer p {
			font-size: 0.8125rem;
		}
	}
</style> 