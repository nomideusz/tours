<script lang="ts">
	import Bell from 'lucide-svelte/icons/bell';
	import Menu from 'lucide-svelte/icons/menu';
	import User from 'lucide-svelte/icons/user';
	import LogOut from 'lucide-svelte/icons/log-out';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import NotificationPanel from '$lib/components/NotificationPanel.svelte';
	import PromoStatusBanner from '$lib/components/PromoStatusBanner.svelte';
	
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
<header class="{className}" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-primary);">
	<div class="flex items-center justify-between px-4 py-3">
		<!-- Left: Mobile menu + Page title -->
		<div class="flex items-center gap-3">
			<!-- Mobile menu button -->
			{#if showSidebarToggle}
				<button
					onclick={onSidebarToggle}
					class="lg:hidden p-2 -ml-2 rounded-md transition-colors"
					style="color: var(--text-tertiary);"
					onmouseenter={(e) => {
						e.currentTarget.style.color = 'var(--text-primary)';
						e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
					}}
					onmouseleave={(e) => {
						e.currentTarget.style.color = 'var(--text-tertiary)';
						e.currentTarget.style.backgroundColor = 'transparent';
					}}
					aria-label="Open sidebar"
				>
					<Menu class="h-5 w-5" />
				</button>
			{/if}
			
			<!-- Page title - clickable home link -->
			<a 
				href="/dashboard"
				class="text-lg font-normal lg:text-xl transition-colors logo-serif nav-link"
				style="color: var(--text-primary);"
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
					class="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors"
					style="color: var(--text-secondary);"
					onmouseenter={(e) => {
						e.currentTarget.style.color = 'var(--text-primary)';
						e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
					}}
					onmouseleave={(e) => {
						e.currentTarget.style.color = 'var(--text-secondary)';
						e.currentTarget.style.backgroundColor = 'transparent';
					}}
				>
					<ExternalLink class="h-4 w-4" />
					<span>Public Site</span>
				</button>
			</Tooltip>
			
			<!-- Mobile Public Site Link (Icon Only) -->
			<Tooltip text="View Public Site">
				<button
					onclick={() => window.location.href = '/?view=home'}
					class="sm:hidden p-2 rounded-md transition-colors"
					style="color: var(--text-tertiary);"
					onmouseenter={(e) => {
						e.currentTarget.style.color = 'var(--text-primary)';
						e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
					}}
					onmouseleave={(e) => {
						e.currentTarget.style.color = 'var(--text-tertiary)';
						e.currentTarget.style.backgroundColor = 'transparent';
					}}
				>
					<ExternalLink class="h-4 w-4" />
				</button>
			</Tooltip>

			<!-- Theme Toggle -->
			<ThemeToggle tooltipPosition="bottom" />

			<!-- Notifications -->
			<NotificationPanel tooltipPosition="bottom-left" />

			<!-- User menu -->
			<div class="flex items-center gap-2 pl-2 border-l" style="border-color: var(--border-primary);">
				<!-- User avatar/info -->
				<Tooltip text="Profile Settings">
					<a 
						href="/profile"
						title=""
						class="flex items-center gap-2 p-1 rounded-md transition-colors group"
						onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
					>
						{#if user?.avatar}
							<img 
								src={user.avatar} 
								alt={user.name || user.email}
								class="h-7 w-7 rounded-full object-cover"
							/>
						{:else}
							<div class="h-7 w-7 rounded-full flex items-center justify-center" style="background: var(--color-primary-100);">
								<User class="h-4 w-4" style="color: var(--color-primary-600);" />
							</div>
						{/if}
						<span class="hidden sm:block text-sm font-medium max-w-32 truncate" style="color: var(--text-primary);">
							{user?.name || user?.email || 'User'}
						</span>
					</a>
				</Tooltip>
				
				<!-- Promo Status Banner - Hidden on mobile -->
				{#if user && (user.promoCodeUsed || user.subscriptionDiscountPercentage > 0 || (user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date()))}
					<div class="hidden sm:block">
						<PromoStatusBanner variant="compact" />
					</div>
				{/if}

				<!-- Logout button -->
				<Tooltip text="Sign out" position="bottom-left">
					<button
						onclick={onLogout}
						class="p-2 rounded-md transition-colors"
						style="color: var(--text-tertiary);"
						onmouseenter={(e) => {
							e.currentTarget.style.color = 'var(--text-primary)';
							e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
						}}
						onmouseleave={(e) => {
							e.currentTarget.style.color = 'var(--text-tertiary)';
							e.currentTarget.style.backgroundColor = 'transparent';
						}}
					>
						<LogOut class="h-4 w-4" />
					</button>
				</Tooltip>
			</div>
		</div>
	</div>
</header> 