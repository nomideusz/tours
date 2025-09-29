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
	import Info from 'lucide-svelte/icons/info';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
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
			endDate: '',
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

	// Auto-calculate end time and date when start time changes
	$effect(() => {
		if (selectedTourData && timeSlotForm.startTime && date) {
			const dateStr = formatDateForInput(date);
			const duration = selectedTourData.duration || 120;
			
			// Calculate end time and check if it spans multiple days
			const [hours, minutes] = timeSlotForm.startTime.split(':').map(Number);
			const totalMinutes = hours * 60 + minutes + duration;
			
			const endHours = Math.floor(totalMinutes / 60);
			const endMinutes = totalMinutes % 60;
			
			if (endHours >= 24) {
				// Multi-day slot
				const daysToAdd = Math.floor(endHours / 24);
				const endDate = new Date(dateStr);
				endDate.setDate(endDate.getDate() + daysToAdd);
				timeSlotForm.endDate = formatDateForInput(endDate);
				timeSlotForm.endTime = `${String(endHours % 24).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
			} else {
				// Same day slot
				timeSlotForm.endDate = '';
				timeSlotForm.endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
			}
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
				const conflicts = checkConflicts(dateStr, timeSlotForm.startTime, timeSlotForm.endTime, selectedTourSlots, timeSlotForm.endDate);
				
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
		
		// Auto-calculate end time and date based on tour duration
		if (tour.duration && timeSlotForm.startTime && date) {
			const dateStr = formatDateForInput(date);
			const duration = tour.duration || 120;
			
			// Calculate end time and check if it spans multiple days
			const [hours, minutes] = timeSlotForm.startTime.split(':').map(Number);
			const totalMinutes = hours * 60 + minutes + duration;
			
			const endHours = Math.floor(totalMinutes / 60);
			const endMinutes = totalMinutes % 60;
			
			if (endHours >= 24) {
				// Multi-day slot
				const daysToAdd = Math.floor(endHours / 24);
				const endDate = new Date(dateStr);
				endDate.setDate(endDate.getDate() + daysToAdd);
				timeSlotForm.endDate = formatDateForInput(endDate);
				timeSlotForm.endTime = `${String(endHours % 24).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
			} else {
				// Same day slot
				timeSlotForm.endDate = '';
				timeSlotForm.endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
			}
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
		
		// Handle multi-day tours
		let endDateTime: Date;
		if (timeSlotForm.endDate && timeSlotForm.endDate !== dateStr) {
			// Multi-day slot
			endDateTime = new Date(`${timeSlotForm.endDate}T${timeSlotForm.endTime}:00`);
		} else {
			// Same day slot
			endDateTime = new Date(`${dateStr}T${timeSlotForm.endTime}:00`);
		}
		
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
	
	// Generate color for tour based on tour ID/name (same algorithm as tours page)
	function getTourCalendarColor(tourId: string | undefined, tourName: string | undefined): string {
		if (!tourId || !tourName) {
			// Fallback color if data is missing
			return '#3B82F6';
		}
		
		// Use a hash function to generate consistent colors
		let hash = 0;
		const str = tourId + tourName;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash; // Convert to 32-bit integer
		}
		
		// Generate HSL values
		const hue = Math.abs(hash) % 360;
		const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
		const lightness = 45 + (Math.abs(hash >> 16) % 15); // 45-60%
		
		// Convert HSL to RGB for better browser compatibility
		const h = hue / 360;
		const s = saturation / 100;
		const l = lightness / 100;
		
		let r, g, b;
		
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			};
			
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		
		// Convert to hex
		const toHex = (x: number) => {
			const hex = Math.round(x * 255).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
		
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
										<!-- Calendar color strip -->
										<div class="tour-color-strip" style="background-color: {getTourCalendarColor(tour.id, tour.name)}"></div>
										
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
					<!-- Configure Slot Step -->
					{@const selectedTour = tours.find(t => t.id === selectedTourId)}
					<div class="slot-form">
						{#if selectedTour}
							<div class="selected-tour-info">
								<div class="selected-tour-header">
									<h4 class="selected-tour-name">
										<span 
											class="tour-color-dot" 
											style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: {getTourCalendarColor(selectedTour.id, selectedTour.name)}; box-shadow: 0 0 0 2px rgba(0,0,0,0.1); margin-right: 8px; vertical-align: middle;"
										></span>
										{selectedTour.name}
									</h4>
									<button 
										type="button"
										onclick={handleBackToTourSelection}
										class="change-tour-btn"
									>
										Change Tour
									</button>
								</div>
								<div class="selected-tour-meta">
									<span>
										<Clock class="w-4 h-4" />
										{formatDuration(selectedTour.duration)}
									</span>
									<span>
										<Users class="w-4 h-4" />
										{getTourDisplayPriceFormatted(selectedTour)}
									</span>
								</div>
							</div>
						{/if}
						
						<!-- Time Configuration -->
						<div class="form-section">
							<h5 class="section-title">Time & Duration</h5>
							<div class="time-config">
								<div class="time-inputs">
									<div class="time-input-group">
										<label for="slot-start-time" class="form-label">Start Time</label>
										<input
											id="slot-start-time"
											type="time"
											bind:value={timeSlotForm.startTime}
											class="time-input {hasConflict ? 'input-error' : ''}"
											required
											disabled={isAddingSlot}
										/>
									</div>
									
									<div class="time-separator">
										<div class="separator-line"></div>
										<span class="separator-text">to</span>
										<div class="separator-line"></div>
									</div>
									
									<div class="time-input-group">
										<label for="slot-end-time" class="form-label">End Time</label>
										<input
											id="slot-end-time"
											type="time"
											bind:value={timeSlotForm.endTime}
											class="time-input {hasConflict ? 'input-error' : ''}"
											required
											disabled={isAddingSlot}
										/>
									</div>
								</div>
								
								{#if timeSlotForm.endDate && date && timeSlotForm.endDate !== formatDateForInput(date)}
									<div class="multi-day-info">
										<Info class="w-4 h-4" />
										<span>
											This tour spans multiple days: {new Date(formatDateForInput(date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(timeSlotForm.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</span>
									</div>
								{/if}
								
								{#if hasConflict}
									<div class="conflict-warning {timeSlotForm.recurring ? 'recurring-conflict' : ''}">
										<AlertCircle class="w-4 h-4" />
										<span>{conflictMessage}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Capacity Configuration -->
						<div class="form-section">
							<h5 class="section-title">Max Group Size</h5>
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
						<div class="form-section">
							<div class="recurring-section">
								<div class="recurring-toggle">
									<label class="checkbox-label">
										<input
											type="checkbox"
											bind:checked={timeSlotForm.recurring}
											disabled={isAddingSlot}
											class="checkbox-input"
										/>
										<span class="checkbox-text">Recurring</span>
									</label>
								</div>
								
								{#if timeSlotForm.recurring}
									<div class="recurring-config">
										<div class="recurring-fields">
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
												<label for="recurring-count" class="form-label">Count</label>
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
										
										{#if totalRecurringSlots > 0}
											<div class="recurring-summary">
												{#if recurringConflictCount > 0}
													<div class="summary-item warning">
														Will create {totalRecurringSlots - recurringConflictCount} slots ({recurringConflictCount} conflicts)
													</div>
												{:else}
													<div class="summary-item success">
														Will create {totalRecurringSlots} slots
													</div>
												{/if}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<!-- Form Actions -->
						<div class="form-actions">
							<button 
								type="button" 
								onclick={handleBackToTourSelection}
								class="button-secondary button--gap"
								disabled={isAddingSlot}
							>
								<ChevronLeft class="w-4 h-4" />
								Back
							</button>
							<div class="form-actions-right">
								<button 
									type="button" 
									onclick={handleClose}
									class="button-secondary"
									disabled={isAddingSlot}
								>
									Cancel
								</button>
								<button 
									type="button"
									onclick={handleSubmit}
									class="button-primary"
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
						</div>
					</div>
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
	
	/* Tour color strip */
	.tour-color-strip {
		height: 4px;
		width: 100%;
		position: relative;
		overflow: hidden;
	}
	
	.tour-color-strip::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
	}
	
	:global(.dark) .tour-color-strip::after {
		background: linear-gradient(to bottom, rgba(0,0,0,0.2), transparent);
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
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.selected-tour-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.selected-tour-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.selected-tour-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.selected-tour-meta span {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.change-tour-btn {
		background: transparent;
		border: none;
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}

	.change-tour-btn:hover {
		background: var(--color-primary-50);
	}



	.slot-form {
		animation: fadeIn 0.2s ease;
	}

	.form-section {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-primary);
	}

	/* Time Configuration */
	.time-config {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.time-inputs {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: end;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.time-input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.time-input {
		width: 100%;
		padding: 0.875rem;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.2s ease;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	}

	/* WebKit browsers (Chrome, Safari, Edge) - Style the time picker icon */
	.time-input::-webkit-calendar-picker-indicator {
		/* Convert black icon to light gray matching text-tertiary */
		filter: invert(0.7) brightness(1.5) contrast(0.8);
		opacity: 0.6;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 18px;
		height: 18px;
	}

	.time-input:hover::-webkit-calendar-picker-indicator {
		opacity: 0.8;
		filter: invert(0.6) brightness(1.3) contrast(0.9);
	}

	.time-input:focus::-webkit-calendar-picker-indicator {
		filter: invert(0.5) brightness(1.2) contrast(1);
		opacity: 1;
	}

	/* Firefox */
	.time-input::-moz-time-picker-indicator {
		filter: invert(0.7) brightness(1.5) contrast(0.8);
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	/* Dark theme adjustments - make icon much lighter for dark backgrounds */
	:global([data-theme="dark"]) .time-input::-webkit-calendar-picker-indicator {
		filter: invert(0.9) brightness(1.8) contrast(0.7);
		opacity: 0.7;
	}

	:global([data-theme="dark"]) .time-input:hover::-webkit-calendar-picker-indicator {
		filter: invert(0.95) brightness(1.9) contrast(0.8);
		opacity: 0.9;
	}

	:global([data-theme="dark"]) .time-input:focus::-webkit-calendar-picker-indicator {
		filter: invert(1) brightness(2) contrast(0.9);
		opacity: 1;
	}

	:global([data-theme="dark"]) .time-input::-moz-time-picker-indicator {
		filter: invert(0.9) brightness(1.8) contrast(0.7);
		opacity: 0.7;
	}

	/* System dark mode fallback */
	@media (prefers-color-scheme: dark) {
		.time-input::-webkit-calendar-picker-indicator {
			filter: invert(0.9) brightness(1.8) contrast(0.7);
			opacity: 0.7;
		}
		
		.time-input:hover::-webkit-calendar-picker-indicator {
			filter: invert(0.95) brightness(1.9) contrast(0.8);
			opacity: 0.9;
		}
	}

	.time-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-50);
	}

	.time-input.input-error {
		border-color: var(--color-error-500);
		box-shadow: 0 0 0 3px var(--color-error-50);
	}

	.time-separator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 1.5rem;
	}

	.separator-line {
		flex: 1;
		height: 1px;
		background: var(--border-primary);
	}

	.separator-text {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		font-weight: 500;
		padding: 0 0.25rem;
	}
	
	.multi-day-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-top: 1rem;
	}
	
	.multi-day-info :global(svg) {
		flex-shrink: 0;
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

	.form-select:focus {
		outline: none;
		border-color: var(--color-primary);
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





	/* Recurring Section */
	.recurring-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.recurring-toggle {
		padding: 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		user-select: none;
		margin-bottom: 0.5rem;
	}

	.checkbox-input {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: var(--color-primary);
	}

	.checkbox-text {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}



	.recurring-config {
		padding: 1rem;
		animation: slideDown 0.2s ease;
	}

	.recurring-fields {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.recurring-summary {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-top: 1rem;
	}



	.summary-item {
		font-size: 0.8125rem;
		text-align: center;
		font-weight: 500;
	}

	.summary-item.warning {
		color: var(--color-warning-600);
	}

	.summary-item.success {
		color: var(--color-success-600);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.form-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
	}

	.form-actions-right {
		display: flex;
		gap: 0.75rem;
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.modal-backdrop {
			padding: 0;
		}
		
		.modal-container {
			max-width: 100%;
			max-height: 100vh;
			height: 100vh;
			border-radius: 0;
			margin: 0;
		}
		
		/* Reduce vertical spacing throughout */
		.modal-header {
			padding: 1rem;
		}
		
		.modal-steps {
			padding: 0.75rem 1rem;
			background: var(--bg-secondary);
		}
		
		.step {
			font-size: 0.75rem;
		}
		
		.step-label {
			display: none; /* Hide labels to save space */
		}
		
		.step-number {
			width: 24px;
			height: 24px;
			font-size: 0.625rem;
		}
		
		.step-connector {
			width: 30px;
			margin: 0 0.5rem;
		}
		
		.modal-content {
			padding: 1rem;
		}
		
		/* Tour grid - 2 columns */
		.tour-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.tour-card-image,
		.tour-card-placeholder {
			height: 80px;
		}
		
		.tour-card-content {
			padding: 0.5rem;
		}
		
		.tour-card-name {
			font-size: 0.8125rem;
		}
		
		/* Selected tour info */
		.selected-tour-info {
			padding: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.selected-tour-header {
			margin-bottom: 0.5rem;
		}
		
		.selected-tour-name {
			font-size: 0.875rem;
		}
		
		.selected-tour-meta {
			font-size: 0.75rem;
			gap: 0.5rem;
		}
		
		/* Form sections */
		.form-section {
			margin-bottom: 1rem;
		}
		
		.section-title {
			font-size: 0.875rem;
			margin-bottom: 0.75rem;
			padding-bottom: 0.375rem;
		}
		
		/* Time Configuration - Compact mobile layout */
		.time-config {
			padding: 0.75rem;
			width: 100%; /* Ensure full width */
		}
		
		.time-inputs {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			margin-bottom: 0.75rem;
			width: 100%; /* Ensure full width */
		}
		
		.time-input-group {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			width: 100%; /* Ensure full width */
		}
		
		.time-input-group .form-label {
			margin-bottom: 0;
			font-size: 0.8125rem;
			white-space: nowrap;
			flex-shrink: 0; /* Prevent label from shrinking */
			width: 65px; /* Fixed width for both labels */
		}
		
		.time-separator {
			display: none;
		}
		
		.time-input {
			font-size: 0.9375rem;
			padding: 0.625rem;
			height: 42px;
			flex: 1; /* Take remaining space */
			width: 100%; /* Full width of flex container */
		}
		
		/* Recurring section */
		.recurring-toggle {
			padding: 0.75rem;
		}
		
		.recurring-config {
			padding: 0.75rem;
		}
		
		.recurring-fields {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
		
		.recurring-summary {
			padding: 0.75rem;
			margin-top: 0.75rem;
		}
		
		.summary-item {
			font-size: 0.75rem;
		}
		
		/* Form actions - Stack buttons on mobile */
		.form-actions {
			flex-direction: column-reverse;
			gap: 0.5rem;
			margin-top: 1rem;
			padding-top: 1rem;
		}
		
		.form-actions-right {
			width: 100%;
			flex-direction: column-reverse;
			gap: 0.5rem;
		}
		
		.form-actions button,
		.form-actions-right button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
