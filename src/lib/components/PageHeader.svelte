<script lang="ts">
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { goto } from '$app/navigation';
	
	interface BreadcrumbItem {
		label: string;
		href?: string;
	}
	
	interface Props {
		title: string;
		subtitle?: string;
		breadcrumbs?: BreadcrumbItem[];
		backUrl?: string;
		children?: import('svelte').Snippet;
	}
	
	let { title, subtitle, breadcrumbs, backUrl, children }: Props = $props();
</script>

<div class="mb-8">
	<div class="flex items-center gap-4">
		{#if backUrl}
			<button 
				onclick={() => goto(backUrl)}
				class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
				aria-label="Go back"
			>
				<ArrowLeft class="h-5 w-5 text-gray-600" />
			</button>
		{/if}
		
		<div class="flex-1">
			{#if breadcrumbs && breadcrumbs.length > 0}
				<nav class="flex items-center gap-2 text-sm text-gray-600 mb-2">
					{#each breadcrumbs as crumb, i}
						{#if i > 0}
							<ChevronRight class="h-3 w-3" />
						{/if}
						{#if crumb.href}
							<a href={crumb.href} class="hover:text-primary-600">{crumb.label}</a>
						{:else}
							<span>{crumb.label}</span>
						{/if}
					{/each}
				</nav>
			{/if}
			
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">{title}</h1>
					{#if subtitle}
						<p class="mt-1 text-gray-600">{subtitle}</p>
					{/if}
				</div>
				
				{#if children}
					<div class="flex items-center gap-2">
						{@render children()}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div> 