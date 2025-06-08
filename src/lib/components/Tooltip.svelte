<script lang="ts">
	let { 
		text,
		position = 'bottom',
		class: className = "",
		children
	} = $props<{
		text: string;
		position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
		class?: string;
		children: any;
	}>();

	// Position classes mapping
	const positionClasses = {
		top: '-top-8 left-1/2 transform -translate-x-1/2',
		bottom: 'top-12 left-1/2 transform -translate-x-1/2', 
		left: 'top-1/2 right-12 transform -translate-y-1/2',
		right: 'top-1/2 left-12 transform -translate-y-1/2',
		'top-left': '-top-8 right-0',
		'top-right': '-top-8 left-0',
		'bottom-left': 'top-12 right-0',
		'bottom-right': 'top-12 left-0'
	};
</script>

<!-- Tooltip wrapper -->
<div class="relative inline-block group {className}">
	{@render children()}
	
	<!-- Custom tooltip -->
	<div 
		class="absolute {positionClasses[position as keyof typeof positionClasses]} px-2 py-1 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
		style="background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
	>
		{text}
	</div>
</div> 