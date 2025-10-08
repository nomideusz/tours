<script lang="ts">
	import type { PricingModel } from '$lib/types.js';
	import User from 'lucide-svelte/icons/user';
	import Users from 'lucide-svelte/icons/users';
	import UserCog from 'lucide-svelte/icons/user-cog';
	import UsersRound from 'lucide-svelte/icons/users-round';
	import Settings from 'lucide-svelte/icons/settings';

	interface Props {
		selectedModel: PricingModel;
		onModelChange: (model: PricingModel) => void;
	}

	let { selectedModel = $bindable(), onModelChange }: Props = $props();
	
	// Ensure selectedModel has a default value
	$effect(() => {
		if (!selectedModel) {
			selectedModel = 'participant_categories';
		}
	});

	const pricingModels = [
		{
			value: 'participant_categories' as PricingModel,
			icon: UserCog,
			name: 'Per Person',
			badge: null
		},
		{
			value: 'group_tiers' as PricingModel,
			icon: UsersRound,
			name: 'Private Tour',
			badge: null
		}
	];

	function handleModelSelect(model: PricingModel) {
		selectedModel = model;
		onModelChange(model);
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
		{#each pricingModels as model}
			{@const IconComponent = model.icon}
			<button
				type="button"
				class="pricing-model-card {selectedModel === model.value ? 'selected' : ''}"
				onclick={() => handleModelSelect(model.value)}
			>
				<div class="icon-container">
					<IconComponent class="w-5 h-5" />
				</div>
				<div class="model-info">
					<div class="model-name">
						{model.name}
						{#if model.badge === 'new'}
							<span class="badge-new">New</span>
						{:else if model.badge === 'recommended'}
							<span class="badge-recommended">Recommended</span>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	/* Styles defined in pricing.css */
</style>

