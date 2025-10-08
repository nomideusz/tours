<script lang="ts">
	import type { GroupPricingTier } from '$lib/types.js';

	interface Props {
		onApplyTemplate: (tiers: GroupPricingTier[]) => void;
	}

	let { onApplyTemplate }: Props = $props();

	// Template definitions
	const templates = {
		private_tour: [
			{ minParticipants: 1, maxParticipants: 2, price: 150, label: 'Solo/Couple' },
			{ minParticipants: 3, maxParticipants: 4, price: 250, label: 'Small Group' },
			{ minParticipants: 5, maxParticipants: 8, price: 400, label: 'Family/Group' }
		],
		small_group: [
			{ minParticipants: 1, maxParticipants: 3, price: 180, label: 'Mini Group' },
			{ minParticipants: 4, maxParticipants: 8, price: 320, label: 'Small Group' },
			{ minParticipants: 9, maxParticipants: 12, price: 480, label: 'Standard Group' }
		],
		walking_tour: [
			{ minParticipants: 1, maxParticipants: 2, price: 100, label: 'Private' },
			{ minParticipants: 3, maxParticipants: 6, price: 180, label: 'Small Group' },
			{ minParticipants: 7, maxParticipants: 12, price: 300, label: 'Group' }
		],
		vehicle_tour: [
			{ minParticipants: 1, maxParticipants: 4, price: 200, label: 'Car (1-4)' },
			{ minParticipants: 5, maxParticipants: 8, price: 350, label: 'Minivan (5-8)' }
		]
	};
</script>

<div class="p-4 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
	<p class="text-sm mb-3" style="color: var(--text-secondary);">
		Quick Start Templates:
	</p>
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
		<button
			type="button"
			onclick={() => onApplyTemplate(templates.private_tour)}
			class="button-secondary button--small text-xs"
		>
			Private Tour
		</button>
		<button
			type="button"
			onclick={() => onApplyTemplate(templates.small_group)}
			class="button-secondary button--small text-xs"
		>
			Small Group
		</button>
		<button
			type="button"
			onclick={() => onApplyTemplate(templates.walking_tour)}
			class="button-secondary button--small text-xs"
		>
			Walking Tour
		</button>
		<button
			type="button"
			onclick={() => onApplyTemplate(templates.vehicle_tour)}
			class="button-secondary button--small text-xs"
		>
			Vehicle Tour
		</button>
	</div>
</div>

