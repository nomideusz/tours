<script lang="ts">
	import type { Tour } from '$lib/types.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCodeIcon from 'lucide-svelte/icons/qr-code';
	import Users from 'lucide-svelte/icons/users';
	import Clock from 'lucide-svelte/icons/clock';

	type Props = {
		tour: Tour;
		/**
		 * Optional count information to display next to the tour name
		 * @example { icon: Calendar, label: "5 time slots", detail: "3 upcoming" }
		 */
		countInfo?: {
			icon: any;
			label: string;
			detail?: string;
		};
	};

	let { tour, countInfo }: Props = $props();
</script>

<!-- Tour Status & Name Indicator -->
<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="flex items-center gap-2">
		<h1 class="text-lg font-semibold text-gray-900 truncate">{tour.name}</h1>
		<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
			tour.status === 'active' 
				? 'bg-green-100 text-green-800 border border-green-200' 
				: 'bg-amber-100 text-amber-800 border border-amber-200'
		}">
			{#if tour.status === 'active'}
				<div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
				Live
			{:else}
				<div class="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></div>
				Draft
			{/if}
		</span>
	</div>
	
	{#if countInfo}
		<div class="flex items-center gap-1 text-sm text-gray-600">
			<countInfo.icon class="h-4 w-4" />
			<span>{countInfo.label}</span>
			{#if countInfo.detail}
				<span class="text-gray-400">•</span>
				<span>{countInfo.detail}</span>
			{/if}
		</div>
	{/if}
</div> 