<script lang="ts">
	import { page } from '$app/stores';
	import Bell from 'lucide-svelte/icons/bell';
	import Menu from 'lucide-svelte/icons/menu';
	import User from 'lucide-svelte/icons/user';
	import LogOut from 'lucide-svelte/icons/log-out';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	let { 
		pageTitle, 
		user, 
		sidebarOpen = false,
		onSidebarToggle = () => {},
		onLogout = () => {},
		showSidebarToggle = true,
		class: className = ""
	} = $props<{
		pageTitle: string;
		user: any;
		sidebarOpen?: boolean;
		onSidebarToggle?: () => void;
		onLogout?: () => void;
		showSidebarToggle?: boolean;
		class?: string;
	}>();

	// Show notifications badge (placeholder for future notifications)
	let hasNotifications = false;
</script>

<!-- Minimal App Header -->
<header class="bg-white border-b border-gray-200 {className}">
	<div class="flex items-center justify-between px-4 py-3">
		<!-- Left: Mobile menu + Page title -->
		<div class="flex items-center gap-3">
			<!-- Mobile menu button -->
			{#if showSidebarToggle}
				<button
					onclick={onSidebarToggle}
					class="lg:hidden p-2 -ml-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
					aria-label="Open sidebar"
				>
					<Menu class="h-5 w-5" />
				</button>
			{/if}
			
			<!-- Page title - clickable home link -->
			<a 
				href="/dashboard"
				class="text-lg font-semibold text-gray-900 lg:text-xl hover:text-gray-700 transition-colors"
			>
				{pageTitle}
			</a>
		</div>

		<!-- Right: User actions -->
		<div class="flex items-center gap-2">
			<!-- Theme Toggle -->
			<ThemeToggle tooltipPosition="bottom" />

			<!-- Notifications (placeholder) -->
			<Tooltip text="Notifications">
				<button
					class="relative p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
				>
					<Bell class="h-5 w-5" />
					{#if hasNotifications}
						<span class="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
					{/if}
				</button>
			</Tooltip>

			<!-- User menu -->
			<div class="flex items-center gap-2 pl-2 border-l border-gray-200">
				<!-- User avatar/info -->
				<Tooltip text="Profile Settings">
					<a 
						href="/profile"
						title=""
						class="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 transition-colors group"
					>
						{#if user?.avatar}
							<img 
								src={user.avatar} 
								alt={user.name || user.email}
								class="h-7 w-7 rounded-full object-cover"
							/>
						{:else}
							<div class="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
								<User class="h-4 w-4 text-blue-600" />
							</div>
						{/if}
						<span class="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-gray-900 max-w-32 truncate">
							{user?.name || user?.email || 'User'}
						</span>
					</a>
				</Tooltip>

				<!-- Logout button -->
				<Tooltip text="Sign out" position="bottom-left">
					<button
						onclick={onLogout}
						class="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
					>
						<LogOut class="h-4 w-4" />
					</button>
				</Tooltip>
			</div>
		</div>
	</div>
</header> 