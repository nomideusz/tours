<script lang="ts">
	import Check from 'lucide-svelte/icons/check';

	type ColorScheme = 'primary' | 'blue' | 'green' | 'purple' | 'orange';
	
	interface ColorSchemeDefinition {
		primary: string;
		secondary: string;
		accent?: string;
	}
	
	interface Props {
		selectedColorScheme: ColorScheme;
		colorSchemes: Record<ColorScheme, ColorSchemeDefinition>;
		onColorSchemeChange: (scheme: ColorScheme) => void;
		label?: string;
	}
	
	let { 
		selectedColorScheme, 
		colorSchemes, 
		onColorSchemeChange,
		label = "Color Scheme"
	}: Props = $props();
</script>

<div>
	<div class="text-sm font-medium text-primary mb-3 block" role="group" aria-label={label}>{label}</div>
	<div class="grid grid-cols-5 gap-2">
		{#each Object.entries(colorSchemes) as [scheme, colors]}
			<button
				onclick={() => onColorSchemeChange(scheme as ColorScheme)}
				class="aspect-square rounded-md border-2 transition-all relative overflow-hidden {selectedColorScheme === scheme 
					? 'border-primary scale-105' 
					: 'border-border hover:border-secondary'}"
				aria-label="{scheme} color scheme"
			>
				<div 
					class="w-full h-full"
					style="background: linear-gradient(135deg, {colors.primary}, {colors.secondary});"
				></div>
				{#if selectedColorScheme === scheme}
					<div class="absolute inset-0 flex items-center justify-center">
						<Check class="w-3 h-3 text-white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));" />
					</div>
				{/if}
			</button>
		{/each}
	</div>
</div>