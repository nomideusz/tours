<script lang="ts">
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	
	// Icons
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Euro from 'lucide-svelte/icons/euro';
	import Calendar from 'lucide-svelte/icons/calendar';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	
	interface TimeSlot {
		id: string;
		startTime: string;
		endTime: string;
		capacity: number;
		bookedSpots: number;
		availableSpots: number;
		totalRevenue: number;
		status: 'available' | 'cancelled';
		notes?: string;
	}
	
	interface Props {
		date: string; // YYYY-MM-DD format
		slots: TimeSlot[];
		isVisible?: boolean;
	}
	
	let { date, slots, isVisible = true }: Props = $props();
	
	// Sort slots by start time, including multi-day slots that span this date
	let sortedSlots = $derived(
		slots
			.filter(slot => {
				const slotStart = new Date(slot.startTime);
				const slotEnd = new Date(slot.endTime);
				const selectedDate = new Date(date + 'T00:00:00');
				const selectedDateEnd = new Date(date + 'T23:59:59');
				
				// Check if the slot overlaps with the selected date
				// This includes slots that:
				// 1. Start on this date
				// 2. End on this date  
				// 3. Span across this date
				return slotStart <= selectedDateEnd && slotEnd >= selectedDate;
			})
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
	);
	
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { 
			weekday: 'long', 
			month: 'long', 
			day: 'numeric' 
		});
	}
	
	function getSlotStatusText(slot: TimeSlot): string {
		if (slot.status === 'cancelled') return 'Cancelled';
		if (slot.bookedSpots === 0) return 'Available';
		if (slot.availableSpots === 0) return 'Full';
		return `${slot.bookedSpots}/${slot.capacity} booked`;
	}
	
	function getSlotStatusClass(slot: TimeSlot): string {
		if (slot.status === 'cancelled') return 'slot-status--cancelled';
		if (slot.bookedSpots === 0) return 'slot-status--available';
		if (slot.availableSpots === 0) return 'slot-status--full';
		return 'slot-status--partial';
	}
	
	function isMultiDaySlot(slot: TimeSlot): boolean {
		const startDate = new Date(slot.startTime).toISOString().split('T')[0];
		const endDate = new Date(slot.endTime).toISOString().split('T')[0];
		return startDate !== endDate;
	}
	
	function getMultiDayInfo(slot: TimeSlot): string {
		if (!isMultiDaySlot(slot)) return '';
		
		const slotStartDate = new Date(slot.startTime).toISOString().split('T')[0];
		const slotEndDate = new Date(slot.endTime).toISOString().split('T')[0];
		
		if (date === slotStartDate) {
			return `Starts today → ${new Date(slotEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
		} else if (date === slotEndDate) {
			return `${new Date(slotStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → Ends today`;
		} else {
			return `${new Date(slotStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${new Date(slotEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
		}
	}
</script>

{#if isVisible}
	<div class="day-slot-preview {sortedSlots.length === 0 ? 'day-slot-preview--empty' : ''}">
		{#if sortedSlots.length > 0}
			<div class="preview-header">
				<div class="header-info">
					<Calendar class="w-4 h-4" />
					<span class="date-text">{formatDate(date)}</span>
				</div>
				<span class="slot-count">{sortedSlots.length} existing slot{sortedSlots.length === 1 ? '' : 's'}</span>
			</div>
			
			<div class="slots-list">
				{#each sortedSlots as slot (slot.id)}
					<div class="slot-item {getSlotStatusClass(slot)}">
						<div class="slot-main">
							<div class="slot-time">
								<Clock class="w-3.5 h-3.5" />
								<span class="time-text">{formatSlotTimeRange(slot.startTime, slot.endTime)}</span>
								{#if isMultiDaySlot(slot)}
									<span class="multi-day-badge">Multi-day</span>
								{/if}
							</div>
							
							{#if isMultiDaySlot(slot)}
								<div class="multi-day-info">
									<Calendar class="w-3 h-3" />
									<span>{getMultiDayInfo(slot)}</span>
								</div>
							{/if}
							
							<div class="slot-details">
								<div class="detail-item">
									<Users class="w-3.5 h-3.5" />
									<span>{getSlotStatusText(slot)}</span>
								</div>
								
								{#if slot.totalRevenue > 0}
									<div class="detail-item">
										<Euro class="w-3.5 h-3.5" />
										<span>{$globalCurrencyFormatter(slot.totalRevenue)}</span>
									</div>
								{/if}
							</div>
						</div>
						
						<div class="slot-status">
							{#if slot.status === 'cancelled'}
								<XCircle class="w-4 h-4 text-red-500" />
							{:else if slot.availableSpots === 0}
								<div class="status-badge status-badge--full">Full</div>
							{:else if slot.bookedSpots > 0}
								<div class="status-badge status-badge--partial">Partial</div>
							{:else}
								<CheckCircle class="w-4 h-4 text-green-500" />
							{/if}
						</div>
					</div>
				{/each}
			</div>
			
			<div class="preview-footer">
				<p class="help-text">Choose a different time to avoid conflicts</p>
			</div>
		{:else}
			<div class="empty-compact">
				<div class="empty-header">
					<Calendar class="w-4 h-4" />
					<span class="date-text">{formatDate(date)}</span>
				</div>
				<p class="empty-message">
					<Clock class="w-3 h-3" />
					No time slots scheduled - date is available
				</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.day-slot-preview {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius-md);
		animation: slideIn 0.2s ease;
	}
	
	.day-slot-preview--empty {
		padding: 0.75rem;
		margin-top: 0.75rem;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.header-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-primary);
	}
	
	.date-text {
		font-size: var(--text-sm);
		font-weight: 500;
	}
	
	.slot-count {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		background: var(--bg-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
	}
	
	.slots-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.slot-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		transition: all 0.15s ease;
	}
	
	.slot-item:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}
	
	.slot-item.slot-status--cancelled {
		background: var(--color-error-50);
		border-color: var(--color-error-200);
		opacity: 0.8;
	}
	
	.slot-item.slot-status--full {
		background: var(--color-warning-50);
		border-color: var(--color-warning-200);
	}
	
	.slot-main {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}
	
	.slot-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-primary);
	}
	
	.time-text {
		font-size: var(--text-sm);
		font-weight: 500;
		font-family: var(--font-mono);
	}
	
	.multi-day-badge {
		padding: 0.125rem 0.375rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border-radius: var(--radius-sm);
		font-size: 0.625rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}
	
	.multi-day-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: var(--text-xs);
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		margin-top: 0.25rem;
	}
	
	.slot-details {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 0.375rem;
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}
	
	.slot-status {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	
	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 500;
	}
	
	.status-badge--full {
		background: var(--color-warning-100);
		color: var(--color-warning-700);
	}
	
	.status-badge--partial {
		background: var(--color-info-100);
		color: var(--color-info-700);
	}
	
	.preview-footer {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-primary);
	}
	
	.help-text {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		text-align: center;
		margin: 0;
		font-style: italic;
	}
	
	/* Empty compact state */
	.empty-compact {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.empty-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-primary);
	}
	
	.empty-message {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: var(--text-xs);
		color: var(--color-success-700);
		background: var(--color-success-50);
		padding: 0.375rem 0.5rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-success-200);
		margin: 0;
	}
	
	/* Mobile responsive */
	@media (max-width: 640px) {
		.day-slot-preview {
			margin-top: 0.75rem;
			padding: 0.75rem;
		}
		
		.preview-header {
			margin-bottom: 0.5rem;
			padding-bottom: 0.5rem;
		}
		
		.date-text {
			font-size: var(--text-xs);
		}
		
		.slot-item {
			padding: 0.5rem;
		}
		
		.slot-main {
			gap: 0.375rem;
		}
		
		.slot-details {
			gap: 0.75rem;
		}
		
		.detail-item {
			gap: 0.25rem;
		}
		
		.day-slot-preview--empty {
			padding: 0.5rem;
			margin-top: 0.5rem;
		}
		
		.empty-compact {
			gap: 0.375rem;
		}
		
		.empty-message {
			font-size: 0.6875rem;
			padding: 0.25rem 0.375rem;
			gap: 0.25rem;
		}
	}
</style> 