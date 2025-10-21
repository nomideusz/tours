<script lang="ts">
	type LogoVariant = 'modern' | 'minimal' | 'bold';
	type LogoSize = 'small' | 'default' | 'large' | 'xl';
	
	let { 
		variant = 'modern' as LogoVariant,
		size = 'default' as LogoSize,
		href = '/dashboard',
		class: className = ''
	} = $props<{
		variant?: LogoVariant;
		size?: LogoSize;
		href?: string;
		class?: string;
	}>();
	
	const sizeClasses: Record<LogoSize, string> = {
		small: 'text-base',
		default: 'text-lg lg:text-xl',
		large: 'text-xl lg:text-2xl',
		xl: 'text-2xl lg:text-3xl'
	};
</script>

<a 
	{href}
	class="logo-link {sizeClasses[size as LogoSize]} {className}"
>
	<div class="logo-text-container">
		{#if variant === 'bold'}
			<!-- Bold: All bold, professional -->
			<span class="logo-brand">zaur</span><span class="logo-extension">.app</span>
		{:else if variant === 'minimal'}
			<!-- Minimal: Lighter weight, clean -->
			<span class="logo-minimal">zaur.app</span>
		{:else}
			<!-- Modern (default): Bold brand, subtle extension -->
			<span class="logo-brand">zaur</span><span class="logo-extension">.app</span>
		{/if}
	</div>
</a>

<style>
	/* Logo link - clean and professional */
	.logo-link {
		position: relative;
		z-index: 100;
		display: inline-flex;
		align-items: center;
		text-decoration: none !important;
		transition: all var(--transition-base);
		color: var(--text-primary);
		pointer-events: auto !important;
		isolation: isolate;
	}
	
	.logo-link:hover {
		opacity: 0.85;
		transform: translateY(-1px);
	}

	/* Logo text container */
	.logo-text-container {
		display: flex;
		align-items: baseline;
		line-height: 1;
		font-family: var(--font-sans);
		letter-spacing: -0.03em;
	}

	/* Brand name - bold and prominent */
	.logo-brand {
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	/* Extension - subtle and refined */
	.logo-extension {
		font-weight: 600;
		color: var(--text-primary);
		opacity: 0.5;
		letter-spacing: -0.02em;
	}

	/* Minimal variant - clean and consistent */
	.logo-minimal {
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	/* Remove underline from professional-touches.css */
	.logo-link::after {
		display: none !important;
	}
</style> 