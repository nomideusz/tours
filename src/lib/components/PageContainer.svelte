<script lang="ts">
	interface Props {
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 {className}">
	{@render children?.()}
</div> 