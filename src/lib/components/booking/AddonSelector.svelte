<script lang="ts">
	import type { OptionalAddon } from '$lib/types.js';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Circle from 'lucide-svelte/icons/circle';
	import Info from 'lucide-svelte/icons/info';

	interface Props {
		addons: OptionalAddon[];
		selectedAddonIds: string[];
		currencySymbol: string;
		onAddonsChange: (selectedIds: string[]) => void;
	}

	let { 
		addons,
		selectedAddonIds = $bindable([]),
		currencySymbol,
		onAddonsChange
	}: Props = $props();

	// Separate required and optional addons
	let requiredAddons = $derived(addons.filter(addon => addon.required));
	let optionalAddons = $derived(addons.filter(addon => !addon.required));

	// Auto-select all required add-ons on mount
	$effect(() => {
		const requiredIds = requiredAddons.map(a => a.id);
		const missingRequired = requiredIds.filter(id => !selectedAddonIds.includes(id));
		if (missingRequired.length > 0) {
			selectedAddonIds = [...selectedAddonIds, ...missingRequired];
			onAddonsChange(selectedAddonIds);
		}
	});

	function toggleAddon(addonId: string, required: boolean) {
		if (required) return; // Can't toggle required addons - they're mandatory
		
		if (selectedAddonIds.includes(addonId)) {
			selectedAddonIds = selectedAddonIds.filter(id => id !== addonId);
		} else {
			selectedAddonIds = [...selectedAddonIds, addonId];
		}
		onAddonsChange(selectedAddonIds);
	}

	function isSelected(addonId: string): boolean {
		return selectedAddonIds.includes(addonId);
	}

	// Icon mapping
	const iconMap: Record<string, string> = {
		'🚗': 'Car',
		'🏨': 'Hotel',
		'🍽️': 'Meal',
		'📸': 'Photos',
		'🎧': 'Audio',
		'🗺️': 'Map',
		'🎒': 'Gear',
		'default': '+'
	};

	function getIconLabel(icon?: string): string {
		return icon && iconMap[icon] ? iconMap[icon] : iconMap['default'];
	}
</script>

