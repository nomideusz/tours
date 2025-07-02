<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	
	// Icons
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	
	let currentDate = $state(new Date());
	let view = $state<'day' | 'week' | 'month'>('month');
	let mounted = $state(false);
	
	onMount(() => {
		mounted = true;
	});
	
	// Generate calendar days for current month
	const calendarDays = $derived.by(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		
		// First day of the month
		const firstDay = new Date(year, month, 1);
		// Last day of the month  
		const lastDay = new Date(year, month + 1, 0);
		// First day of the week (Sunday = 0)
		const firstDayOfWeek = firstDay.getDay();
		
		const days = [];
		
		// Add empty cells for days before the first day of month
		for (let i = 0; i < firstDayOfWeek; i++) {
			days.push({ date: null, isCurrentMonth: false, hasSlots: false, slotCount: 0 });
		}
		
		// Add all days of the current month
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			const isToday = date.toDateString() === new Date().toDateString();
			
			// Add some sample tour slots for demo purposes
			let hasSlots = false;
			let slotCount = 0;
			
			// Add sample slots to some days for visual interest
			if (day % 3 === 0 || day % 7 === 1) {
				hasSlots = true;
				slotCount = day % 3 === 0 ? 2 : 1;
			}
			
			days.push({ 
				date, 
				isCurrentMonth: true, 
				isToday,
				hasSlots,
				slotCount
			});
		}
		
		return days;
	});
	
	// Sample time slots for day/week view
	const sampleSlots = [
		{ time: '10:00', tour: 'City Walking Tour', capacity: 15, booked: 8 },
		{ time: '14:00', tour: 'Photography Workshop', capacity: 8, booked: 5 },
		{ time: '16:30', tour: 'Wine Tasting', capacity: 12, booked: 12 }
	];
	
	function navigateMonth(direction: 'prev' | 'next') {
		const newDate = new Date(currentDate);
		if (direction === 'prev') {
			newDate.setMonth(newDate.getMonth() - 1);
		} else {
			newDate.setMonth(newDate.getMonth() + 1);
		}
		currentDate = newDate;
	}
	
	function formatMonth(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}
	
	function getAvailabilityColor(booked: number, capacity: number): string {
		const percentage = (booked / capacity) * 100;
		if (percentage >= 100) return 'var(--color-danger-500)';
		if (percentage >= 80) return 'var(--color-warning-500)';
		if (percentage >= 50) return 'var(--color-info-500)';
		return 'var(--color-success-500)';
	}
</script>

