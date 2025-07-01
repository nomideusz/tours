<script lang="ts">
	import { fly } from 'svelte/transition';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import Repeat from 'lucide-svelte/icons/repeat';
	import type { TimeSlotFormData, RecurringPreview } from '../types.js';
	import { getRecurringPreview, getActualRecurringCount, getActualRecurringEndDate } from '../utils/recurring.js';
	
	interface Props {
		formData: TimeSlotFormData;
		isEditMode?: boolean;
		isMobile?: boolean;
	}
	
	let { 
		formData = $bindable(), 
		isEditMode = false,
		isMobile = false
	}: Props = $props();
	
	let recurringPreview = $derived(getRecurringPreview(formData));
	let actualRecurringCount = $derived(getActualRecurringCount(formData));
	let actualEndDate = $derived(getActualRecurringEndDate(formData));
</script>

{#if !isEditMode}
	<div class="recurring-container">
		<!-- Always Visible Recurring Options -->
		<div class="p-3 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<!-- Header with Toggle -->
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style="background: var(--color-primary-100);">
						<Repeat class="h-3 w-3" style="color: var(--color-primary-600);" />
					</div>
					<label class="inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							bind:checked={formData.recurring}
							class="form-checkbox mr-2"
							onchange={() => {
								if (!formData.recurring) {
									// Reset recurring options when disabled
									formData.recurringType = 'weekly';
									formData.recurringEnd = '';
									formData.recurringCount = 2;
								}
							}}
						/>
						<span class="text-sm font-medium" style="color: var(--text-primary);">
							Create recurring slots
						</span>
					</label>
				</div>
				{#if formData.recurring && actualRecurringCount > 0}
					<div class="text-xs px-2 py-1 rounded" style="background: var(--color-primary-50); color: var(--color-primary-700); border: 1px solid var(--color-primary-200);">
						{actualRecurringCount} slots
					</div>
				{/if}
			</div>

			<!-- Always visible options -->
			<div class="space-y-3" class:opacity-50={!formData.recurring} class:pointer-events-none={!formData.recurring}>
				{#if isMobile}
					<!-- Mobile: Stacked compact layout -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<div class="form-label text-xs">Pattern</div>
							<select bind:value={formData.recurringType} class="form-select w-full text-sm py-2" disabled={!formData.recurring}>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
						<div>
							{#if !formData.recurringEnd}
								<div class="form-label text-xs">Count</div>
								<NumberInput
									id="recurring-count-mobile"
									label=""
									bind:value={formData.recurringCount}
									min={2}
									max={52}
									step={1}
									placeholder="5"
									size="small"
									integerOnly={true}
									disabled={!formData.recurring}
								/>
							{:else}
								<div class="form-label text-xs">Until</div>
								<DatePicker
									bind:value={formData.recurringEnd}
									minDate={formData.date}
									placeholder="End date"
									onchange={() => {}}
									disabled={!formData.recurring}
								/>
							{/if}
						</div>
					</div>
					
					<!-- Compact mode toggle -->
					<div class="flex items-center gap-3 text-xs">
						<label class="flex items-center gap-1 cursor-pointer">
							<input
								type="radio"
								name="end-type-mobile"
								checked={!formData.recurringEnd}
								onchange={() => { 
									formData.recurringEnd = '';
									if (!formData.recurringCount || formData.recurringCount < 2) {
										formData.recurringCount = 2;
									}
								}}
								class="form-radio"
								style="transform: scale(0.8);"
								disabled={!formData.recurring}
							/>
							<span style="color: var(--text-secondary);">Count</span>
						</label>
						<label class="flex items-center gap-1 cursor-pointer">
							<input
								type="radio"
								name="end-type-mobile"
								checked={!!formData.recurringEnd}
								onchange={() => { 
									formData.recurringEnd = formData.date; 
									formData.recurringCount = 0; 
								}}
								class="form-radio"
								style="transform: scale(0.8);"
								disabled={!formData.recurring}
							/>
							<span style="color: var(--text-secondary);">End date</span>
						</label>
					</div>
				{:else}
					<!-- Desktop: Horizontal compact layout -->
					<div class="flex items-end gap-3">
						<div class="flex-1">
							<div class="form-label text-xs">Pattern</div>
							<select bind:value={formData.recurringType} class="form-select w-full text-sm py-2" disabled={!formData.recurring}>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
						
						<div class="flex-1">
							{#if !formData.recurringEnd}
								<div class="form-label text-xs">Count</div>
								<NumberInput
									id="recurring-count"
									label=""
									bind:value={formData.recurringCount}
									min={2}
									max={52}
									step={1}
									placeholder="5"
									integerOnly={true}
									size="small"
									disabled={!formData.recurring}
								/>
							{:else}
								<div class="form-label text-xs">Until date</div>
								<DatePicker
									bind:value={formData.recurringEnd}
									minDate={formData.date}
									placeholder="End date"
									onchange={() => {}}
									disabled={!formData.recurring}
								/>
							{/if}
						</div>
						
						<!-- Compact toggle buttons -->
						<div class="flex rounded border" style="border-color: var(--border-primary);">
							<button
								type="button"
								class="px-2 py-2 text-xs transition-colors {!formData.recurringEnd ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}"
								style="{!formData.recurringEnd ? 'background: var(--color-primary-500); color: white;' : 'color: var(--text-secondary);'}"
								onclick={() => { 
									formData.recurringEnd = '';
									if (!formData.recurringCount || formData.recurringCount < 2) {
										formData.recurringCount = 2;
									}
								}}
								disabled={!formData.recurring}
							>
								Count
							</button>
							<button
								type="button"
								class="px-2 py-2 text-xs border-l transition-colors {formData.recurringEnd ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}"
								style="border-color: var(--border-primary); {formData.recurringEnd ? 'background: var(--color-primary-500); color: white;' : 'color: var(--text-secondary);'}"
								onclick={() => { 
									formData.recurringEnd = formData.date; 
									formData.recurringCount = 0; 
								}}
								disabled={!formData.recurring}
							>
								Date
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Mini Preview -->
			{#if formData.recurring && recurringPreview.length > 0}
				<div class="mt-3 p-2 rounded text-xs" style="background: var(--bg-tertiary); border: 1px solid var(--border-secondary);">
					<div class="flex items-center justify-between">
											<span style="color: var(--text-secondary);">
						{actualRecurringCount} slots: {formatDate(recurringPreview[0].date)}
						{#if actualRecurringCount > 1 && actualEndDate && actualEndDate !== formData.date}
							→ {formatDate(actualEndDate)}
						{/if}
					</span>
						<span class="font-medium" style="color: var(--text-primary);">
							{formData.recurringType}
						</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

 