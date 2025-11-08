<script lang="ts">
	import { base } from '$app/paths';
	
	interface Props {
		countryCode: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}
	
	let { countryCode, size = 'md', class: className = '' }: Props = $props();
	
	// State for fallback display
	let showFallback = $state(false);
	
	// Get dimensions based on size
	const getDimensions = () => {
		switch (size) {
			case 'sm': return { px: '18px', num: 18 };
			case 'md': return { px: '24px', num: 24 };
			case 'lg': return { px: '32px', num: 32 };
			default: return { px: '24px', num: 24 };
		}
	};
	
	const dimensions = getDimensions();
	
	function handleError() {
		showFallback = true;
	}
	
	// Build the flag URL
	let flagUrl = $derived(`${base}/flags/1x1/${countryCode.toLowerCase()}.svg`);
</script>

<div class="flag-container" style="width: {dimensions.px}; height: {dimensions.px};">
	{#if !showFallback}
		<img 
			src={flagUrl}
			alt="{countryCode} flag"
			class="flag-icon {className}"
			width={dimensions.num}
			height={dimensions.num}
			onerror={handleError}
		/>
	{:else}
		<span class="flag-fallback {className}">
			{countryCode}
		</span>
	{/if}
</div>

<style>
	.flag-container {
		display: inline-block;
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
		border-radius: 0.25rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		transition: all 0.2s ease;
	}
	
	.flag-container:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}
	
	.flag-icon {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.25rem;
		border: 0;
		background: var(--bg-secondary);
		transition: opacity 0.2s ease;
	}
	
	.flag-icon:hover {
		opacity: 0.95;
	}
	
	.flag-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: 0.65rem;
		font-weight: 500;
		background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
		border-radius: 0.25rem;
		color: var(--text-secondary);
		letter-spacing: 0.025em;
		box-shadow: inset 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}
</style> 