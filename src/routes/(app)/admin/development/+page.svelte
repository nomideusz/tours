<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	
	// Icons
	import Code from 'lucide-svelte/icons/code';
	import Bug from 'lucide-svelte/icons/bug';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import Wrench from 'lucide-svelte/icons/wrench';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Target from 'lucide-svelte/icons/target';
	import Users from 'lucide-svelte/icons/users';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Plus from 'lucide-svelte/icons/plus';
	import Filter from 'lucide-svelte/icons/filter';
	import Search from 'lucide-svelte/icons/search';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import GitBranch from 'lucide-svelte/icons/git-branch';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import X from 'lucide-svelte/icons/x';
	import Eye from 'lucide-svelte/icons/eye';
	import Edit from 'lucide-svelte/icons/edit';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	const queryClient = useQueryClient();

	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});

	// Filter states
	let selectedType = $state<'all' | 'bug' | 'feature' | 'improvement' | 'technical_debt'>('all');
	let selectedStatus = $state<'all' | 'backlog' | 'planned' | 'in_progress' | 'testing' | 'completed' | 'cancelled'>('all');
	let selectedPriority = $state<'all' | 'critical' | 'high' | 'medium' | 'low' | 'backlog'>('all');
	let selectedCategory = $state<'all' | 'tours' | 'bookings' | 'payments' | 'qr_codes' | 'notifications' | 'analytics' | 'ui_ux' | 'performance' | 'security' | 'integrations' | 'mobile' | 'api' | 'admin' | 'other'>('all');
	let searchQuery = $state('');
	let showFilters = $state(false);

	// Modal states
	let showCreateModal = $state(false);
	let showItemModal = $state(false);
	let selectedItem = $state<any>(null);
	let isCreating = $state(false);
	let createError = $state<string | null>(null);

	// Create form states
	let createForm = $state({
		title: '',
		description: '',
		type: 'feature',
		priority: 'medium',
		category: 'other',
		effort: 'm',
		assignedTo: '',
		userImpact: 3,
		businessValue: 3,
		technicalNotes: '',
		acceptanceCriteria: [''],
		tags: [],
		targetRelease: '',
		estimatedHours: '',
		targetDate: ''
	});

	// Query for development items
	const developmentQuery = createQuery({
		queryKey: ['admin', 'development', selectedType, selectedStatus, selectedPriority, selectedCategory],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (selectedType !== 'all') params.append('type', selectedType);
			if (selectedStatus !== 'all') params.append('status', selectedStatus);
			if (selectedPriority !== 'all') params.append('priority', selectedPriority);
			if (selectedCategory !== 'all') params.append('category', selectedCategory);
			
			const response = await fetch(`/api/admin/development?${params}`);
			if (!response.ok) throw new Error('Failed to fetch development items');
			return response.json();
		},
		enabled: browser && $isAdmin,
		staleTime: 30 * 1000,
		refetchInterval: 60 * 1000
	});

	// Derived states
	let data = $derived($developmentQuery.data || { items: [], stats: {}, categoryStats: [], recentActivity: [] });
	let items = $derived(data.items || []);
	let stats = $derived(data.stats || {});
	let categoryStats = $derived(data.categoryStats || []);
	let recentActivity = $derived(data.recentActivity || []);
	let isLoading = $derived($developmentQuery.isLoading);
	let isError = $derived($developmentQuery.isError);

	// Filter items by search
	let filteredItems = $derived.by(() => {
		if (!searchQuery.trim()) return items;
		
		const query = searchQuery.toLowerCase();
		return items.filter((item: any) => 
			item.title?.toLowerCase().includes(query) ||
			item.description?.toLowerCase().includes(query) ||
			item.assigned_user_name?.toLowerCase().includes(query) ||
			item.tags?.some((tag: string) => tag.toLowerCase().includes(query))
		);
	});

	// Create new development item
	async function createDevelopmentItem(event: Event) {
		event.preventDefault();
		isCreating = true;
		createError = null;

		try {
			const response = await fetch('/api/admin/development', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...createForm,
					acceptanceCriteria: createForm.acceptanceCriteria.filter(c => c.trim()),
					estimatedHours: createForm.estimatedHours ? parseFloat(createForm.estimatedHours) : null
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create development item');
			}

			// Reset form and close modal
			resetCreateForm();
			showCreateModal = false;

			// Refresh data
			await queryClient.invalidateQueries({ queryKey: ['admin', 'development'] });

		} catch (error) {
			createError = error instanceof Error ? error.message : 'Failed to create development item';
		} finally {
			isCreating = false;
		}
	}

	function resetCreateForm() {
		createForm = {
			title: '',
			description: '',
			type: 'feature',
			priority: 'medium',
			category: 'other',
			effort: 'm',
			assignedTo: '',
			userImpact: 3,
			businessValue: 3,
			technicalNotes: '',
			acceptanceCriteria: [''],
			tags: [],
			targetRelease: '',
			estimatedHours: '',
			targetDate: ''
		};
	}

	// Add acceptance criteria field
	function addAcceptanceCriteria() {
		createForm.acceptanceCriteria = [...createForm.acceptanceCriteria, ''];
	}

	// Remove acceptance criteria field
	function removeAcceptanceCriteria(index: number) {
		createForm.acceptanceCriteria = createForm.acceptanceCriteria.filter((_, i) => i !== index);
	}

	// Get type icon
	function getTypeIcon(type: string) {
		switch (type) {
			case 'bug': return Bug;
			case 'feature': return Lightbulb;
			case 'improvement': return TrendingUp;
			case 'technical_debt': return Wrench;
			default: return Code;
		}
	}

	// Get priority color
	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'critical': return 'var(--color-danger-600)';
			case 'high': return 'var(--color-warning-600)';
			case 'medium': return 'var(--color-info-600)';
			case 'low': return 'var(--text-tertiary)';
			case 'backlog': return 'var(--text-quaternary)';
			default: return 'var(--text-secondary)';
		}
	}

	// Get status badge
	function getStatusBadge(status: string) {
		switch (status) {
			case 'backlog': return 'badge-backlog';
			case 'planned': return 'badge-planned';
			case 'in_progress': return 'badge-in-progress';
			case 'testing': return 'badge-testing';
			case 'completed': return 'badge-completed';
			case 'cancelled': return 'badge-cancelled';
			default: return 'badge-default';
		}
	}

	// Get effort display
	function getEffortDisplay(effort: string) {
		const effortMap = {
			'xs': 'XS (1-2h)',
			's': 'S (3-8h)',
			'm': 'M (1-2d)',
			'l': 'L (3-5d)',
			'xl': 'XL (1-2w)',
			'xxl': 'XXL (3w+)'
		};
		return effortMap[effort as keyof typeof effortMap] || effort;
	}

	// Format category name
	function formatCategoryName(category: string) {
		return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	}
