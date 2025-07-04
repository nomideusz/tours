<script lang="ts">
	import { preferences, updatePreferences } from '$lib/stores/preferences.js';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	// Icons
	import Settings from 'lucide-svelte/icons/settings';
	import Bell from 'lucide-svelte/icons/bell';
	import Volume2 from 'lucide-svelte/icons/volume-2';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	
	let showSuccess = $state(false);
	
	function handlePreferenceChange(key: string, value: any) {
		updatePreferences({ [key]: value });
		showSuccess = true;
		setTimeout(() => {
			showSuccess = false;
		}, 3000);
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
</style> 