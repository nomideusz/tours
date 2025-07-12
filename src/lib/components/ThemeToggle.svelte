<script lang="ts">
	import { themeStore, type Theme } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';
	
	// Icons
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import Tooltip from '$lib/components/Tooltip.svelte';

	let { tooltipPosition = 'top' } = $props<{ tooltipPosition?: 'top' | 'bottom' }>();

	let cleanup: (() => void) | undefined;

	const themes: { value: Theme; label: string; icon: any; mobileHidden?: boolean }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon }
	];

	// Get current theme
	let currentTheme = $state<Theme>('system');
	
	// Subscribe to theme changes
	$effect(() => {
		const unsubscribe = themeStore.subscribe(theme => {
			currentTheme = theme;
		});
		return unsubscribe;
	});

	onMount(() => {
		// Initialize theme store
		cleanup = themeStore.init();
		
		return () => {
			cleanup?.();
		};
	});

	function selectTheme(theme: Theme) {
		themeStore.setTheme(theme);
	}
</script>

<div class="theme-toggle-container">
	<div class="theme-toggle-wrapper">
		{#each themes as theme}
			<Tooltip text={theme.label} position={tooltipPosition}>
				<button
					onclick={() => selectTheme(theme.value)}
					class="theme-toggle-button"
					class:active={currentTheme === theme.value}
					aria-label={`Switch to ${theme.label.toLowerCase()} theme`}
				>
					<theme.icon class="theme-toggle-icon w-5 h-5" />
				</button>
			</Tooltip>
		{/each}
	</div>
</div>

<style>
	.theme-toggle-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.theme-toggle-wrapper {
		display: flex;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		padding: 0.125rem;
		gap: 0;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}

	.theme-toggle-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--text-tertiary);
	}

	.theme-toggle-button:hover {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}

	.theme-toggle-button.active {
		background: var(--bg-primary);
		color: var(--color-primary-600);
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}
</style>
