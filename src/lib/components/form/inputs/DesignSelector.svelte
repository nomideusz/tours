<script lang="ts">
	interface Props {
		selectedDesign: string;
		designs: string[];
		onDesignChange: (design: string) => void;
		label?: string;
	}
	
	let { 
		selectedDesign, 
		designs, 
		onDesignChange,
		label = "Design Style"
	}: Props = $props();
</script>

<div>
	<div class="text-sm font-medium text-primary mb-3 block" role="group" aria-label={label}>{label}</div>
	<div class="space-y-2">
		{#each designs as design}
			<button
				onclick={() => onDesignChange(design)}
				class="w-full text-left px-3 py-2 rounded-md text-sm transition-all {selectedDesign === design 
					? 'bg-secondary text-primary font-medium' 
					: 'text-secondary hover:bg-tertiary hover:text-primary'}"
			>
				{design.charAt(0).toUpperCase() + design.slice(1)}
			</button>
		{/each}
	</div>
</div>