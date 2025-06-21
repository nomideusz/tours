<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	let portal: HTMLDivElement;
	let target: HTMLElement | null = null;
	
	onMount(() => {
		// Create a div element to act as the portal
		portal = document.createElement('div');
		portal.className = 'svelte-portal';
		
		// Append it directly to body
		target = document.body;
		target.appendChild(portal);
	});
	
	onDestroy(() => {
		// Clean up the portal when component is destroyed
		if (portal && target) {
			target.removeChild(portal);
		}
	});
</script>

{#if portal}
	<div bind:this={portal}>
		<slot />
	</div>
{/if}

<style>
	:global(.svelte-portal) {
		/* Ensure portal is at root level with no inherited styles */
		position: fixed;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		z-index: 999999;
		pointer-events: none;
		/* Reset any transforms that might affect stacking */
		transform: none;
		filter: none;
		backdrop-filter: none;
		will-change: auto;
		contain: none;
		perspective: none;
		isolation: isolate;
	}
	
	:global(.svelte-portal > *) {
		pointer-events: auto;
	}
</style> 