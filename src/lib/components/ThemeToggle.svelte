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

<div class="flex items-center justify-center">
	<div 
		class="flex rounded-lg border p-1 transition-colors"
		style="background: var(--bg-secondary); border-color: var(--border-primary);"
	>
		{#each themes as theme}
			<Tooltip text={theme.label} position={tooltipPosition}>
				<button
					onclick={() => selectTheme(theme.value)}
					class="flex items-center justify-center p-2 rounded-md transition-all duration-200 {theme.mobileHidden ? 'hidden sm:flex' : ''}"
					style={currentTheme === theme.value 
						? 'background: var(--bg-primary); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);' 
						: ''}
					aria-label={`Switch to ${theme.label.toLowerCase()} theme`}
				>
					<theme.icon 
						class="h-4 w-4 transition-colors duration-200" 
						style={currentTheme === theme.value 
							? 'color: var(--color-primary-600);' 
							: 'color: var(--text-tertiary);'}
					/>
				</button>
			</Tooltip>
		{/each}
	</div>
</div>
