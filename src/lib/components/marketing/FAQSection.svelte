<script lang="ts">
	import { fade } from 'svelte/transition';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	
	let openItems = $state<number[]>([]);
	
	const faqs = [
		{
			question: "When will Zaur fully launch?",
			answer: "We're planning our full public launch in Q2 2025. Early access members will have all features available progressively as we roll them out. You'll be using the platform fully before the public launch."
		},
		{
			question: "What happens to my early access pricing after launch?",
			answer: "Your early access pricing is locked in forever! As a founding member, you'll never pay more than what you sign up for today, even as we add more features and increase prices for new users."
		},
		{
			question: "Which countries and currencies do you support?",
			answer: "We support tour guides in all countries where Stripe operates (40+ countries). You can accept payments in 135+ currencies. Your location determines your payout currency, which is set during onboarding."
		},
		{
			question: "Do I need any technical skills to use Zaur?",
			answer: "Not at all! If you can use WhatsApp or Instagram, you can use Zaur. Everything is designed to be simple and intuitive. Setup takes less than 5 minutes, and we provide step-by-step guidance."
		},
		{
			question: "How does payment processing work?",
			answer: "Payments go directly to your bank account via Stripe. Customers pay instantly when booking, and you receive the money in 2-7 business days (depending on your country). We never touch your money - it goes straight from customer to you."
		},
		{
			question: "What if I already use another booking platform?",
			answer: "You can use Zaur alongside any existing platform. Many guides start by using our QR codes for walk-up customers while keeping their existing system. When you're ready to fully switch, we'll help you migrate."
		},
		{
			question: "Is there a contract or cancellation fee?",
			answer: "No contracts, no cancellation fees, no surprises. You can cancel or pause your subscription anytime. If you cancel, you'll still have access until the end of your billing period."
		},
		{
			question: "What support do I get during early access?",
			answer: "Early access members get priority support directly from the founders. We typically respond within hours, not days. You also get access to our private community where you can connect with other tour guides and share tips."
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

<section id="faq" class="py-20" style="background: var(--bg-secondary);" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center mb-16">
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
				style="background: var(--color-info-100); color: var(--color-info-700);">
				<HelpCircle class="w-4 h-4" />
				<span class="text-sm font-medium">Common Questions</span>
			</div>
			<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
				Everything You Need to Know
			</h2>
			<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
				Got questions? We've got answers. If you can't find what you're looking for, email us at support@zaur.app
			</p>
		</div>
		
		<div class="max-w-3xl mx-auto">
			<div class="faq-list">
				{#each faqs as faq, index}
					<div class="faq-item" in:fade={{ duration: 400, delay: index * 50 }}>
						<button 
							class="faq-question"
							onclick={() => toggleItem(index)}
							aria-expanded={isOpen(index)}
						>
							<span class="faq-question-text">{faq.question}</span>
							<ChevronDown 
								class="faq-icon {isOpen(index) ? 'rotate-180' : ''}" 
							/>
						</button>
						{#if isOpen(index)}
							<div class="faq-answer" in:fade={{ duration: 200 }}>
								<p>{faq.answer}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			
			<div class="text-center mt-12">
				<p class="text-sm mb-4" style="color: var(--text-secondary);">
					Still have questions?
				</p>
				<a 
					href="/contact" 
					class="button-secondary button--small"
				>
					Contact Support
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.faq-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		transition: all 0.2s ease;
	}
	
	.faq-item:hover {
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-sm);
	}
	
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
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.5;
	}
	
	.faq-icon {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		color: var(--text-tertiary);
		transition: transform 0.2s ease;
	}
	
	.faq-icon.rotate-180 {
		transform: rotate(180deg);
	}
	
	.faq-answer {
		padding: 0 1.5rem 1.25rem 1.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
		line-height: 1.6;
	}
	
	@media (max-width: 768px) {
		.faq-question {
			padding: 1rem 1.25rem;
		}
		
		.faq-question-text {
			font-size: 0.9rem;
		}
		
		.faq-answer {
			padding: 0 1.25rem 1rem 1.25rem;
			font-size: 0.8rem;
		}
	}
	
	@media (max-width: 480px) {
		.faq-question {
			padding: 0.875rem 1rem;
		}
		
		.faq-answer {
			padding: 0 1rem 0.875rem 1rem;
		}
	}
</style> 