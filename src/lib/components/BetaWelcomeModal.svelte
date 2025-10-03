<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	
	// Icons
	import X from 'lucide-svelte/icons/x';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Trophy from 'lucide-svelte/icons/trophy';
	import Zap from 'lucide-svelte/icons/zap';
	import Gift from 'lucide-svelte/icons/gift';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	
	const dispatch = createEventDispatcher();
	
	function close() {
		dispatch('close');
	}
	
	function handleCreateTour() {
		close();
		goto('/tours/new');
	}
	
	function handleGoDashboard() {
		close();
		goto('/dashboard');
	}
	
	function handleSubscribe() {
		close();
		goto('/subscription');
	}
</script>

<!-- Backdrop -->
<div 
	class="modal-backdrop" 
	onclick={close}
	transition:fade={{ duration: 200 }}
	role="button"
	tabindex="-1"
	onkeydown={(e) => e.key === 'Escape' && close()}
></div>

<!-- Modal -->
<div 
	class="modal-container"
	transition:fly={{ y: 50, duration: 300 }}
>
	<div class="modal-content">
		<!-- Header -->
		<div class="modal-header">
			<div>
				<div class="beta-badge">
					<Zap class="w-4 h-4" />
					<span>Beta Tester</span>
				</div>
				<h2 class="modal-title">Welcome to Zaur Beta!</h2>
				<p class="modal-subtitle">
					You're one of 50 selected tour guides helping us build the perfect booking platform
				</p>
			</div>
			<button onclick={close} class="close-button" aria-label="Close">
				<X class="w-5 h-5" />
			</button>
		</div>
		
		<!-- Body -->
		<div class="modal-body">
			<!-- Benefits -->
			<div class="section">
				<h3 class="section-title">Your Beta Benefits</h3>
				<div class="benefits-grid">
					<div class="benefit-item">
						<Zap class="w-4 h-4" style="color: var(--primary);" />
						<span>12 months free</span>
					</div>
					<div class="benefit-item">
						<Trophy class="w-4 h-4" style="color: var(--primary);" />
						<span>30% lifetime discount</span>
					</div>
					<div class="benefit-item">
						<MessageSquare class="w-4 h-4" style="color: var(--primary);" />
						<span>Direct influence</span>
					</div>
					<div class="benefit-item">
						<Gift class="w-4 h-4" style="color: var(--primary);" />
						<span>Extra rewards for feedback</span>
					</div>
				</div>
			</div>
			
			<!-- How to Help -->
			<div class="section">
				<h3 class="section-title">How You Can Help</h3>
				<div class="help-list">
					<div class="help-item">
						<CheckCircle class="w-4 h-4 flex-shrink-0" style="color: var(--success);" />
						<div>
							<strong>Use Zaur for real tours</strong> - The best feedback comes from actual use
						</div>
					</div>
					<div class="help-item">
						<CheckCircle class="w-4 h-4 flex-shrink-0" style="color: var(--success);" />
						<div>
							<strong>Share your feedback</strong> - Use the feedback button in the bottom right corner anytime!
						</div>
					</div>
				</div>
			</div>
			
			<!-- Subscription Info -->
			<div class="section">
				<h3 class="section-title">Getting Your 12 Months Free</h3>
				<div class="info-card info-card--subscription">
					<div class="help-list">
						<div class="help-item">
							<CheckCircle class="w-4 h-4 flex-shrink-0" style="color: var(--primary);" />
							<div>
								<strong>Subscribe to Professional plan</strong> - Credit card required to activate
							</div>
						</div>
						<div class="help-item">
							<CheckCircle class="w-4 h-4 flex-shrink-0" style="color: var(--primary);" />
							<div>
								<strong>12 months free automatically</strong> - No charges for the first year
							</div>
						</div>
						<div class="help-item">
							<CheckCircle class="w-4 h-4 flex-shrink-0" style="color: var(--primary);" />
							<div>
								<strong>30% discount forever</strong> - Applied automatically after your free period
							</div>
						</div>
						<div class="help-item">
							<CheckCircle class="w-4 h-4 flex-shrink-0" style="color: var(--primary);" />
							<div>
								<strong>Cancel anytime</strong> - No commitment, cancel with one click
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Rewards Info -->
			<div class="info-card">
				<div class="info-header">
					<Gift class="w-4 h-4" />
					<span>Earn Extra Rewards</span>
				</div>
				<ul class="info-list">
					<li>Critical bug: +2 months free</li>
					<li>Implemented feature: +3 months free</li>
					<li>User interview: +3 months free</li>
				</ul>
			</div>
			
			<!-- Contact -->
			<div class="contact-box">
				<p>Need help? Email us at <a href="mailto:beta@zaur.app">beta@zaur.app</a></p>
			</div>
		</div>
		
		<!-- Footer -->
		<div class="modal-footer">
			<button onclick={handleGoDashboard} class="button-secondary">
				Go to Dashboard
			</button>
			<button onclick={handleSubscribe} class="button-success button--gap">
				<CreditCard class="w-4 h-4" />
				<span>Subscribe Now</span>
			</button>
			<button onclick={handleCreateTour} class="button-primary button--gap">
				<span>Create Your First Tour</span>
				<ArrowRight class="w-4 h-4" />
			</button>
		</div>
	</div>
