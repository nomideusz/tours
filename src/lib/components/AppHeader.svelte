<script lang="ts">
	import Bell from 'lucide-svelte/icons/bell';
	import Menu from 'lucide-svelte/icons/menu';
	import User from 'lucide-svelte/icons/user';
	import LogOut from 'lucide-svelte/icons/log-out';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import NotificationPanel from '$lib/components/NotificationPanel.svelte';
	
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

	// Notifications are now handled by the NotificationPanel component
</script>

<style>
	.logo-serif {
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 400;
		letter-spacing: -0.025em;
	}
</style>

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
				class="text-lg font-normal text-gray-900 lg:text-xl hover:text-gray-700 transition-colors logo-serif"
			>
				{pageTitle}
			</a>
		</div>

		<!-- Right: User actions -->
		<div class="flex items-center gap-2">
			<!-- Public Site Link -->
			<Tooltip text="View Public Site">
				<button
					onclick={() => window.location.href = '/?view=home'}
					class="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
				>
					<ExternalLink class="h-4 w-4" />
					<span>Public Site</span>
				</button>
			</Tooltip>
			
			<!-- Mobile Public Site Link (Icon Only) -->
			<Tooltip text="View Public Site">
				<button
					onclick={() => window.location.href = '/?view=home'}
					class="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
				>
					<ExternalLink class="h-4 w-4" />
				</button>
			</Tooltip>

			<!-- Theme Toggle -->
			<ThemeToggle tooltipPosition="bottom" />

			<!-- Notifications -->
			<NotificationPanel tooltipPosition="bottom-left" />

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