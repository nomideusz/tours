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
				class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border marketing-nav-item {isActive(item.href) 
					? 'marketing-nav-active' 
					: 'marketing-nav-inactive'}"
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
	/* Base inactive state */
	.marketing-nav-inactive {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border-color: var(--border-primary);
	}
	
	.marketing-nav-inactive:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
	
	/* Active state - light mode with subtle tints */
	.marketing-nav-active[data-color="primary"] {
		background-color: rgba(250, 107, 93, 0.08);
		color: #e8523e;
		border-color: rgba(250, 107, 93, 0.2);
	}
	
	.marketing-nav-active[data-color="orange"] {
		background-color: rgba(237, 137, 54, 0.08);
		color: #dd6b20;
		border-color: rgba(237, 137, 54, 0.2);
	}
	
	.marketing-nav-active[data-color="teal"] {
		background-color: rgba(79, 157, 166, 0.08);
		color: #0d9488;
		border-color: rgba(79, 157, 166, 0.2);
	}
	
	.marketing-nav-active[data-color="purple"] {
		background-color: rgba(139, 92, 246, 0.08);
		color: #7c3aed;
		border-color: rgba(139, 92, 246, 0.2);
	}
	
	/* Dark mode adjustments */
	[data-theme="dark"] .marketing-nav-inactive {
		background: transparent;
		color: var(--text-secondary);
		border-color: var(--border-primary);
	}
	
	[data-theme="dark"] .marketing-nav-inactive:hover {
		background: var(--bg-secondary);
	}
	
	/* Dark mode active states */
	[data-theme="dark"] .marketing-nav-active[data-color="primary"] {
		background-color: rgba(250, 107, 93, 0.15);
		color: #ff8a73;
		border-color: rgba(250, 107, 93, 0.3);
	}
	
	[data-theme="dark"] .marketing-nav-active[data-color="orange"] {
		background-color: rgba(255, 173, 90, 0.15);
		color: #ffad5a;
		border-color: rgba(255, 173, 90, 0.3);
	}
	
	[data-theme="dark"] .marketing-nav-active[data-color="teal"] {
		background-color: rgba(79, 157, 166, 0.15);
		color: #5eead4;
		border-color: rgba(79, 157, 166, 0.3);
	}
	
	[data-theme="dark"] .marketing-nav-active[data-color="purple"] {
		background-color: rgba(167, 139, 250, 0.15);
		color: #a78bfa;
		border-color: rgba(167, 139, 250, 0.3);
	}
	
	/* Ensure icons inherit text color */
	.marketing-nav-item svg {
		color: inherit;
		opacity: 1;
	}
</style> 