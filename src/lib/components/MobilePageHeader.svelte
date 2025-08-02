<script lang="ts">
	import type { ComponentType } from 'svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	
	interface QuickAction {
		label: string;
		icon: ComponentType;
		onclick: () => void;
		variant?: 'primary' | 'secondary' | 'accent';
		size?: 'small' | 'icon';
		disabled?: boolean;
		badge?: string | number;
	}

	interface InfoItem {
		icon: ComponentType;
		label: string;
		value: string;
		trend?: 'up' | 'down' | 'neutral';
		accent?: boolean;
	}

	interface PrimaryAction {
		label: string;
		icon: ComponentType;
		onclick: () => void;
		variant?: 'primary' | 'secondary' | 'accent';
		disabled?: boolean;
		badge?: string | number;
	}

	interface StatCard {
		icon: ComponentType;
		value: string;
		label: string;
		trend?: 'up' | 'down' | 'neutral';
		accent?: boolean;
		onclick?: () => void;
	}

	let {
		title,
		statusButton = null,
		secondaryInfo = null,
		showBackButton = false,
		backButtonLabel = 'Back',
		onBackClick = null,
		primaryAction = null,
		quickActions = [],
		infoItems = [],
		statCards = [],
		showSearchBar = false,
		searchValue = '',
		onSearchChange = null,
		searchPlaceholder = 'Search...',
		class: className = ''
	} = $props<{
		title: string;
		statusButton?: {
			label: string;
			onclick?: () => void;
			disabled?: boolean;
			color?: string;
			textColor?: string;
			backgroundColor?: string;
			dotColor?: string;
			className?: string;
			tooltip?: string;
		} | null;
		secondaryInfo?: string | null;
		showBackButton?: boolean;
		backButtonLabel?: string;
		onBackClick?: (() => void) | null;
		primaryAction?: PrimaryAction | null;
		quickActions?: QuickAction[];
		infoItems?: InfoItem[];
		statCards?: StatCard[];
		showSearchBar?: boolean;
		searchValue?: string;
		onSearchChange?: ((value: string) => void) | null;
		searchPlaceholder?: string;
		class?: string;
	}>();

	// Handle search input
	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (onSearchChange) {
			onSearchChange(target.value);
		}
	}
</script>

