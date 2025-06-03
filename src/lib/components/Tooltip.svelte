<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	interface Props {
		content: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		trigger?: 'hover' | 'click';
		delay?: number;
		children: import('svelte').Snippet;
	}
	
	let { 
		content, 
		position = 'top', 
		trigger = 'hover', 
		delay = 300,
		children 
	}: Props = $props();
	
	let triggerElement: HTMLElement;
	let tooltipElement: HTMLElement;
	let showTooltip = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	
	function getPositionClasses(position: string) {
		switch (position) {
			case 'bottom':
				return {
					tooltip: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
					arrow: 'bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800'
				};
			case 'left':
				return {
					tooltip: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
					arrow: 'left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800'
				};
			case 'right':
				return {
					tooltip: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
					arrow: 'right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800'
				};
			case 'top':
			default:
				return {
					tooltip: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
					arrow: 'top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800'
				};
		}
	}
	
	let positionClasses = $derived(getPositionClasses(position));
	
	function handleMouseEnter() {
		if (trigger !== 'hover') return;
		
		timeoutId = setTimeout(() => {
			showTooltip = true;
		}, delay);
	}
	
	function handleMouseLeave() {
		if (trigger !== 'hover') return;
		
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		showTooltip = false;
	}
	
	function handleClick() {
		if (trigger !== 'click') return;
		showTooltip = !showTooltip;
	}
	
	function handleClickOutside(event: MouseEvent) {
		if (trigger !== 'click') return;
		if (!triggerElement || !tooltipElement) return;
		
		const target = event.target as Node;
		if (!triggerElement.contains(target) && !tooltipElement.contains(target)) {
			showTooltip = false;
		}
	}
	
	onMount(() => {
		if (trigger === 'click') {
			document.addEventListener('click', handleClickOutside);
		}
	});
	
	onDestroy(() => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		if (trigger === 'click') {
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="relative inline-block">
	<div
		bind:this={triggerElement}
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		onclick={handleClick}
		role={trigger === 'click' ? 'button' : undefined}
		tabindex={trigger === 'click' ? 0 : undefined}
		class="cursor-help"
	>
		{@render children()}
	</div>
	
	{#if showTooltip}
		<div
			bind:this={tooltipElement}
			class="absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg max-w-xs whitespace-normal {positionClasses.tooltip}"
			role="tooltip"
		>
			{content}
			<div class="absolute {positionClasses.arrow}"></div>
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 