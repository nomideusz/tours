<script lang="ts">
	import { page } from '$app/stores';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Sticker from 'lucide-svelte/icons/sticker';
	import FileText from 'lucide-svelte/icons/file-text';
	import Image from 'lucide-svelte/icons/image';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	
	let currentPath = $derived($page.url.pathname);
	
	const navItems = [
		{
			href: '/marketing',
			label: 'Overview',
			icon: Sparkles,
			color: 'primary'
		},
		{
			href: '/marketing/business-cards',
			label: 'Business Cards',
			icon: CreditCard,
			color: 'primary'
		},
		{
			href: '/marketing/stickers',
			label: 'Stickers',
			icon: Sticker,
			color: 'orange'
		},
		{
			href: '/marketing/flyers',
			label: 'Flyers',
			icon: FileText,
			color: 'teal'
		},
		{
			href: '/marketing/social',
			label: 'Social Media',
			icon: Image,
			color: 'purple'
		}
	];
	
	function isActive(href: string): boolean {
		if (href === '/marketing/business-cards') {
			return currentPath === '/marketing/business-cards';
		}
		if (href === '/marketing') {
			return currentPath === '/marketing';
		}
		return currentPath.startsWith(href);
	}
</script>

<nav class="mb-6">
	{#if currentPath !== '/marketing'}
		<div class="flex items-center justify-between mb-4">
			<a href="/marketing" class="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-1">
				<ArrowLeft class="w-4 h-4" />
				Marketing Hub
			</a>
		</div>
	{/if}
	
	<div class="flex flex-wrap gap-2">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all {isActive(item.href) 
					? `bg-${item.color}-50 text-${item.color}-700 border-${item.color}-200` 
					: 'bg-bg-secondary text-secondary hover:bg-bg-tertiary'} border marketing-nav-item"
				style="{isActive(item.href) 
					? `background: var(--color-${item.color}-50); color: var(--color-${item.color}-700); border-color: var(--color-${item.color}-200);`
					: 'background: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-primary);'}"
				data-active={isActive(item.href)}
				data-color={item.color}
			>
				<svelte:component this={item.icon} class="w-4 h-4" />
				{item.label}
			</a>
		{/each}
	</div>
</nav>

<style>
	/* Force dark icons on light backgrounds in dark mode */
	:global(.dark) .marketing-nav-item[data-active="true"] :global(svg) {
		color: inherit !important;
		opacity: 1 !important;
	}
	
	/* Ensure proper contrast for each color */
	:global(.dark) .marketing-nav-item[data-active="true"][data-color="primary"] {
		color: #2563EB !important;
	}
	
	:global(.dark) .marketing-nav-item[data-active="true"][data-color="orange"] {
		color: #EA580C !important;
	}
	
	:global(.dark) .marketing-nav-item[data-active="true"][data-color="teal"] {
		color: #0F766E !important;
	}
	
	:global(.dark) .marketing-nav-item[data-active="true"][data-color="purple"] {
		color: #7C3AED !important;
	}
</style> 