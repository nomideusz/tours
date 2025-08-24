<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Plus from 'lucide-svelte/icons/plus';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import CapacitySlider from '$lib/components/CapacitySlider.svelte';
	import { formatDuration, getImageUrl, getTourDisplayPriceFormatted } from '$lib/utils/tour-helpers-client.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { checkConflicts, checkRecurringConflicts } from '$lib/components/time-slot-form/utils/time-utils.js';
	import { 
		formatDateForInput, 
		calculateEndTime, 
		getRecurringEndDate, 
		calculateTotalRecurringSlots,
		getSmartCapacity 
	} from '$lib/utils/calendar-helpers.js';
	import type { Tour } from '$lib/types.js';

	// Props
	let {
		show = $bindable(false),
		date = $bindable<Date | null>(null),
		step = $bindable<'select-tour' | 'configure-slot'>('select-tour'),
		tours = [],
		selectedTourId = $bindable(''),
		selectedTourData = $bindable<any>(null),
		selectedTourSlots = $bindable<any[]>([]),
		timeSlotForm = $bindable({
			startTime: '10:00',
			endTime: '12:00',
			capacity: 10,
			recurring: false,
			recurringType: 'weekly' as 'daily' | 'weekly' | 'monthly',
			recurringCount: 4
		}),
		isAddingSlot = $bindable(false),
		lastCreatedSlot = $bindable<any>(null),
		hasConflict = $bindable(false),
		conflictMessage = $bindable(''),
		recurringConflictCount = $bindable(0),
		totalRecurringSlots = $bindable(0)
	}: {
		show?: boolean;
		date?: Date | null;
		step?: 'select-tour' | 'configure-slot';
		tours?: Tour[];
		selectedTourId?: string;
		selectedTourData?: any;
		selectedTourSlots?: any[];
		timeSlotForm?: any;
		isAddingSlot?: boolean;
		lastCreatedSlot?: any;
		hasConflict?: boolean;
		conflictMessage?: string;
		recurringConflictCount?: number;
		totalRecurringSlots?: number;
	} = $props();

	const dispatch = createEventDispatcher<{
		close: void;
		submit: { tourId: string; formData: any };
		tourSelected: { tour: Tour };
		createFirstTour: void;
	}>();

	// Auto-calculate end time when start time changes
	$effect(() => {
		if (selectedTourData && timeSlotForm.startTime) {
			const newEndTime = calculateEndTime(timeSlotForm.startTime, selectedTourData.duration);
			timeSlotForm.endTime = newEndTime;
		}
	});

	// Check for conflicts when time or recurring settings change
	$effect(() => {
		if (date && timeSlotForm.startTime && timeSlotForm.endTime && selectedTourId) {
			const dateStr = formatDateForInput(date);
			
			if (!selectedTourId) {
				hasConflict = false;
				conflictMessage = '';
				recurringConflictCount = 0;
				totalRecurringSlots = 0;
				return;
			}
			
			if (timeSlotForm.recurring) {
				// Check recurring conflicts
				const formData = {
					date: dateStr,
					startTime: timeSlotForm.startTime,
					endTime: timeSlotForm.endTime,
					recurring: true,
					recurringType: timeSlotForm.recurringType,
					recurringEnd: getRecurringEndDate(dateStr, timeSlotForm.recurringType, timeSlotForm.recurringCount),
					recurringCount: timeSlotForm.recurringCount
				};
				
				const recurringResult = checkRecurringConflicts(formData, selectedTourSlots);
				recurringConflictCount = recurringResult.conflictCount;
				totalRecurringSlots = calculateTotalRecurringSlots(dateStr, timeSlotForm.recurringType, timeSlotForm.recurringCount);
				
				hasConflict = recurringResult.hasConflicts;
				if (hasConflict) {
					conflictMessage = `${recurringConflictCount} of ${totalRecurringSlots} recurring slots conflict with existing time slots`;
				} else {
					conflictMessage = '';
				}
			} else {
				// Check single slot conflict
				const conflicts = checkConflicts(dateStr, timeSlotForm.startTime, timeSlotForm.endTime, selectedTourSlots);
				
				hasConflict = conflicts.length > 0;
				if (hasConflict && conflicts[0]) {
					const conflictSlot = conflicts[0];
					const conflictStart = new Date(conflictSlot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
					const conflictEnd = new Date(conflictSlot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
					conflictMessage = `Conflicts with existing slot: ${conflictStart} - ${conflictEnd}`;
				} else {
					conflictMessage = '';
				}
				
				recurringConflictCount = 0;
				totalRecurringSlots = 0;
			}
		} else {
			hasConflict = false;
			conflictMessage = '';
			recurringConflictCount = 0;
			totalRecurringSlots = 0;
		}
	});

	async function handleTourSelection(tour: Tour) {
		selectedTourId = tour.id;
		selectedTourData = tour;
		selectedTourSlots = [];
		
		// Fetch tour schedule to get smart capacity and existing slots
		try {
			const response = await fetch(`/api/tour-schedule/${tour.id}?t=${Date.now()}`);
			if (response.ok) {
				const data = await response.json();
				selectedTourSlots = data.timeSlots || [];
				const smartCapacity = getSmartCapacity(tour.id, tour, data.timeSlots, lastCreatedSlot);
				timeSlotForm.capacity = smartCapacity;
			} else {
				selectedTourSlots = [];
				timeSlotForm.capacity = getSmartCapacity(tour.id, tour, undefined, lastCreatedSlot);
			}
		} catch (error) {
			console.error('Error fetching tour schedule:', error);
			selectedTourSlots = [];
			timeSlotForm.capacity = getSmartCapacity(tour.id, tour, undefined, lastCreatedSlot);
		}
		
		// Auto-calculate end time based on tour duration
		if (tour.duration && timeSlotForm.startTime) {
			timeSlotForm.endTime = calculateEndTime(timeSlotForm.startTime, tour.duration);
		}
		
		dispatch('tourSelected', { tour });
		
		// Auto-advance to next step
		setTimeout(() => {
			step = 'configure-slot';
		}, 200);
	}

	function handleSubmit() {
		if (!selectedTourId || !date || isAddingSlot || hasConflict) return;
		
		const dateStr = formatDateForInput(date);
		const startDateTime = new Date(`${dateStr}T${timeSlotForm.startTime}:00`);
		const endDateTime = new Date(`${dateStr}T${timeSlotForm.endTime}:00`);
		
		const formData = {
			startTime: startDateTime.toISOString(),
			endTime: endDateTime.toISOString(),
			capacity: timeSlotForm.capacity,
			status: 'available',
			recurring: timeSlotForm.recurring,
			recurringType: timeSlotForm.recurringType,
			recurringCount: timeSlotForm.recurringCount
		};
		
		dispatch('submit', { tourId: selectedTourId, formData });
	}

	function handleClose() {
		dispatch('close');
	}

	function handleBackToTourSelection() {
		step = 'select-tour';
		selectedTourId = '';
		selectedTourData = null;
	}
</script>

{#if show}
	<!-- Modal backdrop -->
	<div class="modal-backdrop" onclick={handleClose} onkeydown={(e) => e.key === 'Escape' && handleClose()} role="button" tabindex="-1">
		<!-- Modal content -->
		<div class="modal-container" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<!-- Modal header -->
			<div class="modal-header">
				<div class="modal-header-content">
					<h3 class="modal-title">Add Time Slot</h3>
					<p class="modal-subtitle">
						{#if date}
							{date.toLocaleDateString('en-US', { 
								weekday: 'long', 
								year: 'numeric', 
								month: 'long', 
								day: 'numeric' 
							})}
						{/if}
					</p>
				</div>
				<button onclick={handleClose} class="modal-close" type="button" disabled={isAddingSlot}>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Progress Steps -->
			<div class="modal-steps">
				<div class="step {step === 'select-tour' ? 'active' : ''} {step === 'configure-slot' ? 'completed' : ''}">
					<div class="step-number">
						{#if step === 'configure-slot'}
							<CheckCircle class="w-4 h-4" />
						{:else}
							1
						{/if}
					</div>
					<span class="step-label">Select Tour</span>
				</div>
				<div class="step-connector {step === 'configure-slot' ? 'active' : ''}"></div>
				<div class="step {step === 'configure-slot' ? 'active' : ''}">
					<div class="step-number">2</div>
					<span class="step-label">Configure Slot</span>
				</div>
			</div>

			<!-- Modal Content -->
			<div class="modal-content">

				{#if step === 'select-tour'}
					<!-- Tour Selection Step -->
					<div class="tour-selection">
						{#if tours.length === 0}
							<!-- Empty State -->
							<div class="empty-state-card">
								<div class="empty-state-icon">
									<MapPin class="w-12 h-12" />
								</div>
								<h3 class="empty-state-title">No Tours Available</h3>
								<p class="empty-state-text">Create your first tour to start adding time slots to your calendar.</p>
								<button 
									onclick={() => dispatch('createFirstTour')}
									class="button-primary button--full"
								>
									<Plus class="w-4 h-4" />
									Create Your First Tour
								</button>
							</div>
						{:else}
							<!-- Tour Grid -->
							<div class="tour-grid">
								{#each tours as tour}
									{@const isSelected = selectedTourId === tour.id}
									<button
										onclick={() => handleTourSelection(tour)}
										class="tour-card {isSelected ? 'selected' : ''}"
									>
										{#if tour.images && tour.images.length > 0}
											<img 
												src={getImageUrl(tour, tour.images[0])} 
												alt={tour.name}
												class="tour-card-image"
											/>
										{:else}
											<div class="tour-card-placeholder">
												<MapPin class="w-6 h-6" />
											</div>
										{/if}
										
										<div class="tour-card-content">
											<h4 class="tour-card-name">{tour.name}</h4>
											<div class="tour-card-meta">
												<span>
													<Clock class="w-3 h-3" />
													{formatDuration(tour.duration)}
												</span>
												<span>
													<Users class="w-3 h-3" />
													{getTourDisplayPriceFormatted(tour)}
												</span>
											</div>
										</div>
										
										{#if tour.status === 'draft'}
											<div class="tour-card-badge">Draft</div>
										{/if}
										
										{#if isSelected}
											<div class="tour-card-selected-indicator">
												<CheckCircle class="w-4 h-4" />
											</div>
										{/if}
									</button>
								{/each}
							</div>
							
							<!-- Divider -->
							<div class="modal-divider">
								<span>or</span>
							</div>
							
							<!-- Create New Tour Button -->
							<button 
								onclick={() => dispatch('createFirstTour')}
								class="button-secondary button--full button--gap"
							>
								<Plus class="w-4 h-4" />
								Create New Tour
							</button>
						{/if}
					</div>
				{:else if step === 'configure-slot'}
					<!-- Step 2: Configure Time Slot -->
					{@const selectedTour = tours.find(t => t.id === selectedTourId)}
					<form 
						class="slot-form"
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}
					>
						{#if selectedTour}
							<div class="selected-tour-info">
								<div class="selected-tour-header">
									<button 
										type="button"
										onclick={handleBackToTourSelection}
										class="back-button"
									>
										← Back to Tours
									</button>
								</div>
								<div class="selected-tour-details">
									<h4>{selectedTour.name}</h4>
									<p>{formatDuration(selectedTour.duration)} • {getTourDisplayPriceFormatted(selectedTour)}</p>
								</div>
							</div>
						{/if}
						
						<div class="form-grid">
							<div class="form-group">
								<label for="slot-start-time" class="form-label">Start Time</label>
								<input
									id="slot-start-time"
									type="time"
									bind:value={timeSlotForm.startTime}
									class="form-input {hasConflict ? 'input-error' : ''}"
									required
									disabled={isAddingSlot}
								/>
							</div>
							
							<div class="form-group">
								<label for="slot-end-time" class="form-label">
									End Time
									{#if selectedTourData?.duration}
										<span class="form-label-hint">({formatDuration(selectedTourData.duration)} tour)</span>
									{/if}
								</label>
								<input
									id="slot-end-time"
									type="time"
									bind:value={timeSlotForm.endTime}
									class="form-input {hasConflict ? 'input-error' : ''}"
									required
									disabled={isAddingSlot}
								/>
							</div>
						</div>
						
						{#if hasConflict}
							<div class="conflict-warning {timeSlotForm.recurring ? 'recurring-conflict' : ''}">
								<AlertCircle class="w-4 h-4" />
								<span>{conflictMessage}</span>
							</div>
						{/if}

						<!-- Capacity -->
						<div class="form-group">
							<div class="form-label">Available Spots</div>
							<CapacitySlider
								bind:value={timeSlotForm.capacity}
								min={1}
								max={200}
								step={1}
								defaultValue={timeSlotForm.capacity}
								disabled={isAddingSlot}
							/>
						</div>

						<!-- Recurring Options -->
						<div class="form-group">
							<label class="form-label">
								<input
									type="checkbox"
									bind:checked={timeSlotForm.recurring}
									disabled={isAddingSlot}
								/>
								Create recurring slots
							</label>
							
							{#if timeSlotForm.recurring}
								<div class="recurring-options">
									<div class="form-grid">
										<div class="form-group">
											<label for="recurring-type" class="form-label">Repeat</label>
											<select
												id="recurring-type"
												bind:value={timeSlotForm.recurringType}
												class="form-select"
												disabled={isAddingSlot}
											>
												<option value="daily">Daily</option>
												<option value="weekly">Weekly</option>
												<option value="monthly">Monthly</option>
											</select>
										</div>
										
										<div class="form-group">
											<label for="recurring-count" class="form-label">Number of slots</label>
											<input
												id="recurring-count"
												type="number"
												bind:value={timeSlotForm.recurringCount}
												min="1"
												max="52"
												class="form-input"
												disabled={isAddingSlot}
											/>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Form Actions -->
						<div class="form-actions">
							<button 
								type="button" 
								onclick={handleClose}
								class="button--secondary"
								disabled={isAddingSlot}
							>
								Cancel
							</button>
							<button 
								type="submit"
								class="button--primary"
								disabled={isAddingSlot || hasConflict}
							>
								{#if isAddingSlot}
									<Loader2 class="w-4 h-4 animate-spin" />
									Adding...
								{:else if timeSlotForm.recurring && recurringConflictCount > 0}
									Add {totalRecurringSlots - recurringConflictCount} Slots
								{:else if timeSlotForm.recurring}
									Add {totalRecurringSlots} Slots
								{:else}
									Add Slot
								{/if}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-container {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		width: 100%;
		max-width: 640px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.2s ease;
		box-shadow: 
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	/* Modal Header */
	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.modal-header-content {
		flex: 1;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}

	.modal-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.modal-close {
		background: transparent;
		border: none;
		padding: 0.375rem;
		cursor: pointer;
		color: var(--text-tertiary);
		transition: all 0.15s ease;
		border-radius: 0.5rem;
		margin-left: 1rem;
	}

	.modal-close:hover:not(:disabled) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.modal-close:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Progress Steps */
	.modal-steps {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}

	.step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-tertiary);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.step.active {
		color: var(--text-primary);
	}

	.step.completed {
		color: var(--color-success);
	}

	.step-number {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.75rem;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-primary);
		transition: all 0.2s ease;
	}

	.step.active .step-number {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.step.completed .step-number {
		background: var(--color-success);
		color: white;
		border-color: var(--color-success);
	}

	.step-label {
		font-weight: 500;
	}

	.step-connector {
		width: 60px;
		height: 2px;
		background: var(--border-primary);
		margin: 0 1rem;
		transition: all 0.2s ease;
	}

	.step-connector.active {
		background: var(--color-success);
	}

	/* Modal Content */
	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}



	/* Tour Selection Step */
	.tour-selection {
		animation: fadeIn 0.2s ease;
	}

	.tour-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.tour-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.tour-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.tour-card.selected {
		border-color: var(--color-primary);
		background: var(--color-primary-50);
	}

	.tour-card-image {
		width: 100%;
		height: 100px;
		object-fit: cover;
	}

	.tour-card-placeholder {
		width: 100%;
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
		color: var(--text-tertiary);
	}

	.tour-card-content {
		padding: 0.75rem;
		flex: 1;
	}

	.tour-card-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tour-card-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.tour-card-meta span {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.tour-card-meta :global(svg) {
		width: 14px;
		height: 14px;
		opacity: 0.6;
	}

	.tour-card-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-warning-100);
		color: var(--color-warning-600);
		padding: 0.125rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.tour-card-selected-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-primary);
		color: white;
		padding: 0.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Empty State */
	.empty-state-card {
		text-align: center;
		padding: 3rem 2rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}

	:global(.empty-state-icon) {
		color: var(--text-tertiary);
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}

	.empty-state-text {
		color: var(--text-secondary);
		margin: 0 0 1.5rem 0;
	}

	/* Modal Divider */
	.modal-divider {
		text-align: center;
		margin: 1.5rem 0;
		position: relative;
	}

	.modal-divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--border-primary);
	}

	.modal-divider span {
		background: var(--bg-primary);
		padding: 0 1rem;
		position: relative;
		color: var(--text-tertiary);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Button Full Width */
	.button--full {
		width: 100%;
	}

	/* Animations */
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(20px);
		}
		to { 
			opacity: 1;
			transform: translateY(0);
		}
	}

	.selected-tour-info {
		background: var(--bg-secondary);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.selected-tour-header {
		margin-bottom: 0.75rem;
	}

	.back-button {
		background: none;
		border: none;
		color: var(--color-primary);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0;
	}

	.back-button:hover {
		text-decoration: underline;
	}

	.selected-tour-details h4 {
		margin: 0 0 0.25rem 0;
		font-weight: 600;
		color: var(--text-primary);
	}

	.selected-tour-details p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.slot-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.form-label-hint {
		font-weight: 400;
		color: var(--text-tertiary);
		font-size: 0.75rem;
		margin-left: 0.5rem;
	}

	.form-input,
	.form-select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-input.input-error {
		border-color: var(--color-error-500);
	}

	.conflict-warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		border-radius: 6px;
		color: var(--color-error-700);
		font-size: 0.875rem;
	}

	.recurring-options {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 6px;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.modal-container {
			max-width: 100%;
			max-height: 100%;
			height: 100%;
			border-radius: 0;
		}

		.tour-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.modal-steps {
			padding: 1rem;
		}

		.step-label {
			display: none;
		}

		.step-connector {
			width: 40px;
			margin: 0 0.5rem;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
