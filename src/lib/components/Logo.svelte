<script lang="ts">
	import { goto } from '$app/navigation';
	import MapPin from 'lucide-svelte/icons/map-pin';
	
	type LogoVariant = 'modern' | 'minimal' | 'rounded' | 'serif' | 'icon';
	type LogoSize = 'small' | 'default' | 'large';
	
	let { 
		variant = 'modern' as LogoVariant,
		size = 'default' as LogoSize,
		href = '/dashboard',
		showIcon = false,
		class: className = ''
	} = $props<{
		variant?: LogoVariant;
		size?: LogoSize;
		href?: string;
		showIcon?: boolean;
		class?: string;
	}>();
	
	const sizeClasses: Record<LogoSize, string> = {
		small: 'text-base',
		default: 'text-lg lg:text-xl',
		large: 'text-xl lg:text-2xl'
	};
	
	const iconSizes: Record<LogoSize, string> = {
		small: 'h-4 w-4',
		default: 'h-5 w-5',
		large: 'h-6 w-6'
	};
</script>

<a 
	{href}
	class="flex items-center gap-2 transition-all nav-link h-full px-2 {sizeClasses[size as LogoSize]} {className}"
	style="color: var(--text-primary);"
>
	{#if showIcon || variant === 'icon'}
		<div class="rounded-md p-1.5 flex items-center justify-center" style="background: var(--color-primary-100);">
			<MapPin class={iconSizes[size as LogoSize]} style="color: var(--color-primary-600);" />
		</div>
	{/if}
	
	{#if variant === 'modern' || variant === 'icon'}
		<!-- Modern: Bold name, lighter extension -->
		<span class="font-semibold tracking-tight">zaur</span>
		<span class="font-normal opacity-60">.app</span>
	{:else if variant === 'minimal'}
		<!-- Minimal: All lowercase, consistent weight -->
		<span class="font-medium tracking-tight">zaur.app</span>
	{:else if variant === 'rounded'}
		<!-- Rounded: With background -->
		<span class="px-2 py-0.5 rounded-md font-semibold tracking-tight" style="background: var(--bg-tertiary);">
			zaur
		</span>
		<span class="font-normal ml-1 opacity-70">.app</span>
	{:else if variant === 'serif'}
		<!-- Original serif style -->
		<span class="logo-serif">zaur.app</span>
	{/if}
</a>

<style>
	/* Smooth hover effect - removed transform which can affect clickable area */
	a {
		position: relative;
	}
	
	a:hover {
		opacity: 0.8;
	}
	
	/* Remove mobile adjustments since transform was removed */
</style> 