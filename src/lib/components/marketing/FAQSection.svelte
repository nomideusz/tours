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
			question: "What is Beta 2 and how is it different from Beta 1?",
			answer: "Beta 2 is the final beta cohort before our public launch in March 2026. While Beta 1 users (50 guides) received 1 year free + 30% lifetime discount, Beta 2 offers 100 guides 4 months free + 20% lifetime discount. This is your last chance to lock in a lifetime discount before we launch publicly at full price."
		},
		{
			question: "What do I get with Beta 2?",
			answer: "Beta 2 members get 4 months completely free (no credit card required), then just €20/month for Essential or €39/month for Premium - a 20% lifetime discount that never expires. You'll have full access to all features, keep 100% of your booking revenue with zero commission, and help shape the platform's final development."
		},
		{
			question: "How many spots are available?",
			answer: "We're accepting exactly 100 tour guides for Beta 2. Once these spots are filled, the program closes forever. The counter at the top of the page shows real-time availability. After Beta 2 closes, everyone will pay full price when we launch in March 2026."
		},
		{
			question: "Do I need a credit card to join Beta 2?",
			answer: "No! Beta 2 is completely free for 4 months with no credit card required. After your free trial ends, you can choose to continue at your discounted rate (€20 or €39/month) or cancel anytime with no obligations."
		},
		{
			question: "When does Beta 2 start and when does it end?",
			answer: "Beta 2 is open now (November 2025) and runs until March 2026 when we launch publicly. Your 4-month free trial starts when you join, and your 20% lifetime discount applies to all payments after the trial ends - forever."
		},
		{
			question: "What happens after the 4-month trial?",
			answer: "After your free trial, you'll automatically continue at your discounted rate: €20/month (Essential) or €39/month (Premium) - which is 20% less than public pricing. This discount is permanent and applies to all future payments. You can cancel anytime if you decide it's not for you."
		},
		{
			question: "Can I upgrade or downgrade my plan later?",
			answer: "Yes! You can switch between Essential and Premium plans anytime. Your 20% lifetime discount applies to whichever plan you choose. The discount is tied to your account, not a specific plan."
		},
		{
			question: "What if Beta 2 fills up before I join?",
			answer: "If all 100 spots are taken, you can join our public launch waitlist. You'll be notified when we launch in March 2026, but you'll pay full price (€25/month for Essential, €49/month for Premium) with no lifetime discount. Beta 2 is your last chance to lock in 20% off forever."
		},
		{
			question: "Is there any commission on bookings?",
			answer: "Never! Zaur charges zero commission on bookings. You keep 100% of your tour revenue. We only charge a simple monthly subscription fee - that's it. This is true for all plans, including Beta 2."
		},
		{
			question: "What features are included?",
			answer: "Beta 2 members get full access to all features: QR code booking pages, real-time availability management, instant payment processing, customer management, analytics dashboard, email notifications, WhatsApp notifications (Premium plan), weather integration, cancellation management, and more. See the pricing comparison on this page for complete details."
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
		Everything you need to know about Beta 2 and Zaur
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
		max-width: 56rem;
		margin: 0 auto;
		width: 100%;
	}
	
	/* FAQ List */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		align-items: stretch;
	}
	
	/* FAQ Item */
	.faq-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: box-shadow 0.3s ease;
		width: 100%;
		box-sizing: border-box;
		flex-shrink: 0;
		align-self: stretch;
	}
	
	.faq-item:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}
	
	/* FAQ Question Button */
	.faq-question {
		width: 100%;
		padding: 1.5rem 2rem;
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		text-align: left;
		transition: all 0.2s ease;
		box-sizing: border-box;
		min-width: 0;
	}
	
	.faq-question:hover {
		background: var(--bg-secondary);
	}
	
	.faq-question-text {
		flex: 1;
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.5;
		min-width: 0;
		word-wrap: break-word;
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
		padding: 0 2rem 1.5rem 2rem;
		width: 100%;
		box-sizing: border-box;
	}
	
	.faq-answer p {
		margin: 0;
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.7;
		max-width: 100%;
		word-wrap: break-word;
		overflow-wrap: break-word;
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
			padding: 1.25rem 1.5rem;
			gap: 1rem;
		}
		
		.faq-question-text {
			font-size: 1rem;
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
			padding: 0 1.5rem 1.25rem 1.5rem;
		}
		
		.faq-answer p {
			font-size: 0.9375rem;
			line-height: 1.6;
		}
	}
	
	/* Very small phones */
	@media (max-width: 360px) {
		.section-title {
			font-size: 1.5rem;
		}
		
		.faq-question {
			padding: 1rem 1.25rem;
		}
		
		.faq-question-text {
			font-size: 0.9375rem;
		}
		
		.faq-answer {
			padding: 0 1.25rem 1rem 1.25rem;
		}
		
		.faq-answer p {
			font-size: 0.875rem;
		}
	}
</style> 