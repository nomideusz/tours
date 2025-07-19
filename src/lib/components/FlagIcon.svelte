<script lang="ts">
	interface Props {
		countryCode: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}
	
	let { countryCode, size = 'md', class: className = '' }: Props = $props();
	
	// Convert to lowercase for filename
	let flagFile = $derived(countryCode.toLowerCase());
	
	// Size classes
	let sizeClass = $derived(() => {
		switch (size) {
			case 'sm': return 'w-4 h-4';
			case 'md': return 'w-6 h-6';
			case 'lg': return 'w-8 h-8';
			default: return 'w-6 h-6';
		}
	});
</script>

<img 
	src="/src/lib/icons/flags/1x1/{flagFile}.svg"
	alt="{countryCode} flag"
	class="flag-icon {sizeClass} {className}"
	loading="lazy"
/>

<style>
	.flag-icon {
		display: inline-block;
		border-radius: 0.125rem;
		object-fit: cover;
		flex-shrink: 0;
	}
</style> 