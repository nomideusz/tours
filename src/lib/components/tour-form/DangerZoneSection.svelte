<!--
================================================================================
DANGER ZONE SECTION COMPONENT
================================================================================

Handles tour deletion interface:
- Shows delete button (disabled if tour has future bookings)
- Different layouts for mobile and desktop
- Links to view bookings if deletion is blocked

Extracted from TourForm.svelte to improve maintainability.
================================================================================
-->

<script lang="ts">
	import Calendar from 'lucide-svelte/icons/calendar';
	import Tooltip from '../ui/feedback/Tooltip.svelte';

	interface Props {
		tourId?: string;
		hasFutureBookings?: boolean;
		isDeleting?: boolean;
		onDelete?: () => void;
	}

	let {
		tourId,
		hasFutureBookings = false,
		isDeleting = false,
		onDelete
	}: Props = $props();
</script>

{#if onDelete}
	<!-- Mobile: Compact Danger Zone -->
	<div class="sm:hidden px-4">
		<div class="p-3 rounded-lg danger-zone-container-mobile">
			<div class="flex items-center justify-between gap-3">
				<div class="flex-1">
					<p class="text-sm font-semibold" style="color: var(--color-danger-900);">Delete Tour</p>
					<p class="text-xs mt-0.5" style="color: var(--color-danger-700);">
						{#if hasFutureBookings}
							Has upcoming bookings
						{:else}
							Permanent action
						{/if}
					</p>
				</div>
				<div>
					{#if hasFutureBookings}
						<button
							type="button"
							class="text-xs px-3 py-2 rounded-lg font-medium cursor-not-allowed opacity-50"
							style="background: var(--bg-secondary); color: var(--text-secondary);"
							disabled
						>
							Locked
						</button>
					{:else}
						<button
							type="button"
							onclick={onDelete}
							class="text-xs px-3 py-2 rounded-lg font-medium"
							style="background: var(--color-danger-600); color: white;"
							disabled={isDeleting}
						>
							{#if isDeleting}
								Deleting...
							{:else}
								Delete
							{/if}
						</button>
					{/if}
				</div>
			</div>
			{#if hasFutureBookings}
				<div class="mt-2 pt-2 border-t" style="border-color: var(--color-danger-200);">
					<a
						href="/bookings?tour={tourId}"
						class="text-xs font-medium underline"
						style="color: var(--color-primary-600);"
					>
						View bookings →
					</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Desktop: Full Danger Zone -->
	<div class="hidden sm:block rounded-xl danger-zone-container">
		<div class="px-4 py-4 sm:p-4 border-b danger-zone-header">
			<h3 class="font-semibold danger-zone-title">Danger Zone</h3>
		</div>
		<div class="px-4 py-4 sm:p-4">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex-1">
					<p class="font-medium" style="color: var(--color-danger-900);">Delete this tour</p>
					{#if hasFutureBookings}
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">
							Cannot delete tour with upcoming bookings. Cancel all future bookings first, then deletion will be available.
						</p>
						<p class="text-sm mt-2" style="color: var(--color-primary-600);">
							<a
								href="/bookings?tour={tourId}"
								class="text-sm underline hover:no-underline"
								style="color: var(--color-primary-600);"
							>
								View bookings →
							</a>
						</p>
					{:else}
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">
							This will permanently delete the tour and all data, including historical bookings. This action cannot be undone.
						</p>
					{/if}
				</div>
				<div class="flex-shrink-0">
					{#if hasFutureBookings}
						<Tooltip text="Cannot delete tour with upcoming bookings" position="top">
							<button
								type="button"
								class="button-secondary button-small w-full sm:w-auto cursor-not-allowed opacity-50"
								disabled
							>
								<Calendar class="w-4 h-4 mr-2" />
								Has Upcoming Bookings
							</button>
						</Tooltip>
					{:else}
						<button
							type="button"
							onclick={onDelete}
							class="button-danger button-small w-full sm:w-auto"
							disabled={isDeleting}
							title="Delete this tour permanently"
						>
							{#if isDeleting}
								<div class="w-4 h-4 rounded-full animate-spin mr-2" style="border: 2px solid currentColor; border-top-color: transparent;"></div>
								Deleting...
							{:else}
								Delete Tour
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.danger-zone-container-mobile {
		background: var(--color-danger-50);
		border: 1px solid var(--color-danger-200);
	}

	.danger-zone-container {
		border: 2px solid var(--color-danger-200);
		background: var(--bg-primary);
	}

	.danger-zone-header {
		border-color: var(--color-danger-200);
	}

	.danger-zone-title {
		color: var(--color-danger-900);
	}
</style>
