<script lang="ts">
	interface Props {
		size?: 'small' | 'medium' | 'large';
		variant?: 'primary' | 'secondary' | 'white';
		text?: string;
		centered?: boolean;
	}
	
	let { size = 'medium', variant = 'primary', text, centered = false }: Props = $props();
	
	function getSizeClasses(size: string) {
		switch (size) {
			case 'small':
				return 'w-4 h-4 border-2';
			case 'large':
				return 'w-8 h-8 border-4';
			case 'medium':
			default:
				return 'w-6 h-6 border-2';
		}
	}
	
	function getVariantClasses(variant: string) {
		switch (variant) {
			case 'secondary':
				return 'border-gray-200 border-t-gray-600';
			case 'white':
				return 'border-white/30 border-t-white';
			case 'primary':
			default:
				return 'border-blue-200 border-t-blue-600';
		}
	}
	
	let containerClasses = $derived(
		centered 
			? 'flex items-center justify-center' + (text ? ' flex-col gap-2' : '')
			: 'flex items-center' + (text ? ' gap-2' : '')
	);
	
	let spinnerClasses = $derived(
		`${getSizeClasses(size)} ${getVariantClasses(variant)} rounded-full animate-spin`
	);
</script>

<div class={containerClasses}>
	<div class={spinnerClasses}></div>
	{#if text}
		<span class="text-sm text-gray-600">{text}</span>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 