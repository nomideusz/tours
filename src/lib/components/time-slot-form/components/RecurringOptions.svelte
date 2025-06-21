<script lang="ts">
	import { formatDate } from '$lib/utils/date-helpers.js';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import Repeat from 'lucide-svelte/icons/repeat';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import type { TimeSlotFormData, RecurringPreview } from '../types.js';
	import { getRecurringPreview } from '../utils/recurring.js';
	
	interface Props {
		formData: TimeSlotFormData;
		showAdvanced: boolean;
		isEditMode?: boolean;
		onToggle: () => void;
		isMobile?: boolean;
	}
	
	let { 
		formData = $bindable(), 
		showAdvanced = $bindable(),
		isEditMode = false,
		onToggle,
		isMobile = false
	}: Props = $props();
	
	let recurringPreview = $derived(getRecurringPreview(formData));
</script>

{#if !isEditMode}
	<div class="space-y-4 {isMobile ? '' : 'mt-4'}">
		<button
			type="button"
			onclick={onToggle}
			class="flex items-center justify-between w-full p-3 text-left rounded-lg border transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
			style="border-color: var(--border-primary);"
		>
			<div class="flex items-center gap-2">
				<Repeat class="h-4 w-4" style="color: var(--text-secondary);" />
				<span class="{isMobile ? 'font-medium' : 'text-sm font-medium'}" style="color: var(--text-primary);">
					{isMobile ? 'Recurring Options' : 'Create recurring slots'}
				</span>
			</div>
			{#if showAdvanced}
				<ChevronUp class="h-4 w-4" style="color: var(--text-secondary);" />
			{:else}
				<ChevronDown class="h-4 w-4" style="color: var(--text-secondary);" />
			{/if}
		</button>

		{#if showAdvanced}
			<div class="{isMobile ? 'space-y-4' : 'mt-3'} p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				{#if isMobile}
					<!-- Mobile layout -->
					<div class="space-y-4">
						<!-- Pattern Selection -->
						<div>
							<label class="form-label">Repeat pattern</label>
							<select bind:value={formData.recurringType} class="form-select w-full">
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>

						<!-- End Condition -->
						<div class="space-y-3">
							<label class="form-label">Stop after</label>
							<div class="space-y-2">
								<div class="flex items-center gap-2">
									<input
										type="radio"
										id="end-count-{isMobile ? 'mobile' : 'desktop'}"
										name="end-type-{isMobile ? 'mobile' : 'desktop'}"
										value="count"
										checked={!formData.recurringEnd}
										onchange={() => formData.recurringEnd = ''}
										class="form-radio"
									/>
									<label for="end-count-{isMobile ? 'mobile' : 'desktop'}" class="text-sm" style="color: var(--text-primary);">Number of slots</label>
								</div>
								{#if !formData.recurringEnd}
									<NumberInput
										id="recurring-count-{isMobile ? 'mobile' : 'desktop'}"
										label=""
										bind:value={formData.recurringCount}
										min={1}
										max={52}
										step={1}
										placeholder="5"
										size="small"
										integerOnly={true}
									/>
								{/if}
							</div>
							
							<div class="space-y-2">
								<div class="flex items-center gap-2">
									<input
										type="radio"
										id="end-date-{isMobile ? 'mobile' : 'desktop'}"
										name="end-type-{isMobile ? 'mobile' : 'desktop'}"
										value="date"
										checked={!!formData.recurringEnd}
										onchange={() => { formData.recurringEnd = formData.date; formData.recurringCount = 0; }}
										class="form-radio"
									/>
									<label for="end-date-{isMobile ? 'mobile' : 'desktop'}" class="text-sm" style="color: var(--text-primary);">End date</label>
								</div>
								{#if formData.recurringEnd}
									<DatePicker
										bind:value={formData.recurringEnd}
										minDate={formData.date}
										placeholder="Select end date"
										onchange={() => {}}
									/>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<!-- Desktop layout -->
					<div class="grid grid-cols-2 gap-4">
						<!-- Pattern & Count -->
						<div>
							<label class="form-label">Pattern</label>
							<select bind:value={formData.recurringType} class="form-select w-full">
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
						
						<div>
							{#if !formData.recurringEnd}
								<label class="form-label">How many?</label>
								<NumberInput
									id="recurring-count"
									label=""
									bind:value={formData.recurringCount}
									min={2}
									max={52}
									step={1}
									placeholder="5"
									integerOnly={true}
								/>
							{:else}
								<label class="form-label">Until date</label>
								<DatePicker
									bind:value={formData.recurringEnd}
									minDate={formData.date}
									placeholder="End date"
									onchange={() => {}}
								/>
							{/if}
						</div>
					</div>
					
					<!-- Toggle between count/date -->
					<div class="mt-3 flex items-center gap-4 text-sm">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="recurring-mode"
								checked={!formData.recurringEnd}
								onchange={() => formData.recurringEnd = ''}
								class="form-radio"
							/>
							<span style="color: var(--text-secondary);">Count</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="recurring-mode"
								checked={!!formData.recurringEnd}
								onchange={() => { formData.recurringEnd = formData.date; formData.recurringCount = 2; }}
								class="form-radio"
							/>
							<span style="color: var(--text-secondary);">Until date</span>
						</label>
					</div>
				{/if}

				<!-- Preview -->
				{#if recurringPreview.length > 0}
					<div class="mt-4">
						<div class="{isMobile ? 'form-label' : 'text-sm font-medium'} mb-2" style="color: var(--text-primary);">
							{isMobile ? `Preview (${recurringPreview.length} slots)` : `${recurringPreview.length} slots will be created`}
						</div>
						<div class="max-h-32 overflow-y-auto p-2 rounded {isMobile ? '' : 'bg-gray-50 dark:bg-gray-900/50'} text-xs {isMobile ? '' : 'space-y-1'}" 
							style="{isMobile ? 'background: var(--bg-primary); border: 1px solid var(--border-primary);' : ''}">
							{#each recurringPreview.slice(0, isMobile ? recurringPreview.length : 5) as slot, index}
								<div class="{isMobile ? 'py-1' : 'flex justify-between'}" style="color: var(--text-secondary);">
									{#if isMobile}
										{index + 1}. {formatDate(slot.date)} at {slot.startTime}
									{:else}
										<span>{formatDate(slot.date)}</span>
										<span>{slot.startTime} - {formData.endTime}</span>
									{/if}
								</div>
							{/each}
							{#if !isMobile && recurringPreview.length > 5}
								<div class="text-center pt-1" style="color: var(--text-tertiary);">
									...and {recurringPreview.length - 5} more
								</div>
							{/if}
							{#if isMobile && formData.recurringEnd && recurringPreview.length >= 10}
								<div class="text-xs py-1 italic" style="color: var(--text-tertiary);">...and more</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if} 