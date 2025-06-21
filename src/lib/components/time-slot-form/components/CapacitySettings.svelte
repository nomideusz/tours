<script lang="ts">
	import NumberInput from '$lib/components/NumberInput.svelte';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
	
	interface Props {
		capacity: number;
		availability: 'available' | 'cancelled';
		tourCapacity?: number;
		tourDuration?: number;
		duration: number;
		customDuration: number | null;
		errors: ValidationError[];
		isEditMode?: boolean;
		hasBookings?: boolean;
		currentSlot?: any;
		onCapacityChange: () => void;
		onResetDuration: () => void;
		onUseDefaultCapacity: () => void;
		isMobile?: boolean;
	}
	
	let { 
		capacity = $bindable(),
		availability = $bindable(),
		tourCapacity,
		tourDuration,
		duration,
		customDuration,
		errors,
		isEditMode = false,
		hasBookings = false,
		currentSlot,
		onCapacityChange,
		onResetDuration,
		onUseDefaultCapacity,
		isMobile = false
	}: Props = $props();
	
	let capacityError = $derived(getFieldError(errors, 'capacity'));
	let hasCapacityError = $derived(hasFieldError(errors, 'capacity'));
	let minCapacity = $derived(isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1);
	let isDifferentFromDefault = $derived(tourCapacity && capacity !== tourCapacity);
	let hasCustomDuration = $derived(customDuration && tourDuration && customDuration !== tourDuration);
</script>

{#if isMobile}
	<!-- Mobile layout -->
	<div class="space-y-4">
		<!-- Compact info row -->
		<div class="flex items-center justify-between p-3 rounded-lg text-sm" style="background: var(--bg-secondary);">
			<div class="flex items-center gap-4">
				<div>
					<span style="color: var(--text-secondary);">Duration:</span>
					<span class="font-medium ml-1" style="color: var(--text-primary);">{duration > 0 ? formatDuration(duration) : '--'}</span>
				</div>
				{#if tourDuration && duration !== tourDuration && duration > 0}
					<button
						type="button"
						onclick={onResetDuration}
						class="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
					>
						Reset
					</button>
				{/if}
			</div>
		</div>

		<!-- Capacity & Availability -->
		<div class="flex gap-4">
			<div class="w-40">
				<NumberInput
					id="capacity"
					name="capacity"
					label="Capacity"
					bind:value={capacity}
					min={minCapacity}
					max={500}
					step={1}
					placeholder="10"
					incrementLabel="Increase capacity"
					decrementLabel="Decrease capacity"
					error={capacityError}
					hasError={hasCapacityError}
					integerOnly={true}
					size="small"
					onblur={onCapacityChange}
				/>
			</div>
			
			{#if isEditMode}
				<div class="w-40">
					<label for="availability" class="form-label">Availability</label>
					<select id="availability" bind:value={availability} class="form-select w-full size-small">
						<option value="available">Available</option>
						<option value="cancelled">Cancelled</option>
					</select>
				</div>
			{/if}
		</div>
	</div>

	{#if isDifferentFromDefault}
		<div class="text-sm p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
			Tour default: {tourCapacity} guests
			<button
				type="button"
				onclick={onUseDefaultCapacity}
				class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
			>
				Use default
			</button>
		</div>
	{/if}

	{#if isEditMode && hasBookings}
		<p class="text-xs" style="color: var(--text-tertiary);">
			{currentSlot.bookedSpots} already booked • {availability === 'cancelled' ? 'Cancelling will affect existing bookings' : 'Customers can book remaining spots'}
		</p>
	{:else if isEditMode}
		<p class="text-xs" style="color: var(--text-tertiary);">
			{availability === 'available' ? 'Customers can book this time slot' : 'This time slot will not be visible to customers'}
		</p>
	{:else}
		<p class="text-xs" style="color: var(--text-tertiary);">
			Customers will be able to book this time slot once created
		</p>
	{/if}
{:else}
	<!-- Desktop layout -->
	<div class="grid grid-cols-2 gap-4">
		<div class="w-full">
			<NumberInput
				id="capacity"
				name="capacity"
				label="Capacity"
				bind:value={capacity}
				min={minCapacity}
				max={500}
				step={1}
				placeholder="10"
				incrementLabel="Increase capacity"
				decrementLabel="Decrease capacity"
				error={capacityError}
				hasError={hasCapacityError}
				integerOnly={true}
				onblur={onCapacityChange}
			/>
		</div>
		{#if isEditMode}
			<div class="w-full">
				<label for="availability" class="form-label">Availability</label>
				<select id="availability" bind:value={availability} class="form-select w-full">
					<option value="available">Available</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>
		{:else}
			<div class="w-full">
				<label class="form-label">Duration</label>
				<div class="w-full px-3 py-2 rounded-lg border text-sm flex items-center justify-between" 
					style="border-color: var(--border-primary); background: var(--bg-secondary);">
					<div>
						<span class="font-medium" style="color: var(--text-primary);">
							{duration > 0 ? formatDuration(duration) : 'Not set'}
						</span>
						{#if tourDuration && duration !== tourDuration}
							<span class="ml-2 text-xs" style="color: var(--text-tertiary);">
								(default: {formatDuration(tourDuration)})
							</span>
						{/if}
					</div>
					{#if hasCustomDuration}
						<button
							type="button"
							onclick={onResetDuration}
							class="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							style="color: var(--color-primary-600);"
						>
							Reset
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Validation & Warnings -->
	{#if isDifferentFromDefault || (isEditMode && hasBookings)}
		<div class="flex gap-2">
			{#if isDifferentFromDefault}
				<div class="text-sm p-2 rounded flex-1" style="background: var(--bg-secondary); color: var(--text-secondary);">
					Tour default: {tourCapacity} guests
					<button
						type="button"
						onclick={onUseDefaultCapacity}
						class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
					>
						Use default
					</button>
				</div>
			{/if}
			{#if isEditMode && hasBookings}
				<div class="text-sm p-2 rounded flex-1" style="background: var(--color-warning-50); color: var(--color-warning-700);">
					{currentSlot.bookedSpots} already booked
				</div>
			{/if}
		</div>
	{/if}
{/if} 