</div>

<style>
	/* Backdrop */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		backdrop-filter: blur(4px);
	}
	
	/* Modal Container */
	.modal-container {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1001;
		width: 90%;
		max-width: 1000px;
		max-height: 90vh;
		overflow-y: auto;
	}
	
	/* Modal Content */
	.modal-content {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		border: 1px solid var(--border-primary);
	}
	
	/* Header */
	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}
	
	.beta-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.75rem;
		background: var(--primary-light);
		color: var(--primary);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}
	
	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.modal-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.close-button {
		flex-shrink: 0;
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: var(--radius-md);
		transition: all 0.2s ease;
	}
	
	.close-button:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
	
	/* Body */
	.modal-body {
		padding: 1.5rem;
		max-height: calc(90vh - 180px);
		overflow-y: auto;
	}
	
	/* Custom scrollbar styling */
	.modal-body::-webkit-scrollbar {
		width: 8px;
	}
	
	.modal-body::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.modal-body::-webkit-scrollbar-thumb {
		background: var(--border-secondary);
		border-radius: 4px;
	}
	
	.modal-body::-webkit-scrollbar-thumb:hover {
		background: var(--text-tertiary);
	}
	
	.section {
		margin-bottom: 1.5rem;
	}
	
	.section:last-child {
		margin-bottom: 0;
	}
	
	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}
	
	/* Benefits Grid */
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}
	
	@media (max-width: 900px) {
		.benefits-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	
	.benefit-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}
	
	/* Help List */
	.help-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.help-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}
	
	.help-item strong {
		color: var(--text-primary);
	}
	
	/* Info Card */
	.info-card {
		padding: 1rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: var(--radius-md);
		margin-top: 1.5rem;
	}
	
	.info-card--subscription {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		margin-top: 0;
	}
	
	.info-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary-900);
		margin-bottom: 0.5rem;
	}
	
	.info-list {
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-primary-700);
	}
	
	.info-list li {
		margin-bottom: 0.25rem;
		padding-left: 1rem;
		position: relative;
	}
	
	.info-list li::before {
		content: "•";
		position: absolute;
		left: 0;
		color: var(--primary);
	}
	
	/* Contact Box */
	.contact-box {
		margin-top: 1.5rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		text-align: center;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.contact-box a {
		color: var(--primary);
		font-weight: 500;
		text-decoration: none;
	}
	
	.contact-box a:hover {
		text-decoration: underline;
	}
	
	/* Footer */
	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid var(--border-primary);
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		flex-wrap: wrap;
	}
	
	:global(.button--gap) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	/* Large Desktop */
	@media (min-width: 1200px) {
		.modal-container {
			max-width: 1100px;
		}
	}
	
	/* Tablet */
	@media (max-width: 768px) {
		.modal-container {
			max-width: 700px;
		}
	}
	
	/* Mobile */
	@media (max-width: 640px) {
		.modal-container {
			width: 95%;
			max-height: 90vh;
		}
		
		.modal-header {
			padding: 1rem;
		}
		
		.modal-title {
			font-size: 1.25rem;
		}
		
		.modal-body {
			padding: 1rem;
		}
		
		.benefits-grid {
			grid-template-columns: 1fr;
		}
		
		.modal-footer {
			padding: 1rem;
			flex-direction: column-reverse;
		}
		
		.modal-footer button {
			width: 100%;
		}
	}
</style>

