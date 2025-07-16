<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import TableSort from '$lib/components/TableSort.svelte';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { globalCurrencyFormatter, formatCurrency } from '$lib/utils/currency.js';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import { createTableSort, sortData, createSortableFields } from '$lib/utils/table-sort.js';
	
	// Icons
	import Users from 'lucide-svelte/icons/users';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Edit from 'lucide-svelte/icons/edit';
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import Download from 'lucide-svelte/icons/download';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Calendar from 'lucide-svelte/icons/calendar';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Activity from 'lucide-svelte/icons/activity';
	import Eye from 'lucide-svelte/icons/eye';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import X from 'lucide-svelte/icons/x';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Crown from 'lucide-svelte/icons/crown';
	import Globe from 'lucide-svelte/icons/globe';
	import UserX from 'lucide-svelte/icons/user-x';
	import QrCode from 'lucide-svelte/icons/qr-code';
	
	const queryClient = useQueryClient();
	
	// Check admin access - wait for auth to load before redirecting
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});
	
	// Query for admin stats
	const adminStatsQuery = createQuery({
		queryKey: ['admin', 'stats'],
		queryFn: async () => {
			const response = await fetch('/api/admin/stats');
			if (!response.ok) throw new Error('Failed to fetch admin stats');
			return response.json();
		},
		enabled: browser,
		staleTime: 30 * 1000,
		refetchInterval: 60 * 1000
	});
	
	// Query for users list
	const usersQuery = createQuery({
		queryKey: ['admin', 'users'],
		queryFn: async () => {
			const response = await fetch('/api/admin/users');
			if (!response.ok) throw new Error('Failed to fetch users');
			return response.json();
		},
		enabled: browser,
		staleTime: 30 * 1000
	});
	
	// Derived states
	let stats = $derived($adminStatsQuery.data || {
		totalUsers: 0,
		activeUsers: 0,
		totalRevenue: 0,
		totalBookings: 0,
		totalTours: 0,
		newUsersToday: 0
	});
	
	let users = $derived($usersQuery.data || []);
	let isLoading = $derived($adminStatsQuery.isLoading || $usersQuery.isLoading);
	let isError = $derived($adminStatsQuery.isError || $usersQuery.isError);
	
	// Search and filter states
	let searchQuery = $state('');
	let selectedRole = $state<'all' | 'admin' | 'user'>('all');
	let selectedPlan = $state<'all' | 'free' | 'starter_pro' | 'professional' | 'agency'>('all');
	let showFilters = $state(false);
	
	// Table sorting setup
	type SortField = 'created' | 'lastLogin' | 'name' | 'revenue';
	let sortBy = $state<SortField>('created');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	
	// Define sortable fields
	const sortableFields = createSortableFields<any>({
		created: { getValue: (item) => item.createdAt, type: 'date' },
		lastLogin: { getValue: (item) => item.lastLogin, type: 'date' },
		name: { getValue: (item) => item.name || item.email, type: 'string' },
		revenue: { getValue: (item) => item.totalRevenue || 0, type: 'number' }
	});
	
	// Sort columns configuration
	const sortColumns = [
		{ key: 'name', label: 'USER' },
		{ key: 'roleplan', label: 'ROLE/PLAN', sortable: false },
		{ key: 'location', label: 'LOCATION', sortable: false },
		{ key: 'lastLogin', label: 'ACTIVITY' },
		{ key: 'revenue', label: 'STATS' },
		{ key: 'actions', label: 'ACTIONS', sortable: false }
	];
	
	// Modal states
	let deleteUserModal = $state(false);
	let userToDelete = $state<any>(null);
	let isDeleting = $state(false);
	let deleteError = $state<string | null>(null);
	
	// Filter users
	let filteredUsers = $derived.by(() => {
		let result = [...users];
		
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((user: any) => 
				user.name?.toLowerCase().includes(query) ||
				user.email.toLowerCase().includes(query) ||
				user.businessName?.toLowerCase().includes(query)
			);
		}
		
		// Role filter
		if (selectedRole !== 'all') {
			result = result.filter((user: any) => user.role === selectedRole);
		}
		
		// Plan filter
		if (selectedPlan !== 'all') {
			result = result.filter((user: any) => user.subscriptionPlan === selectedPlan);
		}
		
		// Sort using the reusable utility
		result = sortData(result, { sortBy, sortOrder }, sortableFields);
		
		return result;
	});
	
	// Delete user function
	async function deleteUser() {
		if (!userToDelete) return;
		
		isDeleting = true;
		deleteError = null;
		
		try {
			const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to delete user');
			}
			
			// Refresh users list
			await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
			await queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
			
			// Close modal
			deleteUserModal = false;
			userToDelete = null;
		} catch (error) {
			deleteError = error instanceof Error ? error.message : 'Failed to delete user';
		} finally {
			isDeleting = false;
		}
	}
	
	// Export users to CSV
	async function exportUsers() {
		const csvData = filteredUsers.map((user: any) => ({
			Name: user.name || '',
			Email: user.email,
			Role: user.role,
			Plan: user.subscriptionPlan,
			Country: user.country || '',
			Tours: user.tourCount || 0,
			Bookings: user.bookingCount || 0,
			Revenue: user.totalRevenue || 0,
			Created: formatDate(user.createdAt),
			LastLogin: user.lastLogin ? formatDate(user.lastLogin) : 'Never'
		}));
		
		const headers = Object.keys(csvData[0]);
		const csvContent = [
			headers.join(','),
			...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
		].join('\n');
		
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `zaur-users-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
	
	// Get plan badge color
	function getPlanBadgeClass(plan: string) {
		switch (plan) {
			case 'free':
				return 'badge-gray';
			case 'starter_pro':
				return 'badge-blue';
			case 'professional':
				return 'badge-purple';
			case 'agency':
				return 'badge-gold';
			default:
				return 'badge-gray';
		}
	}
	
	// Format plan name
	function formatPlanName(plan: string) {
		switch (plan) {
			case 'free':
				return 'Free';
			case 'starter_pro':
				return 'Starter Pro';
			case 'professional':
				return 'Professional';
			case 'agency':
				return 'Agency';
			default:
				return 'Unknown';
		}
	}
	
	// Check if user is deletable
	function canDeleteUser(user: any) {
		// Don't allow deleting yourself or other admins
		return user.role !== 'admin';
	}
	
	// Handle sort from component
	function handleSort(field: string) {
		const fieldTyped = field as SortField;
		if (sortBy === fieldTyped) {
			// Toggle sort order if same field is selected
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			// Set new field with default desc order
			sortBy = fieldTyped;
			sortOrder = 'desc';
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Zaur</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if $authLoading}
	<div class="flex items-center justify-center min-h-[60vh]">
		<div class="text-center">
			<Loader2 class="h-12 w-12 mx-auto mb-4 animate-spin" style="color: var(--text-tertiary);" />
			<h1 class="text-xl font-medium mb-2" style="color: var(--text-primary);">Loading...</h1>
			<p class="text-sm" style="color: var(--text-secondary);">Checking access permissions...</p>
		</div>
	</div>
{:else if !$isAdmin}
	<div class="flex items-center justify-center min-h-[60vh]">
		<div class="text-center">
			<Shield class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
			<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Access Denied</h1>
			<p class="text-sm mb-4" style="color: var(--text-secondary);">You don't have permission to access this page.</p>
			<button onclick={() => goto('/dashboard')} class="button-primary">
				Go to Dashboard
			</button>
		</div>
	</div>
{:else}
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<div class="block lg:hidden">
				<MobilePageHeader
					title="Admin Panel"
					secondaryInfo={isLoading ? 'Loading...' : `${stats.totalUsers} users`}
					quickActions={[
						{
							label: 'Tours',
							icon: MapPin,
							onclick: () => goto('/admin/tours'),
							variant: 'secondary'
						},
						{
							label: 'Stickers',
							icon: QrCode,
							onclick: () => goto('/admin/stickers'),
							variant: 'secondary'
						},
						{
							label: 'Export',
							icon: Download,
							onclick: exportUsers,
							variant: 'secondary'
						}
					]}
					infoItems={[
						{
							icon: Users,
							label: 'Total Users',
							value: isLoading ? '...' : `${stats.totalUsers}`
					},
					{
						icon: CreditCard,
						label: 'Revenue',
						value: isLoading ? '...' : $globalCurrencyFormatter(stats.totalRevenue)
					},
					{
						icon: Activity,
						label: 'Active',
						value: isLoading ? '...' : `${stats.activeUsers}`
					},
					{
						icon: Calendar,
						label: 'New Today',
						value: isLoading ? '...' : `${stats.newUsersToday}`
					}
				]}
			/>
			</div>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Admin Dashboard"
					subtitle="Manage users and monitor platform activity"
				>
					<div class="flex items-center gap-3">
						<button onclick={() => goto('/admin/tours')} class="button-secondary button--gap">
							<MapPin class="h-4 w-4" />
							Tour Management
						</button>
						<button onclick={() => goto('/admin/email-dashboard')} class="button-secondary button--gap">
							<Mail class="h-4 w-4" />
							Email Tools
						</button>
						<button onclick={() => goto('/admin/stickers')} class="button-secondary button--gap">
							<QrCode class="h-4 w-4" />
							Stickers
						</button>
						<button onclick={exportUsers} class="button-primary button--gap">
							<Download class="h-4 w-4" />
							Export Users
						</button>
					</div>
				</PageHeader>
			</div>
		</div>
		
		<!-- Stats Cards -->
		<div class="hidden sm:grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
			<StatsCard 
				title="Total Users"
				value={stats.totalUsers}
				subtitle="Registered users"
				icon={Users}
			/>
			
			<StatsCard 
				title="Active Users"
				value={stats.activeUsers}
				subtitle="Last 30 days"
				icon={Activity}
			/>
			
			<StatsCard 
				title="Revenue"
				value={$globalCurrencyFormatter(stats.totalRevenue)}
				subtitle="All time"
				icon={CreditCard}
			/>
			
			<StatsCard 
				title="Bookings"
				value={stats.totalBookings}
				subtitle="Total bookings"
				icon={Calendar}
			/>
			
			<!-- Tours Card - clickable to navigate to tour management -->
			<button onclick={() => goto('/admin/tours')} class="text-left cursor-pointer">
				<StatsCard 
					title="Tours"
					value={stats.totalTours}
					subtitle="Click to manage →"
					icon={MapPin}
				/>
			</button>
			
			<!-- Stickers Card - clickable to navigate to sticker generator -->
			<button onclick={() => goto('/admin/stickers')} class="text-left cursor-pointer">
				<StatsCard 
					title="Stickers"
					value="Generate"
					subtitle="Marketing tools →"
					icon={QrCode}
				/>
			</button>
			
			<StatsCard 
				title="New Today"
				value={stats.newUsersToday}
				subtitle="New signups"
				icon={Users}
			/>
		</div>
		
		<!-- Search and Filters -->
		<div class="mb-6 space-y-4">
			<div class="flex flex-col sm:flex-row gap-3">
				<!-- Search -->
				<div class="flex-1 relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search by name, email, or business..."
						class="form-input pl-10 w-full"
					/>
				</div>
				
				<!-- Filter Button -->
				<button
					onclick={() => showFilters = !showFilters}
					class="button-secondary button--gap"
				>
					<Filter class="h-4 w-4" />
					Filters
					<ChevronDown class="h-4 w-4 ml-1 transition-transform {showFilters ? 'rotate-180' : ''}" />
				</button>
			</div>
			
			<!-- Filter Panel -->
			{#if showFilters}
				<div class="rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
						<div>
							<label for="role-select" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
								Role
							</label>
							<select id="role-select" bind:value={selectedRole} class="form-select w-full">
								<option value="all">All Roles</option>
								<option value="user">Users</option>
								<option value="admin">Admins</option>
							</select>
						</div>
						
						<div>
							<label for="plan-select" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
								Plan
							</label>
							<select id="plan-select" bind:value={selectedPlan} class="form-select w-full">
								<option value="all">All Plans</option>
								<option value="free">Free</option>
								<option value="starter_pro">Starter Pro</option>
								<option value="professional">Professional</option>
								<option value="agency">Agency</option>
							</select>
						</div>
						
						<div>
							<label for="sort-select" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
								Sort By
							</label>
							<select id="sort-select" value={sortBy} onchange={(e) => handleSort((e.target as HTMLSelectElement).value)} class="form-select w-full">
								<option value="created">Registration Date</option>
								<option value="lastLogin">Last Login</option>
								<option value="name">Name</option>
								<option value="revenue">Revenue</option>
							</select>
						</div>
						
						<div>
							<label for="order-select" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
								Order
							</label>
							<select id="order-select" value={sortOrder} onchange={(e) => sortOrder = (e.target as HTMLSelectElement).value as 'asc' | 'desc'} class="form-select w-full">
								<option value="desc">Descending</option>
								<option value="asc">Ascending</option>
							</select>
						</div>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Users Table -->
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
			</div>
		{:else if isError}
			<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<AlertCircle class="h-12 w-12 mx-auto mb-4" style="color: var(--color-danger-600);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Failed to load data</h3>
				<p class="text-sm" style="color: var(--text-secondary);">Please refresh the page to try again.</p>
			</div>
		{:else}
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<!-- Desktop Table -->
				<div class="hidden lg:block">
					<div class="overflow-x-auto">
					<table class="w-full">
						<thead style="background: var(--bg-secondary);">
							<TableSort 
								columns={sortColumns}
								sortBy={sortBy}
								sortOrder={sortOrder}
								onSort={handleSort}
								variant="desktop"
							/>
						</thead>
						<tbody class="divide-y" style="border-color: var(--border-primary);">
							{#each filteredUsers as user}
								<tr class="hover:bg-[var(--bg-secondary)] transition-colors">
									<td class="px-4 py-4">
										<div class="flex items-center gap-3">
											{#if user.avatar}
												<img src={user.avatar} alt={user.name} class="h-10 w-10 rounded-full object-cover" />
											{:else}
												<div class="h-10 w-10 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary);">
													<Users class="h-5 w-5" style="color: var(--text-tertiary);" />
												</div>
											{/if}
											<div>
												<p class="font-medium text-sm" style="color: var(--text-primary);">
													{user.name || 'Unnamed User'}
												</p>
												<p class="text-xs" style="color: var(--text-secondary);">{user.email}</p>
												{#if user.businessName}
													<p class="text-xs" style="color: var(--text-tertiary);">{user.businessName}</p>
												{/if}
											</div>
										</div>
									</td>
									<td class="px-4 py-4">
										<div class="space-y-1">
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {user.role === 'admin' ? 'badge-admin' : 'badge-default'}">
												{#if user.role === 'admin'}
													<Shield class="h-3 w-3 mr-1" />
												{/if}
												{user.role}
											</span>
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getPlanBadgeClass(user.subscriptionPlan)}">
												{#if user.subscriptionPlan === 'agency'}
													<Crown class="h-3 w-3 mr-1" />
												{/if}
												{formatPlanName(user.subscriptionPlan)}
											</span>
										</div>
									</td>
									<td class="px-4 py-4">
										<div class="text-sm">
											{#if user.country}
												<div class="flex items-center gap-1">
													<Globe class="h-3 w-3" style="color: var(--text-tertiary);" />
													<span style="color: var(--text-primary);">{user.country}</span>
												</div>
											{/if}
											{#if user.location}
												<p class="text-xs" style="color: var(--text-secondary);">{user.location}</p>
											{/if}
											{#if user.currency}
												<p class="text-xs" style="color: var(--text-tertiary);">{user.currency}</p>
											{/if}
										</div>
									</td>
									<td class="px-4 py-4">
										<div class="text-sm">
											<p class="text-xs" style="color: var(--text-secondary);">
												Joined {formatDate(user.createdAt)}
											</p>
											{#if user.lastLogin}
												<p class="text-xs" style="color: var(--text-tertiary);">
													Last login: {formatDate(user.lastLogin)}
												</p>
											{:else}
												<p class="text-xs" style="color: var(--text-tertiary);">
													Never logged in
												</p>
											{/if}
											{#if user.emailVerified}
												<span class="inline-flex items-center gap-1 text-xs" style="color: var(--color-success-600);">
													<CheckCircle class="h-3 w-3" />
													Verified
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 text-xs" style="color: var(--color-warning-600);">
													<AlertCircle class="h-3 w-3" />
													Unverified
												</span>
											{/if}
										</div>
									</td>
									<td class="px-4 py-4">
										<div class="text-sm">
											<p><span style="color: var(--text-secondary);">Tours:</span> <span class="font-medium" style="color: var(--text-primary);">{user.tourCount || 0}</span></p>
											<p><span style="color: var(--text-secondary);">Bookings:</span> <span class="font-medium" style="color: var(--text-primary);">{user.bookingCount || 0}</span></p>
											<p><span style="color: var(--text-secondary);">Revenue:</span> <span class="font-medium" style="color: var(--text-primary);">{formatCurrency(user.totalRevenue || 0, { currency: user.currency || 'EUR' })}</span></p>
										</div>
									</td>
									<td class="px-4 py-4">
										<div class="flex items-center gap-2">
											<Tooltip text="View Profile" position="top">
												<button
													onclick={() => window.open(`/${user.username}`, '_blank')}
													class="button-secondary button--small button--icon"
													disabled={!user.username}
												>
													<Eye class="h-4 w-4" />
												</button>
											</Tooltip>
											{#if canDeleteUser(user)}
												<Tooltip text="Delete User" position="top">
													<button
														onclick={() => {
															userToDelete = user;
															deleteUserModal = true;
														}}
														class="button-danger button--small button--icon"
													>
														<Trash2 class="h-4 w-4" />
													</button>
												</Tooltip>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					</div>
				</div>
				
				<!-- Mobile Cards -->
				<div class="lg:hidden divide-y" style="border-color: var(--border-primary);">
					{#each filteredUsers as user}
						<div class="p-4 space-y-3">
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-center gap-3 min-w-0 flex-1">
									{#if user.avatar}
										<img src={user.avatar} alt={user.name} class="h-12 w-12 rounded-full object-cover flex-shrink-0" />
									{:else}
										<div class="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--bg-tertiary);">
											<Users class="h-6 w-6" style="color: var(--text-tertiary);" />
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="font-medium truncate" style="color: var(--text-primary);">
											{user.name || 'Unnamed User'}
										</p>
										<p class="text-sm truncate" style="color: var(--text-secondary);">{user.email}</p>
										{#if user.businessName}
											<p class="text-xs truncate" style="color: var(--text-tertiary);">{user.businessName}</p>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2 flex-shrink-0">
									<button
										onclick={() => window.open(`/${user.username}`, '_blank')}
										class="button-secondary button--small button--icon"
										disabled={!user.username}
									>
										<Eye class="h-4 w-4" />
									</button>
									{#if canDeleteUser(user)}
										<button
											onclick={() => {
												userToDelete = user;
												deleteUserModal = true;
											}}
											class="button-danger button--small button--icon"
										>
											<Trash2 class="h-4 w-4" />
										</button>
									{/if}
								</div>
							</div>
							
							<div class="flex flex-wrap gap-2">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {user.role === 'admin' ? 'badge-admin' : 'badge-default'}">
									{#if user.role === 'admin'}
										<Shield class="h-3 w-3 mr-1" />
									{/if}
									{user.role}
								</span>
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getPlanBadgeClass(user.subscriptionPlan)}">
									{formatPlanName(user.subscriptionPlan)}
								</span>
								{#if user.emailVerified}
									<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style="background: var(--color-success-100); color: var(--color-success-700);">
										<CheckCircle class="h-3 w-3" />
										Verified
									</span>
								{/if}
							</div>
							
							<div class="grid grid-cols-3 gap-2 text-center">
								<div class="rounded-lg p-3" style="background: var(--bg-secondary);">
									<p class="text-base font-bold" style="color: var(--text-primary);">{user.tourCount || 0}</p>
									<p class="text-xs" style="color: var(--text-secondary);">Tours</p>
								</div>
								<div class="rounded-lg p-3" style="background: var(--bg-secondary);">
									<p class="text-base font-bold" style="color: var(--text-primary);">{user.bookingCount || 0}</p>
									<p class="text-xs" style="color: var(--text-secondary);">Bookings</p>
								</div>
								<div class="rounded-lg p-3" style="background: var(--bg-secondary);">
									<p class="text-sm font-bold truncate" style="color: var(--text-primary);" title="{formatCurrency(user.totalRevenue || 0, { currency: user.currency || 'EUR' })}">{formatCurrency(user.totalRevenue || 0, { currency: user.currency || 'EUR' })}</p>
									<p class="text-xs" style="color: var(--text-secondary);">Revenue</p>
								</div>
							</div>
							
							<div class="text-xs" style="color: var(--text-tertiary);">
								Joined {formatDate(user.createdAt)}
								{#if user.lastLogin}
									• Last login {formatDate(user.lastLogin)}
								{/if}
							</div>
						</div>
					{/each}
				</div>
				
				{#if filteredUsers.length === 0}
					<div class="p-8 text-center">
						<Users class="h-8 w-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-secondary);">No users found matching your filters.</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
	
	<!-- Delete User Modal -->
	<ConfirmationModal
		isOpen={deleteUserModal}
		title="Delete User?"
		message={deleteError ? `Error: ${deleteError}` : `Are you sure you want to delete ${userToDelete?.name || userToDelete?.email}? This will permanently delete their account, tours, and all associated data. This action cannot be undone.`}
		confirmText={isDeleting ? "Deleting..." : "Delete User"}
		cancelText="Cancel"
		variant="danger"
		icon={UserX}
		onConfirm={deleteUser}
		onCancel={() => {
			deleteUserModal = false;
			userToDelete = null;
			deleteError = null;
		}}
		onClose={() => {
			deleteUserModal = false;
			userToDelete = null;
			deleteError = null;
		}}
	/>
{/if}

<style>
	.badge-gray {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}
	
	.badge-blue {
		background: var(--color-info-100);
		color: var(--color-info-700);
		border: 1px solid var(--color-info-200);
	}
	
	.badge-purple {
		background: #e9d5ff;
		color: #6b21a8;
		border: 1px solid #d8b4fe;
	}
	
	.badge-gold {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}
	
	.badge-admin {
		background: var(--color-danger-100);
		color: var(--color-danger-700);
		border: 1px solid var(--color-danger-200);
	}
	
	.badge-default {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}
</style> 