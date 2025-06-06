<script lang="ts">
	import { themeStore, type Theme } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';
	
	// Icons
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import Monitor from 'lucide-svelte/icons/monitor';

	let cleanup: (() => void) | undefined;

	const themes: { value: Theme; label: string; icon: any }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
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
			<button
				onclick={() => selectTheme(theme.value)}
				class="relative flex items-center justify-center p-2 rounded-md transition-all duration-200 group"
				style={currentTheme === theme.value 
					? 'background: var(--bg-primary); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);' 
					: ''}
				title={theme.label}
				aria-label={`Switch to ${theme.label.toLowerCase()} theme`}
			>
				<theme.icon 
					class="h-4 w-4 transition-colors duration-200" 
					style={currentTheme === theme.value 
						? 'color: var(--color-primary-600);' 
						: 'color: var(--text-tertiary);'}
				/>
				
				<!-- Hover tooltip -->
				<div 
					class="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10"
					style="background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-primary);"
				>
					{theme.label}
				</div>
			</button>
		{/each}
	</div>
</div>
