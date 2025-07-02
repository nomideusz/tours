<script lang="ts">
	import { fly } from 'svelte/transition';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import Repeat from 'lucide-svelte/icons/repeat';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
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
		<div class="recurring-card">
			<!-- Header with Toggle -->
			<div class="recurring-header">
				<div class="recurring-toggle">
					<div class="toggle-icon">
						<Repeat class="h-4 w-4" style="color: var(--color-primary-600);" />
					</div>
					<label class="toggle-label">
						<input
							type="checkbox"
							bind:checked={formData.recurring}
							class="form-checkbox"
							onchange={() => {
								if (!formData.recurring) {
									// Reset recurring options when disabled
									formData.recurringType = 'weekly';
									formData.recurringEnd = '';
									formData.recurringCount = 2;
								}
							}}
						/>
						<span class="toggle-text">
							Create recurring slots
							{#if formData.recurring && actualRecurringCount > 0}
								<span class="slot-count-inline">({actualRecurringCount})</span>
							{/if}
						</span>
					</label>
				</div>
			</div>

			{#if formData.recurring}
				<div class="recurring-content" transition:fly={{ y: -10, duration: 200 }}>
					{#if isMobile}
						<!-- Mobile: Stacked layout -->
						<div class="mobile-layout">
							<!-- Repeat pattern selection -->
							<div class="form-group-mobile">
								<label class="form-label-mobile">Repeat pattern</label>
								<select bind:value={formData.recurringType} class="form-select-mobile">
									<option value="daily">Daily</option>
									<option value="weekly">Weekly</option>
									<option value="monthly">Monthly</option>
								</select>
							</div>
							
							<!-- Mobile toggle buttons -->
							<div class="mobile-toggle-section">
								<div class="mobile-toggle-buttons">
									<button
										type="button"
										class="toggle-btn {!formData.recurringEnd ? 'active' : ''}"
										onclick={() => { 
											formData.recurringEnd = '';
											if (!formData.recurringCount || formData.recurringCount < 2) {
												formData.recurringCount = 2;
											}
										}}
									>
										By count
									</button>
									<button
										type="button"
										class="toggle-btn {formData.recurringEnd ? 'active' : ''}"
										onclick={() => { 
											formData.recurringEnd = formData.date; 
											formData.recurringCount = 0; 
										}}
									>
										By end date
									</button>
								</div>
							</div>

							<!-- Value input field -->
							<div class="form-group-mobile">
								{#if !formData.recurringEnd}
									<label class="form-label-mobile">Number of slots</label>
									<NumberInput
										id="recurring-count-mobile"
										label=""
										bind:value={formData.recurringCount}
										min={2}
										max={52}
										step={1}
										placeholder="5"
										integerOnly={true}
									/>
								{:else}
									<label class="form-label-mobile">End date</label>
									<DatePicker
										bind:value={formData.recurringEnd}
										minDate={formData.date}
										placeholder="Select end date"
										onchange={() => {}}
									/>
								{/if}
							</div>

							<!-- Mobile preview -->
							{#if recurringPreview.length > 0}
								<div class="mobile-preview">
									<div class="preview-header-mobile">
										<Calendar class="h-4 w-4" />
										<span>Preview ({actualRecurringCount} slot{actualRecurringCount === 1 ? '' : 's'})</span>
									</div>
									<div class="preview-list-mobile">
										{#each recurringPreview.slice(0, 3) as slot, index}
											<div class="preview-slot-mobile">
												<span class="slot-date">{formatDate(slot.date)}</span>
												<span class="slot-time">{slot.startTime}</span>
											</div>
										{/each}
										{#if actualRecurringCount > 3}
											<div class="preview-more">
												+{actualRecurringCount - 3} more slot{actualRecurringCount - 3 === 1 ? '' : 's'}
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<!-- Desktop: Side-by-side layout -->
						<div class="desktop-layout">
							<!-- Left side: Form controls -->
							<div class="form-section">
								<div class="form-controls">
									<div class="form-group">
										<label class="form-label-sm">Repeat pattern</label>
										<select bind:value={formData.recurringType} class="form-select">
											<option value="daily">Daily</option>
											<option value="weekly">Weekly</option>
											<option value="monthly">Monthly</option>
										</select>
									</div>
									
									<div class="form-group">
										{#if !formData.recurringEnd}
											<label class="form-label-sm">Number of slots</label>
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
											<label class="form-label-sm">End date</label>
											<DatePicker
												bind:value={formData.recurringEnd}
												minDate={formData.date}
												placeholder="Select end date"
												onchange={() => {}}
											/>
										{/if}
									</div>
								</div>
								
								<!-- Toggle buttons -->
								<div class="end-type-toggle">
									<button
										type="button"
										class="toggle-option {!formData.recurringEnd ? 'active' : ''}"
										onclick={() => { 
											formData.recurringEnd = '';
											if (!formData.recurringCount || formData.recurringCount < 2) {
												formData.recurringCount = 2;
											}
										}}
									>
										By count
									</button>
									<button
										type="button"
										class="toggle-option {formData.recurringEnd ? 'active' : ''}"
										onclick={() => { 
											formData.recurringEnd = formData.date; 
											formData.recurringCount = 0; 
										}}
									>
										By end date
									</button>
								</div>
							</div>

							<!-- Right side: Preview list -->
							{#if recurringPreview.length > 0}
								<div class="preview-section">
									<div class="preview-header">
										<div class="preview-title">
											<Calendar class="h-4 w-4" />
											<span>Slots to be created</span>
										</div>
										<div class="preview-summary">
											{actualRecurringCount} {formData.recurringType} slots
										</div>
									</div>
									
									<div class="preview-list">
										{#each recurringPreview.slice(0, 8) as slot, index}
											<div class="preview-slot" transition:fly={{ y: 5, delay: index * 30, duration: 150 }}>
												<div class="slot-number">{index + 1}</div>
												<div class="slot-details">
													<div class="slot-date">{formatDate(slot.date)}</div>
													<div class="slot-time">
														<Clock class="h-3 w-3" />
														{slot.startTime}
													</div>
												</div>
												{#if index === 0}
													<div class="slot-badge">First</div>
												{:else if index === recurringPreview.length - 1 && actualRecurringCount <= 8}
													<div class="slot-badge">Last</div>
												{/if}
											</div>
										{/each}
										
										{#if actualRecurringCount > 8}
											<div class="preview-more-slots">
												<ChevronRight class="h-4 w-4" />
												<span>+{actualRecurringCount - 8} more slots</span>
												<span class="more-details">ending {formatDate(actualEndDate)}</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<!-- Collapsed state hint -->
				<div class="collapsed-hint">
					<span class="hint-text">Enable to create multiple time slots automatically</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.recurring-container {
		margin-top: 1.5rem;
		width: 100%;
	}

	.recurring-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		transition: all 0.2s ease;
		width: 100%;
	}

	.recurring-header {
		display: flex;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-secondary);
	}

	.recurring-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: var(--color-primary-100);
		border-radius: 0.5rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.toggle-text {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.slot-count-inline {
		color: var(--color-primary-600);
		font-weight: 600;
		margin-left: 0.25rem;
	}

	.collapsed-hint {
		padding: 0.75rem 1.5rem;
		border-top: 1px solid var(--border-secondary);
		background: var(--bg-tertiary);
	}

	.hint-text {
		color: var(--text-tertiary);
		font-size: 0.8125rem;
		font-style: italic;
	}

	.recurring-content {
		padding: 1.5rem;
	}

	/* Mobile layout */
	.mobile-layout {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group-mobile {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label-mobile {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.form-select-mobile {
		width: 100%;
		padding: 0.75rem 2.5rem 0.75rem 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: border-color 0.15s ease;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=utf-8,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.75rem center;
		background-repeat: no-repeat;
		background-size: 1rem;
	}

	.form-select-mobile:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.mobile-toggle-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mobile-toggle-buttons {
		display: flex;
		gap: 0.5rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.toggle-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border: none;
		border-right: 1px solid var(--border-primary);
		background: var(--bg-primary);
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 44px; /* Better touch target */
	}

	.toggle-btn:last-child {
		border-right: none;
	}

	.toggle-btn.active {
		background: var(--color-primary-500);
		color: white;
	}

	.toggle-btn:hover:not(.active) {
		background: var(--bg-secondary);
	}

	.mobile-preview {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.preview-header-mobile {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-secondary);
	}

	.preview-list-mobile {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.preview-slot-mobile {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0;
		font-size: 0.8125rem;
	}

	.preview-more {
		color: var(--text-tertiary);
		font-size: 0.75rem;
		text-align: center;
		padding: 0.25rem 0;
		font-style: italic;
	}

	/* Desktop layout */
	.desktop-layout {
		display: grid;
		grid-template-columns: 1fr 1.5fr;
		gap: 2rem;
		align-items: start;
		width: 100%;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}

	.form-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label-sm {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.end-type-toggle {
		display: flex;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.toggle-option {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
		color: var(--text-secondary);
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toggle-option:not(:last-child) {
		border-right: 1px solid var(--border-primary);
	}

	.toggle-option.active {
		background: var(--color-primary-500);
		color: white;
	}

	.toggle-option:hover:not(.active) {
		background: var(--bg-secondary);
	}

	/* Preview section */
	.preview-section {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.5rem;
		padding: 1rem;
		max-height: 20rem;
		overflow: hidden;
		width: 100%;
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-secondary);
	}

	.preview-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.preview-summary {
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 500;
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.preview-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 12rem;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.preview-slot {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		transition: all 0.15s ease;
		position: relative;
	}

	.preview-slot:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-25);
	}

	.slot-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.slot-details {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.slot-date {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.8125rem;
		white-space: nowrap;
	}

	.slot-time {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--text-secondary);
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.slot-badge {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		background: var(--color-success-50);
		color: var(--color-success-700);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		border: 1px solid var(--color-success-200);
		z-index: 1;
	}

	.preview-more-slots {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0.5rem;
		color: var(--text-tertiary);
		font-size: 0.75rem;
		border-top: 1px dashed var(--border-secondary);
		margin-top: 0.25rem;
	}

	.more-details {
		margin-left: auto;
		font-style: italic;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.desktop-layout {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.recurring-header {
			padding: 1rem;
		}

		.toggle-text {
			font-size: 0.8125rem;
		}
	}

	@media (max-width: 480px) {
		.recurring-container {
			margin-left: -0.5rem;
			margin-right: -0.5rem;
		}

		.recurring-header {
			padding: 0.75rem;
		}

		.recurring-content {
			padding: 1rem;
		}

		.mobile-layout {
			gap: 1rem;
		}

		.preview-slot-mobile {
			font-size: 0.8125rem;
		}
	}

	/* Better space utilization on larger screens */
	@media (min-width: 1024px) {
		.desktop-layout {
			grid-template-columns: 1fr 2fr;
			gap: 2.5rem;
		}
		
		.recurring-content {
			padding: 2rem;
		}
		
		.recurring-header {
			padding: 1.25rem 2rem;
		}
		
		.collapsed-hint {
			padding: 1rem 2rem;
		}
	}

	@media (min-width: 1280px) {
		.desktop-layout {
			gap: 3rem;
		}
		
		.preview-section {
			max-height: 24rem;
		}
		
		.preview-list {
			max-height: 16rem;
		}
	}
</style>

 