<script lang="ts">
	import Sparkles from 'lucide-svelte/icons/sparkles';

	interface Props {
		text?: string;
		icon?: any;
		variant?: 'default' | 'small' | 'large' | 'professional';
		class?: string;
	}

	let { 
		text = "Beta", 
		icon = Sparkles,
		variant = "default",
		class: className = ""
	}: Props = $props();
</script>

<div class="beta-badge beta-badge--{variant} {className}">
	{#if icon}
		{@const IconComponent = icon}
		<IconComponent class="w-4 h-4" />
	{/if}
	<span>{text}</span>
</div>