<div class="space-y-4">
	<div>
		<div class="form-label">Additional Services</div>
		<p class="text-sm mt-1" style="color: var(--text-secondary);">
			{#if requiredAddons.length > 0}
				Some services are required for this tour
			{:else}
				Optional extras to enhance your experience
			{/if}
		</p>
	</div>

	{#if addons.length === 0}
		<div class="p-4 rounded-lg text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<p class="text-sm" style="color: var(--text-secondary);">
				No add-ons available for this tour
			</p>
		</div>
	{:else}
		<div>
			<!-- Required Add-ons (mandatory - auto-selected but cost extra) -->
			{#if requiredAddons.length > 0}
				<div class="required-addons-section">
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xs font-bold" style="color: var(--color-error-700);">
							⚠️ REQUIRED
						</span>
						<span class="text-xs" style="color: var(--text-secondary);">
							(Mandatory for this tour - cost separate from guiding fee)
						</span>
					</div>
					<div class="addons-grid">
						{#each requiredAddons as addon}
							<div class="addon-card required selected">
								<div class="flex items-start gap-3 flex-1">
									<div class="addon-checkbox selected locked">
										<CheckCircle class="w-5 h-5" />
									</div>
									<div class="flex-1">
										<div class="addon-name">
											{#if addon.icon}
												<span class="addon-icon-emoji">{addon.icon}</span>
											{/if}
											{addon.name}
											<span class="required-badge">Required</span>
										</div>
										{#if addon.description}
											<div class="addon-description">{addon.description}</div>
										{/if}
									</div>
								</div>
								<div class="addon-price required">
									+{currencySymbol}{addon.price.toFixed(2)}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Optional Add-ons (selectable) -->
			{#if optionalAddons.length > 0}
				{#if requiredAddons.length > 0}
					<div class="optional-extras-header text-xs font-medium mb-2 mt-4" style="color: var(--text-tertiary);">
						OPTIONAL EXTRAS
					</div>
				{/if}
				<div class="addons-grid">
					{#each optionalAddons as addon}
						{@const selected = isSelected(addon.id)}
						<button
							type="button"
							class="addon-card optional {selected ? 'selected' : ''}"
							onclick={() => toggleAddon(addon.id, addon.required)}
						>
							<div class="flex items-start gap-3 flex-1">
								<div class="addon-checkbox {selected ? 'selected' : ''}">
									{#if selected}
										<CheckCircle class="w-5 h-5" />
									{:else}
										<Circle class="w-5 h-5" />
									{/if}
								</div>
								<div class="flex-1 text-left">
									<div class="addon-name">
										{#if addon.icon}
											<span class="addon-icon-emoji">{addon.icon}</span>
										{/if}
										{addon.name}
									</div>
									{#if addon.description}
										<div class="addon-description">{addon.description}</div>
									{/if}
								</div>
							</div>
							<div class="addon-price">
								+{currencySymbol}{addon.price.toFixed(2)}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Info box -->
		{#if optionalAddons.length > 0}
			<div class="info-box">
				<Info class="w-4 h-4 flex-shrink-0" style="color: var(--color-primary-600);" />
				<div class="text-xs" style="color: var(--text-secondary);">
					<p>Choose additional services to enhance your experience</p>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Hidden input for form submission -->
	<input type="hidden" name="selectedAddonIds" value={JSON.stringify(selectedAddonIds)} />
</div>

<style>
	.required-addons-section {
		padding: 0.75rem;
		padding-bottom: 1rem;
		margin-bottom: 0.5rem;
		border-radius: 0.5rem;
		background: var(--color-error-50);
		border: 1.5px solid var(--color-error-200);
	}

	.addons-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	@media (min-width: 768px) {
		.addons-grid {
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		}
	}

	@media (max-width: 767px) {
		.addons-grid {
			max-width: 400px;
			margin: 0 auto;
		}
	}

	.addon-card {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.875rem;
		border-radius: 0.625rem;
		border: 1.5px solid var(--border-primary);
		background: var(--bg-primary);
		transition: all 0.2s ease;
		height: 100%;
	}

	.addon-card.optional {
		cursor: pointer;
	}

	.addon-card.optional:hover {
		border-color: var(--color-primary-500);
		background: var(--bg-secondary);
	}

	.addon-card.optional.selected {
		border-color: var(--color-primary-600);
		background: var(--color-primary-50);
	}

	.addon-card.required {
		background: var(--bg-primary);
		border-color: var(--color-error-300);
		cursor: not-allowed;
	}

	.addon-card.required.selected {
		background: var(--bg-primary);
		border-color: var(--color-error-500);
	}

	.addon-checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		transition: all 0.2s ease;
	}

	.addon-checkbox.selected {
		color: var(--color-primary-700);
	}

	.addon-checkbox.locked {
		color: var(--color-error-600);
		cursor: not-allowed;
	}

	.addon-icon-emoji {
		font-size: 1rem;
		display: inline-flex;
		align-items: center;
		line-height: 1;
		vertical-align: middle;
		flex-shrink: 0;
		padding-bottom: 3px;
	}
	
	.addon-name {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
		margin-bottom: 0.125rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.addon-description {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-top: 0.25rem;
	}

	.addon-price {
		font-weight: 700;
		font-size: 0.9375rem;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.addon-card.optional.selected .addon-price {
		color: var(--color-primary-700);
	}

	.addon-price.required {
		color: var(--color-error-700);
		font-weight: 800;
	}

	.required-badge {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: var(--color-error-100);
		color: var(--color-error-700);
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		margin-left: 0.5rem;
		letter-spacing: 0.025em;
	}

	.info-box {
		display: flex;
		align-items: start;
		gap: 0.625rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		margin-top: 1rem;
	}

	@media (max-width: 767px) {
		.info-box {
			max-width: 400px;
			margin-left: auto;
			margin-right: auto;
		}

		.required-addons-section {
			max-width: 400px;
			margin-left: auto;
			margin-right: auto;
			margin-bottom: 1rem;
		}

		.optional-extras-header {
			max-width: 400px;
			margin-left: auto;
			margin-right: auto;
			text-align: center;
		}
	}

	@media (max-width: 450px) {
		.addons-grid {
			max-width: 100%;
		}

		.info-box {
			max-width: 100%;
			font-size: 0.6875rem;
			padding: 0.625rem;
		}

		.required-addons-section {
			max-width: 100%;
			padding: 0.625rem;
		}

		.optional-extras-header {
			max-width: 100%;
		}

		.addon-card {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.addon-name {
			font-size: 0.8125rem;
		}

		.addon-description {
			font-size: 0.6875rem;
		}

		.addon-price {
			font-size: 0.875rem;
		}

		.required-badge {
			font-size: 0.5625rem;
			padding: 0.0625rem 0.25rem;
		}
	}
</style>
