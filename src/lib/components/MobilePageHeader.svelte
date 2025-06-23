<script lang="ts">
	import type { ComponentType } from 'svelte';
	
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

	let {
		title,
		statusButton = null,
		secondaryInfo = null,
		quickActions = [],
		infoItems = [],
		class: className = ''
	} = $props<{
		title: string;
		statusButton?: {
			label: string;
			onclick: () => void;
			disabled?: boolean;
			color?: string;
			textColor?: string;
			backgroundColor?: string;
			dotColor: string;
			tooltip?: string;
		} | null;
		secondaryInfo?: string | null;
		quickActions?: QuickAction[];
		infoItems?: InfoItem[];
		class?: string;
	}>();
</script>

<!-- Mobile Compact Header -->
<div class="sm:hidden {className}">
	<div class="flex items-start justify-between mb-3">
		<div class="flex-1 min-w-0">
			<h1 class="text-xl font-bold truncate" style="color: var(--text-primary);">{title}</h1>
			<div class="flex items-center gap-2 mt-1">
				{#if statusButton}
					<button
						onclick={statusButton.onclick}
						disabled={statusButton.disabled}
						title={statusButton.tooltip}
						class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200"
						style="color: {statusButton.textColor || 'var(--text-primary)'}; background: {statusButton.backgroundColor || 'var(--bg-tertiary)'};"
					>
						<span class="w-1.5 h-1.5 rounded-full {statusButton.dotColor}"></span>
						{statusButton.label}
					</button>
				{/if}
				{#if secondaryInfo}
					<span class="text-xs" style="color: var(--text-tertiary);">•</span>
					<span class="text-xs font-medium" style="color: var(--text-secondary);">{secondaryInfo}</span>
				{/if}
			</div>
		</div>
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