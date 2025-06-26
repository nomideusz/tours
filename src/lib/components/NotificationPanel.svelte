<script lang="ts">
	import { goto } from '$app/navigation';
	import { notifications, unreadCount, notificationActions } from '$lib/stores/notifications.js';
	import { scale, fly } from 'svelte/transition';
	import { clickOutside } from '$lib/utils/click-outside.js';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	// Icons
	import Bell from 'lucide-svelte/icons/bell';
	import X from 'lucide-svelte/icons/x';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Info from 'lucide-svelte/icons/info';
	import Eye from 'lucide-svelte/icons/eye';
	import ExternalLink from 'lucide-svelte/icons/external-link';

	let { tooltipPosition = 'bottom' } = $props<{
		tooltipPosition?: 'bottom' | 'bottom-left' | 'bottom-right';
	}>();

	let showPanel = $state(false);
	let panelElement = $state<HTMLElement>();
	let buttonElement = $state<HTMLButtonElement>();

	$effect(() => {
		console.log('📊 NotificationPanel: Current notifications count:', $notifications.length);
		console.log('📊 NotificationPanel: Unread count:', $unreadCount);
		if ($notifications.length > 0) {
			console.log('📊 NotificationPanel: Latest notifications:', $notifications.slice(0, 3));
		}
	});

	function getNotificationIcon(type: string) {
		switch (type) {
			case 'new_booking':
				return Calendar;
			case 'payment_received':
				return DollarSign;
			case 'booking_cancelled':
				return XCircle;
			case 'system':
			case 'info':
			default:
				return Info;
		}
	}

	function getNotificationColor(type: string) {
		switch (type) {
			case 'new_booking':
				return 'text-green-600';
			case 'payment_received':
				return 'text-blue-600';
			case 'booking_cancelled':
				return 'text-red-600';
			case 'system':
			case 'info':
			default:
				return 'text-gray-600';
		}
	}

	async function handleNotificationClick(notification: any) {
		// Mark as read
		await notificationActions.markAsRead(notification.id);
		
		// Navigate to the first action URL if available
		if (notification.actions && notification.actions.length > 0) {
			goto(notification.actions[0].url);
			showPanel = false;
		}
	}

	function formatTimestamp(timestamp: string) {
		try {
			const now = new Date();
			const time = new Date(timestamp);
			const diffMs = now.getTime() - time.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMins / 60);
			const diffDays = Math.floor(diffHours / 24);
			
			if (diffMins < 1) return 'just now';
			if (diffMins < 60) return `${diffMins}m ago`;
			if (diffHours < 24) return `${diffHours}h ago`;
			if (diffDays < 7) return `${diffDays}d ago`;
			return time.toLocaleDateString();
		} catch {
			return 'Unknown time';
		}
	}

	async function handleMarkAllRead() {
		await notificationActions.markAllAsRead();
	}

	async function handleClearAll() {
		await notificationActions.clear();
	}

	function handleClickOutside(event: MouseEvent) {
		// Don't close if clicking on the bell button itself
		if (buttonElement && buttonElement.contains(event.target as Node)) {
			return;
		}
		showPanel = false;
	}

	function togglePanel() {
		showPanel = !showPanel;
	}
</script>

<div class="relative">
	<!-- Notification Bell Button -->
	<Tooltip text={$unreadCount > 0 ? `${$unreadCount} unread notification${$unreadCount === 1 ? '' : 's'}` : 'Notifications'} position={tooltipPosition}>
		<button
			bind:this={buttonElement}
			onclick={togglePanel}
			class="relative p-2 rounded-md transition-colors"
			style="color: var(--text-tertiary);"
			onmouseenter={(e) => {
				e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
			}}
			onmouseleave={(e) => {
				e.currentTarget.style.backgroundColor = 'transparent';
			}}
		>
			<Bell class="h-5 w-5" />
			{#if $unreadCount > 0}
				<span 
					class="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center font-medium"
					style="background: var(--color-danger-600); color: white;"
					transition:scale={{ duration: 200 }}
				>
					{$unreadCount > 99 ? '99+' : $unreadCount}
				</span>
			{/if}
		</button>
	</Tooltip>

	<!-- Notification Panel -->
	{#if showPanel}
		<div
			bind:this={panelElement}
			use:clickOutside={handleClickOutside}
			class="fixed top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200"
			style="z-index: var(--z-dropdown);"
			transition:fly={{ y: -10, duration: 200 }}
		>
			<!-- Header -->
			<div class="p-4 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">Notifications</h3>
					<div class="flex items-center gap-2">
						{#if $unreadCount > 0}
							<button
								onclick={handleMarkAllRead}
								class="text-xs text-blue-600 hover:text-blue-800 font-medium"
							>
								Mark all read
							</button>
						{/if}
						<button
							onclick={() => showPanel = false}
							class="p-1 rounded hover:bg-gray-100 transition-colors"
						>
							<X class="h-4 w-4 text-gray-400" />
						</button>
					</div>
				</div>
			</div>

			<!-- Notifications List -->
			<div class="max-h-96 overflow-y-auto">
				{#if $notifications.length === 0}
					<div class="p-8 text-center">
						<Bell class="h-8 w-8 text-gray-300 mx-auto mb-2" />
						<p class="text-sm text-gray-500">No notifications yet</p>
						<p class="text-xs text-gray-400 mt-1">You'll be notified when you get new bookings</p>
					</div>
				{:else}
					{#each $notifications as notification (notification.id)}
						<div
							class="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
							onclick={() => handleNotificationClick(notification)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
						>
							<div class="p-4">
								<div class="flex items-start gap-3">
									<!-- Icon -->
									<div class="flex-shrink-0 mt-0.5">
										{#if notification.type === 'new_booking'}
											<Calendar class="h-5 w-5 text-green-600" />
										{:else if notification.type === 'payment_received'}
											<DollarSign class="h-5 w-5 text-blue-600" />
										{:else if notification.type === 'booking_cancelled'}
											<XCircle class="h-5 w-5 text-red-600" />
										{:else}
											<Info class="h-5 w-5 text-gray-600" />
										{/if}
									</div>

									<!-- Content -->
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<p class="text-sm font-medium text-gray-900 {!notification.read ? 'font-semibold' : ''}">
													{notification.title}
												</p>
												<p class="text-sm text-gray-600 mt-0.5">
													{notification.message}
												</p>
												<p class="text-xs text-gray-400 mt-1">
													{formatTimestamp(notification.timestamp)}
												</p>
											</div>
											
											<!-- Unread indicator -->
											{#if !notification.read}
												<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
											{/if}
										</div>

										<!-- Actions -->
										{#if notification.actions && notification.actions.length > 0}
											<div class="flex gap-2 mt-3">
												{#each notification.actions.slice(0, 2) as action}
													<button
														onclick={(e) => {
															e.stopPropagation();
															goto(action.url);
															showPanel = false;
														}}
														class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
													>
														{#if action.label.includes('View')}
															<Eye class="h-3 w-3" />
														{:else}
															<ExternalLink class="h-3 w-3" />
														{/if}
														{action.label}
													</button>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			{#if $notifications.length > 0}
				<div class="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
					<div class="flex justify-between items-center">
						<span class="text-xs text-gray-500">
							{$notifications.length} notification{$notifications.length === 1 ? '' : 's'}
						</span>
						<button
							onclick={handleClearAll}
							class="text-xs text-red-600 hover:text-red-800 font-medium"
						>
							Clear all
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 