</script>

<svelte:head>
	<title>Development Tracking - Admin | Zaur</title>
</svelte:head>

{#if browser && $isAdmin}
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<div class="flex items-center justify-between mb-8">
			<PageHeader 
				title="Development Tracking"
			/>
			<button
				onclick={() => showCreateModal = true}
				class="button-primary button--gap"
			>
				<Plus class="h-4 w-4" />
				New Item
			</button>
		</div>

		<!-- Stats Overview -->
		<div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Total Items</p>
						<p class="text-2xl font-bold" style="color: var(--text-primary);">{stats.total || 0}</p>
					</div>
					<Code class="h-8 w-8" style="color: var(--text-tertiary);" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Critical</p>
						<p class="text-2xl font-bold text-red-600">{stats.critical || 0}</p>
					</div>
					<AlertTriangle class="h-8 w-8 text-red-600" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">In Progress</p>
						<p class="text-2xl font-bold text-blue-600">{stats.in_progress || 0}</p>
					</div>
					<Clock class="h-8 w-8 text-blue-600" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Completed</p>
						<p class="text-2xl font-bold text-green-600">{stats.completed || 0}</p>
					</div>
					<CheckCircle class="h-8 w-8 text-green-600" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Bugs</p>
						<p class="text-2xl font-bold text-red-500">{stats.bugs || 0}</p>
					</div>
					<Bug class="h-8 w-8 text-red-500" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Avg Progress</p>
						<p class="text-2xl font-bold" style="color: var(--text-primary);">{Math.round(stats.avg_progress || 0)}%</p>
					</div>
					<Target class="h-8 w-8" style="color: var(--text-tertiary);" />
				</div>
			</div>
		</div>

		<!-- Filters -->
		<div class="rounded-xl p-4 mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex flex-col sm:flex-row gap-3">
				<!-- Search -->
				<div class="flex-1 relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search development items..."
						class="form-input pl-10 w-full"
					/>
				</div>
				
				<!-- Type Filter -->
				<select bind:value={selectedType} class="form-select">
					<option value="all">All Types</option>
					<option value="bug">Bugs</option>
					<option value="feature">Features</option>
					<option value="improvement">Improvements</option>
					<option value="technical_debt">Technical Debt</option>
				</select>
				
				<!-- Status Filter -->
				<select bind:value={selectedStatus} class="form-select">
					<option value="all">All Statuses</option>
					<option value="backlog">Backlog</option>
					<option value="planned">Planned</option>
					<option value="in_progress">In Progress</option>
					<option value="testing">Testing</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
				
				<!-- Priority Filter -->
				<select bind:value={selectedPriority} class="form-select">
					<option value="all">All Priorities</option>
					<option value="critical">Critical</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
					<option value="backlog">Backlog</option>
				</select>
				
				<!-- Category Filter -->
				<select bind:value={selectedCategory} class="form-select">
					<option value="all">All Categories</option>
					<option value="tours">Tours</option>
					<option value="bookings">Bookings</option>
					<option value="payments">Payments</option>
					<option value="qr_codes">QR Codes</option>
					<option value="notifications">Notifications</option>
					<option value="analytics">Analytics</option>
					<option value="ui_ux">UI/UX</option>
					<option value="performance">Performance</option>
					<option value="security">Security</option>
					<option value="integrations">Integrations</option>
					<option value="mobile">Mobile</option>
					<option value="api">API</option>
					<option value="admin">Admin</option>
					<option value="other">Other</option>
				</select>
			</div>
		</div>

		<!-- Development Items List -->
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
			</div>
		{:else if isError}
			<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<AlertTriangle class="h-12 w-12 mx-auto mb-4" style="color: var(--color-danger-600);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Failed to load development items</h3>
				<p class="text-sm" style="color: var(--text-secondary);">Please refresh the page to try again.</p>
			</div>
		{:else if filteredItems.length === 0}
			<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<Code class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No development items found</h3>
				<p class="text-sm mb-4" style="color: var(--text-secondary);">
					{items.length === 0 ? 'No development items have been created yet.' : 'No items match your current filters.'}
				</p>
				<button
					onclick={() => showCreateModal = true}
					class="button-primary button--gap"
				>
					<Plus class="h-4 w-4" />
					Create First Item
				</button>
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredItems as item}
					<button 
						class="rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer w-full text-left" 
						style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
						onclick={() => {
							selectedItem = item;
							showItemModal = true;
						}}
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<svelte:component this={getTypeIcon(item.type)} class="h-5 w-5" style="color: {getPriorityColor(item.priority)};" />
									<h3 class="text-base font-semibold" style="color: var(--text-primary);">
										{item.title}
									</h3>
									<div class="flex items-center gap-2">
										<div class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium {getStatusBadge(item.status)}">
											{item.status.replace('_', ' ').toUpperCase()}
										</div>
										<span class="px-2 py-1 rounded text-xs font-medium" style="background: var(--bg-tertiary); color: {getPriorityColor(item.priority)};">
											{item.priority.toUpperCase()}
										</span>
										{#if item.effort}
											<span class="px-2 py-1 rounded text-xs" style="background: var(--bg-secondary); color: var(--text-secondary);">
												{getEffortDisplay(item.effort)}
											</span>
										{/if}
									</div>
								</div>
								
								<p class="text-sm mb-2 line-clamp-2" style="color: var(--text-secondary);">
									{item.description}
								</p>
								
								<div class="flex flex-wrap items-center gap-4 text-xs" style="color: var(--text-tertiary);">
									<div class="flex items-center gap-1">
										<span class="font-medium">{formatCategoryName(item.category)}</span>
									</div>
									{#if item.assigned_user_name}
										<div class="flex items-center gap-1">
											<Users class="h-3 w-3" />
											{item.assigned_user_name}
										</div>
									{/if}
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(item.created_at)}
									</div>
									{#if item.target_release}
										<div class="flex items-center gap-1">
											<GitBranch class="h-3 w-3" />
											{item.target_release}
										</div>
									{/if}
									{#if item.progress > 0}
										<div class="flex items-center gap-1">
											<BarChart3 class="h-3 w-3" />
											{item.progress}%
										</div>
									{/if}
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Recent Activity Sidebar -->
		{#if recentActivity.length > 0}
			<div class="mt-8">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Recent Activity</h3>
				<div class="space-y-3">
					{#each recentActivity.slice(0, 5) as activity}
						<div class="rounded-lg p-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex items-start gap-3">
								<MessageSquare class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
								<div class="flex-1">
									<p class="text-sm font-medium" style="color: var(--text-primary);">{activity.item_title}</p>
									<p class="text-xs" style="color: var(--text-secondary);">{activity.comment}</p>
									<p class="text-xs mt-1" style="color: var(--text-tertiary);">
										{activity.user_name} • {formatDate(activity.created_at)}
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Create Item Modal -->
	{#if showCreateModal}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Create Development Item</h2>
						<button
							onclick={() => {
								showCreateModal = false;
								resetCreateForm();
								createError = null;
							}}
							class="button-secondary button--icon"
						>
							<X class="h-5 w-5" />
						</button>
					</div>

					<form onsubmit={createDevelopmentItem} class="space-y-4">
						<!-- Title -->
						<div>
							<label class="form-label">Title *</label>
							<input
								type="text"
								bind:value={createForm.title}
								placeholder="Brief description of the item"
								class="form-input w-full"
								required
							/>
						</div>

						<!-- Description -->
						<div>
							<label class="form-label">Description *</label>
							<textarea
								bind:value={createForm.description}
								placeholder="Detailed description of what needs to be done"
								class="form-textarea w-full"
								rows="4"
								required
							></textarea>
						</div>

						<!-- Type, Priority, Category -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label class="form-label">Type</label>
								<select bind:value={createForm.type} class="form-select w-full">
									<option value="bug">Bug</option>
									<option value="feature">Feature</option>
									<option value="improvement">Improvement</option>
									<option value="technical_debt">Technical Debt</option>
								</select>
							</div>
							<div>
								<label class="form-label">Priority</label>
								<select bind:value={createForm.priority} class="form-select w-full">
									<option value="critical">Critical</option>
									<option value="high">High</option>
									<option value="medium">Medium</option>
									<option value="low">Low</option>
									<option value="backlog">Backlog</option>
								</select>
							</div>
							<div>
								<label class="form-label">Category</label>
								<select bind:value={createForm.category} class="form-select w-full">
									<option value="tours">Tours</option>
									<option value="bookings">Bookings</option>
									<option value="payments">Payments</option>
									<option value="qr_codes">QR Codes</option>
									<option value="notifications">Notifications</option>
									<option value="analytics">Analytics</option>
									<option value="ui_ux">UI/UX</option>
									<option value="performance">Performance</option>
									<option value="security">Security</option>
									<option value="integrations">Integrations</option>
									<option value="mobile">Mobile</option>
									<option value="api">API</option>
									<option value="admin">Admin</option>
									<option value="other">Other</option>
								</select>
							</div>
						</div>

						<!-- Effort, User Impact, Business Value -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label class="form-label">Effort</label>
								<select bind:value={createForm.effort} class="form-select w-full">
									<option value="xs">XS (1-2h)</option>
									<option value="s">S (3-8h)</option>
									<option value="m">M (1-2d)</option>
									<option value="l">L (3-5d)</option>
									<option value="xl">XL (1-2w)</option>
									<option value="xxl">XXL (3w+)</option>
								</select>
							</div>
							<div>
								<label class="form-label">User Impact (1-5)</label>
								<input
									type="number"
									bind:value={createForm.userImpact}
									min="1"
									max="5"
									class="form-input w-full"
								/>
							</div>
							<div>
								<label class="form-label">Business Value (1-5)</label>
								<input
									type="number"
									bind:value={createForm.businessValue}
									min="1"
									max="5"
									class="form-input w-full"
								/>
							</div>
						</div>

						<!-- Acceptance Criteria -->
						<div>
							<label class="form-label">Acceptance Criteria</label>
							{#each createForm.acceptanceCriteria as criteria, index}
								<div class="flex gap-2 mb-2">
									<input
										type="text"
										bind:value={createForm.acceptanceCriteria[index]}
										placeholder="Define what 'done' looks like"
										class="form-input flex-1"
									/>
									{#if createForm.acceptanceCriteria.length > 1}
										<button
											type="button"
											onclick={() => removeAcceptanceCriteria(index)}
											class="button-danger button--icon"
										>
											<X class="h-4 w-4" />
										</button>
									{/if}
								</div>
							{/each}
							<button
								type="button"
								onclick={addAcceptanceCriteria}
								class="button-secondary button--gap text-sm"
							>
								<Plus class="h-3 w-3" />
								Add Criteria
							</button>
						</div>

						<!-- Technical Notes -->
						<div>
							<label class="form-label">Technical Notes</label>
							<textarea
								bind:value={createForm.technicalNotes}
								placeholder="Implementation notes, technical considerations"
								class="form-textarea w-full"
								rows="3"
							></textarea>
						</div>

						<!-- Target Release & Date -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="form-label">Target Release</label>
								<input
									type="text"
									bind:value={createForm.targetRelease}
									placeholder="v1.2.0"
									class="form-input w-full"
								/>
							</div>
							<div>
								<label class="form-label">Target Date</label>
								<input
									type="date"
									bind:value={createForm.targetDate}
									class="form-input w-full"
								/>
							</div>
						</div>

						{#if createError}
							<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
								<p class="text-sm" style="color: var(--color-danger-700);">{createError}</p>
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-3 pt-4 border-t" style="border-color: var(--border-primary);">
							<button
								type="submit"
								disabled={isCreating || !createForm.title || !createForm.description}
								class="button-primary button--gap flex-1"
							>
								{#if isCreating}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Plus class="h-4 w-4" />
								{/if}
								Create Item
							</button>
							<button
								type="button"
								onclick={() => {
									showCreateModal = false;
									resetCreateForm();
								}}
								class="button-secondary flex-1"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Item Details Modal -->
	{#if showItemModal && selectedItem}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6">
					<div class="flex items-start justify-between mb-6">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<svelte:component this={getTypeIcon(selectedItem.type)} class="h-6 w-6" style="color: {getPriorityColor(selectedItem.priority)};" />
								<h2 class="text-xl font-semibold" style="color: var(--text-primary);">{selectedItem.title}</h2>
							</div>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium {getStatusBadge(selectedItem.status)}">
									{selectedItem.status.replace('_', ' ').toUpperCase()}
								</div>
								<span class="px-2 py-1 rounded text-sm font-medium" style="background: var(--bg-tertiary); color: {getPriorityColor(selectedItem.priority)};">
									{selectedItem.priority.toUpperCase()}
								</span>
								<span class="px-2 py-1 rounded text-sm" style="background: var(--bg-secondary); color: var(--text-secondary);">
									{formatCategoryName(selectedItem.category)}
								</span>
							</div>
						</div>
						<button
							onclick={() => {
								showItemModal = false;
								selectedItem = null;
							}}
							class="button-secondary button--icon"
						>
							<X class="h-5 w-5" />
						</button>
					</div>

					<!-- Item Details -->
					<div class="space-y-6">
						<!-- Description -->
						<div>
							<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Description</h3>
							<p class="text-sm p-3 rounded-lg" style="color: var(--text-primary); background: var(--bg-secondary);">
								{selectedItem.description}
							</p>
						</div>

						<!-- Metadata Grid -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							{#if selectedItem.effort}
								<div>
									<h3 class="text-sm font-medium mb-1" style="color: var(--text-secondary);">Effort</h3>
									<p class="text-sm" style="color: var(--text-primary);">{getEffortDisplay(selectedItem.effort)}</p>
								</div>
							{/if}
							<div>
								<h3 class="text-sm font-medium mb-1" style="color: var(--text-secondary);">User Impact</h3>
								<p class="text-sm" style="color: var(--text-primary);">{selectedItem.user_impact}/5</p>
							</div>
							<div>
								<h3 class="text-sm font-medium mb-1" style="color: var(--text-secondary);">Business Value</h3>
								<p class="text-sm" style="color: var(--text-primary);">{selectedItem.business_value}/5</p>
							</div>
							<div>
								<h3 class="text-sm font-medium mb-1" style="color: var(--text-secondary);">Progress</h3>
								<p class="text-sm" style="color: var(--text-primary);">{selectedItem.progress}%</p>
							</div>
						</div>

						<!-- Assignment & Dates -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#if selectedItem.assigned_user_name}
								<div>
									<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Assigned To</h3>
									<div class="flex items-center gap-2">
										<Users class="h-4 w-4" style="color: var(--text-tertiary);" />
										<span class="text-sm" style="color: var(--text-primary);">{selectedItem.assigned_user_name}</span>
									</div>
								</div>
							{/if}
							<div>
								<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Created</h3>
								<div class="flex items-center gap-2">
									<Calendar class="h-4 w-4" style="color: var(--text-tertiary);" />
									<span class="text-sm" style="color: var(--text-primary);">{formatDate(selectedItem.created_at)}</span>
								</div>
							</div>
						</div>

						{#if selectedItem.technical_notes}
							<div>
								<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Technical Notes</h3>
								<p class="text-sm p-3 rounded-lg" style="color: var(--text-primary); background: var(--bg-secondary);">
									{selectedItem.technical_notes}
								</p>
							</div>
						{/if}

						{#if selectedItem.acceptance_criteria && selectedItem.acceptance_criteria.length > 0}
							<div>
								<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Acceptance Criteria</h3>
								<ul class="space-y-1">
									{#each selectedItem.acceptance_criteria as criteria}
										<li class="text-sm flex items-start gap-2" style="color: var(--text-primary);">
											<CheckCircle class="h-4 w-4 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
											{criteria}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if selectedItem.original_feedback_description}
							<div>
								<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Original Feedback</h3>
								<div class="p-3 rounded-lg" style="background: var(--bg-secondary); border-left: 4px solid var(--color-info-600);">
									<p class="text-sm" style="color: var(--text-primary);">{selectedItem.original_feedback_description}</p>
									{#if selectedItem.feedback_user_name}
										<p class="text-xs mt-2" style="color: var(--text-tertiary);">
											From: {selectedItem.feedback_user_name}
										</p>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.badge-backlog {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}
	
	.badge-planned {
		background: var(--color-info-100);
		color: var(--color-info-700);
		border: 1px solid var(--color-info-200);
	}
	
	.badge-in-progress {
		background: #dbeafe;
		color: #1e40af;
		border: 1px solid #93c5fd;
	}
	
	.badge-testing {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}
	
	.badge-completed {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}
	
	.badge-cancelled {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}
	
	.badge-default {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
