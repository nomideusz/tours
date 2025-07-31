<script lang="ts">
	import { goto } from '$app/navigation';
	import MapPin from 'lucide-svelte/icons/map-pin';
	
	type LogoVariant = 'modern' | 'minimal' | 'rounded' | 'serif' | 'icon';
	type LogoSize = 'small' | 'default' | 'large' | 'xl';
	
	let { 
		variant = 'modern' as LogoVariant,
		size = 'default' as LogoSize,
		textSize = undefined,
		iconSize = undefined,
		href = '/dashboard',
		showIcon = false,
		iconSrc = undefined,
		showIconBackground = true,
		showText = true,
		class: className = ''
	} = $props<{
		variant?: LogoVariant;
		size?: LogoSize;
		textSize?: LogoSize;
		iconSize?: LogoSize;
		href?: string;
		showIcon?: boolean;
		iconSrc?: string;
		showIconBackground?: boolean;
		showText?: boolean;
		class?: string;
	}>();
	
	// Use individual sizes if provided, otherwise fall back to main size
	const effectiveTextSize = textSize || size;
	const effectiveIconSize = iconSize || size;
	
	const sizeClasses: Record<LogoSize, string> = {
		small: 'text-base',
		default: 'text-lg lg:text-xl',
		large: 'text-xl lg:text-2xl',
		xl: 'text-2xl lg:text-3xl'
	};
	
	const iconSizes: Record<LogoSize, string> = {
		small: 'h-4 w-4',
		default: 'h-5 w-5',
		large: 'h-6 w-6',
		xl: 'h-8 w-8'
	};
</script>

<a 
	{href}
	class="flex items-center gap-2 transition-all nav-link h-full pr-2 {sizeClasses[effectiveTextSize as LogoSize]} {className}"
	style="color: var(--text-primary);"
>
	{#if showIcon || variant === 'icon'}
		{#if showIconBackground}
			<div class="rounded-md p-1.5 flex items-center justify-center" style="background: var(--color-primary-100);">
				{#if iconSrc}
					<!-- PNG/image icon -->
					<img 
						src={iconSrc} 
						alt="Logo icon"
						class="logo-icon-image {iconSizes[effectiveIconSize as LogoSize]}"
						style="object-fit: contain;"
					/>
				{:else}
					<!-- Default SVG icon -->
					<MapPin class={iconSizes[effectiveIconSize as LogoSize]} style="color: var(--color-primary-600);" />
				{/if}
			</div>
		{:else}
			<!-- No background container -->
			{#if iconSrc}
				<!-- PNG/image icon -->
				<img 
					src={iconSrc} 
					alt="Logo icon"
					class="logo-icon-image {iconSizes[effectiveIconSize as LogoSize]}"
					style="object-fit: contain;"
				/>
			{:else}
				<!-- Default SVG icon -->
				<MapPin class={iconSizes[effectiveIconSize as LogoSize]} style="color: var(--color-primary-600);" />
			{/if}
		{/if}
	{/if}
	
	{#if showText}
		<div class="flex">
			{#if variant === 'modern' || variant === 'icon'}
				<!-- Modern: Bold name, lighter extension -->
				<span class="font-semibold tracking-tight logo-text">zaur</span><span class="font-normal opacity-60 logo-text">.app</span>
			{:else if variant === 'minimal'}
				<!-- Minimal: All lowercase, consistent weight -->
				<span class="font-medium tracking-tight logo-text">zaur.app</span>
			{:else if variant === 'rounded'}
				<!-- Rounded: With background -->
				<span class="px-2 py-0.5 rounded-md font-semibold tracking-tight logo-text" style="background: var(--bg-tertiary);">
					zaur
				</span>
				<span class="font-normal ml-1 opacity-70 logo-text">.app</span>
			{:else if variant === 'serif'}
				<!-- Original serif style -->
				<span class="logo-serif logo-text">zaur.app</span>
			{/if}
		</div>
	{/if}
</a>

<style>
	/* Text alignment and spacing normalization */
	.logo-text {
		font-family: var(--font-header); /* Use headings font for logo */
		line-height: 1;
		display: inline-flex;
		align-items: center;
		/* Fine-tune vertical alignment for Plus Jakarta Sans optical centering */
		transform: translateY(-1px);
	}

	/* Dark mode image inversion */
	.logo-icon-image {
		transition: filter 0.2s ease;
	}
	
	:global([data-theme="dark"]) .logo-icon-image {
		filter: invert(1) brightness(0.9);
	}

	/* Serif variant styles */
	.logo-serif {
		font-family: var(--font-header); /* Using headings font for consistency */
		font-weight: 500;
		letter-spacing: -0.025em;
	}

	/* Smooth hover effect - removed transform which can affect clickable area */
	a {
		position: relative;
		z-index: 100; /* Increased from 50 to ensure logo stays above all injected elements */
		pointer-events: auto !important; /* Force clickability */
		display: inline-flex !important; /* Ensure proper layout */
		isolation: isolate; /* Create new stacking context */
		align-items: center; /* Ensure icon and text are perfectly centered */
	}
	
	a:hover {
		opacity: 0.8;
	}
	
	/* Remove mobile adjustments since transform was removed */
</style> 