<script lang="ts">
	import { page } from '$app/stores';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Sticker from 'lucide-svelte/icons/sticker';
	import FileText from 'lucide-svelte/icons/file-text';
	import Image from 'lucide-svelte/icons/image';
	
	let currentPath = $derived($page.url.pathname);
	
	const navItems = [
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
		return currentPath === href;
	}
</script>

<nav class="mb-6">
	<div class="flex flex-wrap gap-1 border-b border-border">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all marketing-nav-item {isActive(item.href) 
					? 'marketing-nav-active' 
					: 'marketing-nav-inactive'}"
				data-active={isActive(item.href)}
			>
				<item.icon class="w-4 h-4" />
				{item.label}
			</a>
		{/each}
	</div>
</nav>

<style>
	/* Base inactive state */
	.marketing-nav-inactive {
		position: relative;
		color: var(--text-secondary);
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}
	
	.marketing-nav-inactive:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}
	
	/* Active state */
	.marketing-nav-active {
		position: relative;
		color: var(--text-primary);
		border-bottom: 2px solid var(--color-primary-600);
		margin-bottom: -1px;
	}
	
	/* Ensure icons inherit text color */
	:global(.marketing-nav-item svg) {
		color: inherit;
		opacity: 1;
	}
</style> 