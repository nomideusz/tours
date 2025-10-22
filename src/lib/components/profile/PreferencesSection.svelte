<script lang="ts">
	import { preferences, updatePreferences } from '$lib/stores/preferences.js';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { isFeatureEnabled, hasFeatureAccess } from '$lib/feature-flags.js';
	
	// Icons
	import Settings from 'lucide-svelte/icons/settings';
	import Bell from 'lucide-svelte/icons/bell';
	import Volume2 from 'lucide-svelte/icons/volume-2';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Crown from 'lucide-svelte/icons/crown';
	
	let {
		user,
		onWhatsAppToggle
	}: {
		user: any;
		onWhatsAppToggle?: (enabled: boolean) => void;
	} = $props();
	
	let showSuccess = $state(false);
	let whatsappLoading = $state(false);
	
	function handlePreferenceChange(key: string, value: any) {
		console.log('🔧 Preference change:', key, '=', value);
		console.log('🔧 Before update:', $preferences);
		updatePreferences({ [key]: value });
		console.log('🔧 After update:', $preferences);
		showSuccess = true;
		setTimeout(() => {
			showSuccess = false;
		}, 3000);
	}
	
	async function handleWhatsAppToggle(enabled: boolean) {
		if (!onWhatsAppToggle) return;
		
		whatsappLoading = true;
		try {
			await onWhatsAppToggle(enabled);
			showSuccess = true;
			setTimeout(() => {
				showSuccess = false;
			}, 3000);
		} catch (error) {
			console.error('Failed to update WhatsApp preference:', error);
		} finally {
			whatsappLoading = false;
		}
	}
	
	// Check if user can use WhatsApp features
	const whatsappFeatureEnabled = isFeatureEnabled('WHATSAPP_NOTIFICATIONS');
	const hasWhatsAppAccess = user?.subscriptionPlan && hasFeatureAccess('WHATSAPP_NOTIFICATIONS', user.subscriptionPlan);
	const showWhatsAppOption = whatsappFeatureEnabled && hasWhatsAppAccess;
	
	// Test notification sound
	async function testNotificationSound() {
		try {
			console.log('🔊 Testing notification sound...');
			
			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioContextClass) {
				alert('Audio not supported in your browser');
				return;
			}
			
			const audioContext = new AudioContextClass();
			
			if (audioContext.state === 'suspended') {
				await audioContext.resume();
			}
			
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			
			oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
			oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
			
			gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
			
			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.4);
			
			setTimeout(() => audioContext.close(), 500);
			
			console.log('✅ Test sound played');
		} catch (error) {
			console.error('❌ Test sound failed:', error);
			alert('Could not play sound. Check console for details.');
		}
	}
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-4 border-b flex items-center gap-2" style="border-color: var(--border-primary);">
		<Settings class="h-5 w-5" style="color: var(--text-secondary);" />
		<h3 class="font-semibold" style="color: var(--text-primary);">Preferences</h3>
	</div>
	
	<div class="p-6">
		{#if showSuccess}
			<div class="mb-4 rounded-lg p-3" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
				<div class="flex items-center gap-2">
					<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
					<span class="text-sm font-medium" style="color: var(--color-success-900);">Preferences saved</span>
				</div>
			</div>
		{/if}
		
		<div class="space-y-6">
			<!-- Notification Sounds -->
			<div class="flex items-start justify-between">
				<div class="flex-1 pr-4">
					<div class="flex items-center gap-2 mb-1">
						<Volume2 class="h-4 w-4" style="color: var(--text-secondary);" />
						<label for="notification-sound" class="font-medium" style="color: var(--text-primary);">
							Notification Sounds
						</label>
					</div>
					<p class="text-sm" style="color: var(--text-secondary);">
						Play a gentle chime when you receive new booking notifications
					</p>
					{#if $preferences.notificationSound}
						<button
							type="button"
							onclick={testNotificationSound}
							class="button--small button--gap mt-2"
							style="font-size: 0.75rem; padding: 0.25rem 0.75rem;"
						>
							<Volume2 class="h-3 w-3" style="display: inline;" />
							Test Notification Sound
						</button>
					{/if}
				</div>
				<div class="flex items-center">
					<Tooltip text="Toggle notification sounds">
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								id="notification-sound"
								type="checkbox"
								checked={$preferences.notificationSound}
								onchange={(e) => handlePreferenceChange('notificationSound', e.currentTarget.checked)}
								class="sr-only peer"
							/>
							<div class="toggle-switch"></div>
						</label>
					</Tooltip>
				</div>
			</div>
			
			<!-- WhatsApp Notifications (Professional+ only) -->
			{#if showWhatsAppOption}
				<div class="flex items-start justify-between">
					<div class="flex-1 pr-4">
						<div class="flex items-center gap-2 mb-1">
							<MessageCircle class="h-4 w-4" style="color: var(--color-primary-600);" />
							<label for="whatsapp-notifications" class="font-medium" style="color: var(--text-primary);">
								WhatsApp Notifications
							</label>
							<Crown class="h-3 w-3" style="color: var(--color-warning-600);" />
						</div>
						<p class="text-sm" style="color: var(--text-secondary);">
							Send booking confirmations and reminders to your customers via WhatsApp
						</p>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">
							Professional+ feature • Creates premium customer experience
						</p>
					</div>
					<div class="flex items-center">
						<Tooltip text="Toggle WhatsApp notifications for your customers">
							<label class="relative inline-flex items-center cursor-pointer">
								<input
									id="whatsapp-notifications"
									type="checkbox"
									checked={user?.whatsappNotifications ?? true}
									onchange={(e) => handleWhatsAppToggle(e.currentTarget.checked)}
									disabled={whatsappLoading}
									class="sr-only peer"
								/>
								<div class="toggle-switch" class:loading={whatsappLoading}></div>
							</label>
						</Tooltip>
					</div>
				</div>
			{/if}
			
			<!-- More preferences can be added here -->
			<div class="pt-4 border-t" style="border-color: var(--border-primary);">
				<p class="text-xs" style="color: var(--text-tertiary);">
					<Bell class="h-3 w-3 inline mr-1" />
					Notifications always appear in the bell icon dropdown. These settings only control additional features.
				</p>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	
	.toggle-switch {
		width: 44px;
		height: 24px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: 9999px;
		position: relative;
		transition: all 200ms ease;
		cursor: pointer;
	}
	
	.toggle-switch::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: white;
		border-radius: 50%;
		transition: transform 200ms ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	/* Dark mode adjustments */
	[data-theme="dark"] .toggle-switch::after {
		background: var(--bg-primary);
	}
	
	/* Checked state */
	input:checked ~ .toggle-switch {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
	}
	
	input:checked ~ .toggle-switch::after {
		transform: translateX(20px);
	}
	
	/* Focus state */
	input:focus-visible ~ .toggle-switch {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}
	
	/* Hover state */
	label:hover .toggle-switch {
		background: var(--bg-secondary);
	}
	
	label:hover input:checked ~ .toggle-switch {
		background: var(--color-primary-700);
	}
	
	/* Disabled state */
	input:disabled ~ .toggle-switch {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	/* Loading state */
	.toggle-switch.loading {
		opacity: 0.6;
		cursor: wait;
	}
	
	.toggle-switch.loading::after {
		animation: pulse 1.5s infinite;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style> 