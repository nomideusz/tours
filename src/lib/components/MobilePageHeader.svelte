<script lang="ts">
	import type { ComponentType } from 'svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	
	interface QuickAction {
		label: string;
		icon: ComponentType;
		onclick: () => void;
		variant?: 'primary' | 'secondary';
		size?: 'small' | 'icon';
		disabled?: boolean;
	}

	interface InfoItem {
		icon: ComponentType;
		label: string;
		value: string;
	}

	interface PrimaryAction {
		label: string;
		icon: ComponentType;
		onclick: () => void;
		variant?: 'primary' | 'secondary';
		disabled?: boolean;
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
		class?: string;
	}>();
</script>

<!-- Mobile Compact Header -->
<div class="sm:hidden {className}">
	<!-- Back Button (if enabled) -->
	{#if showBackButton && onBackClick}
		<div class="flex items-center gap-3 mb-3">
			<button
				onclick={onBackClick}
				class="flex items-center gap-2 text-sm font-medium transition-colors py-1 -ml-1"
				style="color: var(--color-primary-600);"
				onmouseenter={(e) => e.currentTarget.style.color = 'var(--color-primary-700)'}
				onmouseleave={(e) => e.currentTarget.style.color = 'var(--color-primary-600)'}
			>
				<ArrowLeft class="h-4 w-4" />
				{backButtonLabel}
			</button>
		</div>
	{/if}

	<div class="flex items-start justify-between mb-3">
		<div class="flex-1 min-w-0 {primaryAction ? 'pr-3' : ''}">
			<h1 class="text-xl font-bold truncate" style="color: var(--text-primary); font-size: 1.25rem; line-height: 1.75rem;">{title}</h1>
			<div class="flex items-center gap-2 mt-1">
				{#if statusButton}
					<button
						onclick={statusButton.onclick}
						disabled={statusButton.disabled}
						title={statusButton.tooltip}
						class="tour-status-badge tour-status-badge--small {statusButton.className || ''}"
						style="{statusButton.textColor || statusButton.backgroundColor || statusButton.color ? `color: ${statusButton.textColor || 'var(--text-primary)'}; background: ${statusButton.backgroundColor || 'var(--bg-tertiary)'};` : ''}"
					>
						{#if statusButton.dotColor || statusButton.className}
							<span class="tour-status-indicator {statusButton.className ? 
								(statusButton.className.includes('active') ? 'tour-status-indicator--active' : 
								statusButton.className.includes('draft') ? 'tour-status-indicator--draft' : '') 
								: ''}" 
								style="{statusButton.dotColor ? `background: ${statusButton.dotColor}` : ''}"></span>
						{/if}
						{statusButton.label}
					</button>
				{/if}
				{#if secondaryInfo}
					<span class="text-xs" style="color: var(--text-tertiary);">•</span>
					<span class="text-xs font-medium" style="color: var(--text-secondary);">{secondaryInfo}</span>
				{/if}
			</div>
		</div>
		
		<!-- Primary Action Button -->
		{#if primaryAction}
			<button 
				onclick={primaryAction.onclick} 
				disabled={primaryAction.disabled}
				class="button-{primaryAction.variant || 'primary'} button--small button--gap flex-shrink-0"
			>
				<primaryAction.icon class="h-3 w-3" />
				{primaryAction.label}
			</button>
		{/if}
	</div>
	
	<!-- Mobile Quick Actions -->
	{#if quickActions.length > 0}
		<div class="flex gap-2 mb-4">
			{#each quickActions as action}
				<button 
					onclick={action.onclick} 
					disabled={action.disabled}
					class="flex-1 button-{action.variant || 'secondary'} button--small button--gap justify-center"
					class:button--icon={action.size === 'icon'}
					class:flex-none={action.size === 'icon'}
				>
					<action.icon class="h-3 w-3" />
					{#if action.size !== 'icon'}{action.label}{/if}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Mobile Compact Info Grid -->
	{#if infoItems.length > 0}
		<div class="p-3 rounded-lg mb-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="grid grid-cols-2 gap-2 text-xs">
				{#each infoItems as item}
					<div class="flex items-center gap-1" style="color: var(--text-secondary);">
						<item.icon class="h-3 w-3 flex-shrink-0" />
						<span class="truncate">{item.label}: {item.value}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div> 