{#if mounted}
	<div class="calendar-preview" in:fade={{ duration: 300 }}>
		<!-- Calendar Header -->
		<div class="calendar-header">
			<div class="calendar-nav">
				<button 
					class="nav-button" 
					onclick={() => navigateMonth('prev')}
					aria-label="Previous month"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>
				
				<h3 class="calendar-title">{formatMonth(currentDate)}</h3>
				
				<button 
					class="nav-button" 
					onclick={() => navigateMonth('next')}
					aria-label="Next month"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
			
			<div class="view-toggles">
				<button 
					class="view-toggle {view === 'month' ? 'active' : ''}"
					onclick={() => view = 'month'}
				>
					Month
				</button>
				<button 
					class="view-toggle {view === 'week' ? 'active' : ''}"
					onclick={() => view = 'week'}
				>
					Week
				</button>
				<button 
					class="view-toggle {view === 'day' ? 'active' : ''}"
					onclick={() => view = 'day'}
				>
					Day
				</button>
			</div>
		</div>
		
		{#if view === 'month'}
			<!-- Month View -->
			<div class="month-view">
				<!-- Day headers -->
				<div class="day-headers">
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
						<div class="day-header">{day}</div>
					{/each}
				</div>
				
				<!-- Calendar Grid -->
				<div class="calendar-grid">
					{#each calendarDays as day, index}
						<div 
							class="calendar-day {day.isCurrentMonth ? 'current-month' : 'other-month'} {day.isToday ? 'today' : ''}"
							in:fade={{ duration: 200, delay: index * 10 }}
						>
							{#if day.date}
								<span class="day-number">{day.date.getDate()}</span>
								{#if day.hasSlots}
									<div class="slot-indicators">
										{#each Array(day.slotCount) as _, i}
											<div class="slot-dot" style="background: var(--color-primary-500);"></div>
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else if view === 'day'}
			<!-- Day View -->
			<div class="day-view">
				<div class="day-header-section">
					<Calendar class="w-5 h-5" style="color: var(--color-primary-600);" />
					<span class="day-title">Today's Schedule</span>
				</div>
				
				<div class="time-slots">
					{#each sampleSlots as slot, index}
						<div class="time-slot" in:fade={{ duration: 300, delay: index * 100 }}>
							<div class="slot-time">
								<Clock class="w-4 h-4" />
								{slot.time}
							</div>
							<div class="slot-details">
								<div class="slot-tour">{slot.tour}</div>
								<div class="slot-capacity">
									<Users class="w-3 h-3" />
									{slot.booked}/{slot.capacity} guests
								</div>
							</div>
							<div class="slot-status">
								<div 
									class="availability-bar"
									style="background: {getAvailabilityColor(slot.booked, slot.capacity)};"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Week View -->
			<div class="week-view">
				<div class="week-header">
					<Calendar class="w-5 h-5" style="color: var(--color-primary-600);" />
					<span class="week-title">This Week</span>
				</div>
				
				<div class="week-grid">
					{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as day, dayIndex}
						<div class="week-day">
							<div class="week-day-header">{day}</div>
							{#if dayIndex === 1 || dayIndex === 3 || dayIndex === 5}
								<div class="week-slots">
									{#each sampleSlots.slice(0, dayIndex === 1 ? 2 : 1) as slot}
										<div class="week-slot">
											<div class="week-slot-time">{slot.time}</div>
											<div class="week-slot-tour">{slot.tour}</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Footer Stats -->
		<div class="calendar-stats">
			<div class="stat-item">
				<span class="stat-value">12</span>
				<span class="stat-label">This Month</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">3</span>
				<span class="stat-label">Today</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">84%</span>
				<span class="stat-label">Booked</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.calendar-preview {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}
	
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}
	
	.calendar-nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--text-secondary);
	}
	
	.nav-button:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
	}
	
	.calendar-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		min-width: 200px;
		text-align: center;
	}
	
	.view-toggles {
		display: flex;
		gap: 0.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.25rem;
	}
	
	.view-toggle {
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.view-toggle.active {
		background: var(--color-primary-600);
		color: white;
	}
	
	.view-toggle:hover:not(.active) {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
	
	/* Month View */
	.month-view {
		padding: 1rem;
	}
	
	.day-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		margin-bottom: 0.5rem;
	}
	
	.day-header {
		padding: 0.5rem;
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		background: var(--border-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.calendar-day {
		background: var(--bg-primary);
		padding: 0.75rem 0.5rem;
		min-height: 4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		position: relative;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	
	.calendar-day:hover {
		background: var(--bg-secondary);
	}
	
	.calendar-day.other-month {
		background: var(--bg-tertiary);
		color: var(--text-tertiary);
	}
	
	.calendar-day.today {
		background: var(--color-primary-50);
		border: 2px solid var(--color-primary-500);
	}
	
	.day-number {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.calendar-day.other-month .day-number {
		color: var(--text-tertiary);
	}
	
	.slot-indicators {
		display: flex;
		gap: 0.125rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	
	.slot-dot {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		background: var(--color-primary-500);
	}
	
	/* Day View */
	.day-view {
		padding: 1rem 1.5rem;
	}
	
	.day-header-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.day-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.time-slots {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.time-slot {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	
	.time-slot:hover {
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-sm);
	}
	
	.slot-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--text-primary);
		min-width: 5rem;
	}
	
	.slot-details {
		flex: 1;
	}
	
	.slot-tour {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.slot-capacity {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.slot-status {
		display: flex;
		align-items: center;
	}
	
	.availability-bar {
		width: 0.25rem;
		height: 2rem;
		border-radius: 0.125rem;
	}
	
	/* Week View */
	.week-view {
		padding: 1rem 1.5rem;
	}
	
	.week-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.week-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.week-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.5rem;
	}
	
	.week-day {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.75rem;
		min-height: 8rem;
	}
	
	.week-day-header {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		text-align: center;
	}
	
	.week-slots {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.week-slot {
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.25rem;
		padding: 0.375rem;
		font-size: 0.75rem;
	}
	
	.week-slot-time {
		font-weight: 600;
		color: var(--color-primary-700);
	}
	
	.week-slot-tour {
		color: var(--color-primary-600);
		margin-top: 0.125rem;
	}
	
	/* Calendar Stats */
	.calendar-stats {
		display: flex;
		justify-content: space-around;
		padding: 1rem 1.5rem;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-primary);
	}
	
	.stat-item {
		text-align: center;
	}
	
	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}
	
	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.calendar-header {
			padding: 0.75rem 1rem;
			flex-direction: column;
			gap: 1rem;
		}
		
		.calendar-nav {
			order: 2;
		}
		
		.view-toggles {
			order: 1;
		}
		
		.calendar-title {
			min-width: auto;
		}
		
		.month-view,
		.day-view,
		.week-view {
			padding: 0.75rem 1rem;
		}
		
		.calendar-day {
			min-height: 3rem;
			padding: 0.5rem 0.25rem;
		}
		
		.day-number {
			font-size: 0.75rem;
		}
		
		.time-slot {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.slot-time {
			min-width: auto;
		}
		
		.week-grid {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}
		
		.week-day {
			min-height: auto;
			padding: 0.5rem;
		}
		
		.calendar-stats {
			padding: 0.75rem 1rem;
		}
		
		.stat-value {
			font-size: 1.25rem;
		}
	}
</style> 