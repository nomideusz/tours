<script lang="ts">
	import { fade } from 'svelte/transition';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	
	let openItems = $state<number[]>([]);
	
	const faqs = [
		{
			question: "When will Zaur be fully available?",
			answer: "We're planning our public launch in Q2 2025. Early access members will receive all features progressively as we complete development. You'll have full platform access before the public launch."
		},
		{
			question: "What happens to my early access pricing after launch?",
			answer: "Your early access pricing is permanently locked in. As a founding member, your subscription rate will never increase, even as we add more features and adjust pricing for new users."
		},
		{
			question: "Which countries and currencies do you support?",
			answer: "We support tour guides in all countries where Stripe operates (40+ countries). You can accept payments in 135+ currencies. Your payout currency is determined by your business location, which is set during account setup."
		},
		{
			question: "Do I need technical skills to use Zaur?",
			answer: "No technical expertise required. The platform is designed to be intuitive for tour guides of all technical backgrounds. Setup typically takes less than 5 minutes, and we provide comprehensive guidance throughout the process."
		},
		{
			question: "How does payment processing work?",
			answer: "Payments are processed directly to your bank account via Stripe. Customers pay instantly when booking, and you receive funds in 2-7 business days (depending on your country). We never handle your money - it goes directly from customer to you."
		},
		{
			question: "Can I use Zaur alongside other booking platforms?",
			answer: "Yes, Zaur works alongside any existing booking system. Many guides start by using our QR codes for walk-up customers while maintaining their current setup. When you're ready to transition fully, we provide migration assistance."
		},
		{
			question: "Are there contracts or cancellation fees?",
			answer: "No contracts or cancellation fees. You can cancel or pause your subscription at any time. If you cancel, you retain access until the end of your current billing period."
		},
		{
			question: "What support do early access members receive?",
			answer: "Early access members receive priority support with direct access to our team. We typically respond within hours during business days. You also gain access to our founding member community for peer networking and tips."
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
				<span class="text-sm font-medium">Frequently Asked Questions</span>
			</div>
			<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
				Common Questions Answered
			</h2>
			<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
				Find answers to frequently asked questions about Zaur. For additional support, contact us at support@zaur.app
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
					Need additional assistance?
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