<!-- Mobile Compact Header -->
<div class="sm:hidden {className}">
	<!-- Back Button (if enabled) -->
	{#if showBackButton && onBackClick}
		<div class="flex items-center gap-3 mb-2">
			<button
				onclick={onBackClick}
				class="flex items-center gap-2 text-sm font-medium transition-all duration-200 py-1 px-2 -ml-2 rounded-lg active:scale-95"
				style="color: var(--color-primary-600);"
				onmouseenter={(e) => {
					e.currentTarget.style.color = 'var(--color-primary-700)';
					e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
				}}
				onmouseleave={(e) => {
					e.currentTarget.style.color = 'var(--color-primary-600)';
					e.currentTarget.style.backgroundColor = 'transparent';
				}}
			>
				<ArrowLeft class="h-4 w-4" />
				{backButtonLabel}
			</button>
		</div>
	{/if}

	<!-- Header Section -->
	<div class="mb-4">
		<div class="flex items-start justify-between mb-2">
			<div class="flex-1 min-w-0 {primaryAction ? 'pr-4' : ''}">
				<h1 class="text-xl sm:text-2xl font-bold truncate leading-tight" style="color: var(--text-primary);">{title}</h1>
				<div class="flex items-center gap-2 mt-1">
					{#if statusButton}
						<span
							onclick={statusButton.onclick}
							role="button"
							tabindex="0"
							title={statusButton.tooltip}
							class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border cursor-pointer transition-all duration-200 active:scale-95 {statusButton.className || ''}"
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); statusButton.onclick?.(); } }}
						>
							{statusButton.label}
						</span>
					{/if}
					{#if secondaryInfo}
						<span class="text-sm opacity-60" style="color: var(--text-tertiary);">•</span>
						<span class="text-sm font-medium" style="color: var(--text-secondary);">{secondaryInfo}</span>
					{/if}
				</div>
			</div>
			
			<!-- Primary Action Button -->
			{#if primaryAction}
				<button 
					onclick={primaryAction.onclick} 
					disabled={primaryAction.disabled}
					class="button-{primaryAction.variant || 'primary'} button--small flex-shrink-0 relative transition-all duration-200 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
				>
					<primaryAction.icon class="h-3 w-3 flex-shrink-0" />
					<span class="text-xs font-medium">{primaryAction.label}</span>
					{#if primaryAction.badge}
						<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
							{primaryAction.badge}
						</span>
					{/if}
				</button>
			{/if}
		</div>
	</div>

	<!-- Search Bar -->
	{#if showSearchBar}
		<div class="mb-4">
			<div class="relative">
				<input
					type="text"
					value={searchValue}
					oninput={handleSearchInput}
					placeholder={searchPlaceholder}
					class="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-offset-1"
					style="
						background: var(--bg-primary);
						border-color: var(--border-primary);
						color: var(--text-primary);
					"
					onfocus={(e) => {
						e.currentTarget.style.borderColor = 'var(--color-primary-300)';
						e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
					}}
					onblur={(e) => {
						e.currentTarget.style.borderColor = 'var(--border-primary)';
						e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
					}}
				/>
			</div>
		</div>
	{/if}
	
	<!-- Mobile Quick Actions -->
	{#if quickActions.length > 0}
		<div class="flex gap-2 mb-4">
			{#each quickActions as action}
				<button 
					onclick={action.onclick} 
					disabled={action.disabled}
					class="relative flex-1 button-{action.variant || 'secondary'} button--small button--gap justify-center transition-all duration-200 active:scale-95"
					class:button--icon={action.size === 'icon'}
					class:flex-none={action.size === 'icon'}
					class:w-12={action.size === 'icon'}
				>
					<action.icon class="h-4 w-4" />
					{#if action.size !== 'icon'}{action.label}{/if}
					{#if action.badge}
						<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
							{action.badge}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Enhanced Stats Cards -->
	{#if statCards.length > 0}
		<div class="grid grid-cols-2 gap-3 mb-4">
			{#each statCards as card}
				{#if card.onclick}
					<button
						class="p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-95 text-left"
						style="
							background: {card.accent ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
							border-color: {card.accent ? 'var(--color-primary-200)' : 'var(--border-primary)'};
							width: 100%;
						"
						onclick={card.onclick}
					>
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg" style="background: {card.accent ? 'var(--color-primary-100)' : 'var(--bg-secondary)'};">
								<card.icon class="h-5 w-5" style="color: {card.accent ? 'var(--color-primary-600)' : 'var(--text-secondary)'};" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm sm:text-lg font-bold truncate" style="color: var(--text-primary);">{card.value}</p>
								<p class="text-xs font-medium truncate" style="color: var(--text-secondary);">{card.label}</p>
							</div>
						</div>
					</button>
				{:else}
					<div 
						class="p-4 rounded-xl border-2 transition-all duration-200"
						style="
							background: {card.accent ? 'var(--color-primary-50)' : 'var(--bg-primary)'};
							border-color: {card.accent ? 'var(--color-primary-200)' : 'var(--border-primary)'};
						"
					>
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg" style="background: {card.accent ? 'var(--color-primary-100)' : 'var(--bg-secondary)'};">
								<card.icon class="h-5 w-5" style="color: {card.accent ? 'var(--color-primary-600)' : 'var(--text-secondary)'};" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm sm:text-lg font-bold truncate" style="color: var(--text-primary);">{card.value}</p>
								<p class="text-xs font-medium truncate" style="color: var(--text-secondary);">{card.label}</p>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Mobile Compact Info Grid (fallback for simple info items) -->
	{#if infoItems.length > 0 && statCards.length === 0}
		<div class="grid grid-cols-2 gap-3 mb-4">
			{#each infoItems as item}
				<div class="p-3 rounded-xl border-2" style="background: var(--bg-primary); border-color: var(--border-primary);">
					<div class="flex items-center gap-2">
						<item.icon class="h-4 w-4 flex-shrink-0" style="color: var(--text-secondary);" />
						<div class="min-w-0 flex-1">
													<p class="text-xs sm:text-sm font-medium truncate" style="color: var(--text-primary);">{item.value}</p>
						<p class="text-[0.625rem] sm:text-xs truncate" style="color: var(--text-secondary);">{item.label}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Enhanced mobile touch targets - only for action buttons, not badges */
	.mobile-action-button {
		min-height: 44px;
		min-width: 44px;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}
	
	/* Apply touch targets to primary action and quick action buttons */
	button:not(.tour-status-badge):not(.status-badge) {
		min-height: 44px;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}
	
	/* Quick action buttons should have minimum width */
	button[class*="button-"] {
		min-width: 44px;
	}
	
	/* Mobile font optimizations */
	@media (max-width: 640px) {
		/* Ensure minimum readable font sizes */
		.text-xs {
			font-size: 0.75rem; /* 12px minimum */
		}
		
		.text-sm {
			font-size: 0.875rem; /* 14px */
		}
		
		/* Special handling for very small text */
		.text-\[0\.625rem\] {
			font-size: 0.6875rem; /* 11px minimum */
		}
	}
	
	/* Smooth transitions */
	* {
		-webkit-tap-highlight-color: transparent;
	}
	
	/* Enhanced focus styles for accessibility */
	button:focus-visible, 
	input:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}
	
	/* Status badges should not be affected by touch target rules */
	.tour-status-badge,
	button.tour-status-badge {
		min-height: auto !important;
		min-width: auto !important;
	}
</style> 