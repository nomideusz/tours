<script lang="ts">
	import { enhance } from '$app/forms';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { currentUser } from '$lib/stores/auth.js';
	import { PRICING_PLANS } from '$lib/utils/pricing-config.js';
	
	export let whatsappOptIn = false;
	export let whatsappNumber = '';
	
	$: canUseWhatsApp = $currentUser && ['professional', 'agency'].includes($currentUser.subscriptionPlan || '');
	$: planName = PRICING_PLANS.find(p => p.id === $currentUser?.subscriptionPlan)?.name || 'Free';
</script>

<div class="card">
	<div class="card-header">
		<h3>WhatsApp Notifications</h3>
		<Tooltip text="Receive instant booking notifications via WhatsApp. Available for Professional and Agency plans." position="top">
			<span class="tooltip-trigger">ℹ️</span>
		</Tooltip>
	</div>
	
	<div class="card-body">
		{#if !canUseWhatsApp}
			<div class="alert alert--info">
				<div class="alert-content">
					<h4>Upgrade to use WhatsApp notifications</h4>
					<p>
						WhatsApp notifications are available on Professional and Agency plans. 
						You're currently on the {planName} plan.
					</p>
					<a href="/subscription" class="button button--primary button--small">
						View Plans
					</a>
				</div>
			</div>
		{:else}
			<form method="POST" action="?/updateWhatsApp" use:enhance>
				<div class="form-group">
					<label class="checkbox-wrapper">
						<input 
							type="checkbox" 
							name="whatsappOptIn" 
							bind:checked={whatsappOptIn}
							class="checkbox"
						/>
						<span>Enable WhatsApp notifications</span>
					</label>
					<p class="text-sm text-secondary mt-2">
						Get instant notifications for new bookings, cancellations, and reminders via WhatsApp.
					</p>
				</div>
				
				{#if whatsappOptIn}
					<div class="form-group">
						<label for="whatsappNumber">WhatsApp Number</label>
						<input
							type="tel"
							id="whatsappNumber"
							name="whatsappNumber"
							bind:value={whatsappNumber}
							placeholder="+1234567890"
							class="input"
							pattern="^\\+[1-9]\\d*$"
							title="Please enter a valid phone number with country code (e.g., +1234567890)"
						/>
						<p class="text-sm text-secondary mt-2">
							Enter your WhatsApp number with country code. This can be different from your profile phone number.
						</p>
					</div>
				{/if}
				
				<div class="form-group">
					<h4>What you'll receive:</h4>
					<ul class="feature-list">
						<li>✅ Instant booking confirmations</li>
						<li>📅 Tour reminders (24 hours before)</li>
						<li>❌ Cancellation notifications</li>
						<li>💰 Payment confirmations</li>
					</ul>
				</div>
				
				<div class="form-actions">
					<button type="submit" class="button button--primary">
						Save WhatsApp Settings
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	.feature-list {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0;
	}
	
	.feature-list li {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border-color);
	}
	
	.feature-list li:last-child {
		border-bottom: none;
	}
	
	.checkbox-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	
	.checkbox-wrapper .checkbox {
		margin: 0;
	}
</style> 