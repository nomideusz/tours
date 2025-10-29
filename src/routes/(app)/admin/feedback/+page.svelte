<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	
	// Icons
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Bug from 'lucide-svelte/icons/bug';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import Heart from 'lucide-svelte/icons/heart';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import User from 'lucide-svelte/icons/user';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Globe from 'lucide-svelte/icons/globe';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Code from 'lucide-svelte/icons/code';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';

	const queryClient = useQueryClient();

	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});

	// Filter states
	let selectedType = $state<'all' | 'bug' | 'feature' | 'general' | 'praise'>('all');
	let selectedStatus = $state<'all' | 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'wont_fix'>('all');
	let searchQuery = $state('');
	let showFilters = $state(false);

	// Modal states
	let selectedFeedback = $state<any>(null);
	let showFeedbackModal = $state(false);
	let isUpdating = $state(false);
	let updateError = $state<string | null>(null);
	let adminNotes = $state('');
	let newStatus = $state('');

	// Convert to development item states
	let showConvertModal = $state(false);
	let isConverting = $state(false);
	let convertError = $state<string | null>(null);
	let convertForm = $state({
		title: '',
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

	// Query for feedback
	// eslint-disable-next-line svelte/valid-compile
	const feedbackQuery = createQuery({
		queryKey: ['admin', 'feedback', selectedType, selectedStatus] as const,
		queryFn: async () => {
			const params = new URLSearchParams();
			if (selectedType !== 'all') params.append('type', selectedType);
			if (selectedStatus !== 'all') params.append('status', selectedStatus);
			
			const response = await fetch(`/api/feedback?${params}`);
			if (!response.ok) throw new Error('Failed to fetch feedback');
			return response.json();
		},
		enabled: browser && $isAdmin,
		staleTime: 30 * 1000,
		refetchInterval: 60 * 1000 // Refresh every minute
	});

	// Derived states
	let feedback: any[] = $derived($feedbackQuery.data || []);
	let isLoading = $derived($feedbackQuery.isLoading);
	let isError = $derived($feedbackQuery.isError);

	// Filter feedback
	let filteredFeedback = $derived.by(() => {
		let result = [...feedback];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(item => 
				item.description?.toLowerCase().includes(query) ||
				item.user_name?.toLowerCase().includes(query) ||
				item.user_email?.toLowerCase().includes(query)
			);
		}

		return result;
	});

	// Stats
	let stats = $derived.by(() => {
		const total = feedback.length;
		const byType = {
			bug: feedback.filter((f: any) => f.type === 'bug').length,
			feature: feedback.filter((f: any) => f.type === 'feature').length,
			general: feedback.filter((f: any) => f.type === 'general').length,
			praise: feedback.filter((f: any) => f.type === 'praise').length
		};
		const byStatus = {
			new: feedback.filter((f: any) => f.status === 'new').length,
			acknowledged: feedback.filter((f: any) => f.status === 'acknowledged').length,
			in_progress: feedback.filter((f: any) => f.status === 'in_progress').length,
			resolved: feedback.filter((f: any) => f.status === 'resolved').length,
			wont_fix: feedback.filter((f: any) => f.status === 'wont_fix').length
		};
		const criticalBugs = feedback.filter((f: any) => f.type === 'bug' && f.urgency >= 4).length;

		return { total, byType, byStatus, criticalBugs };
	});

	// Update feedback status
	async function updateFeedbackStatus(feedbackId: string, status: string, notes?: string) {
		isUpdating = true;
		updateError = null;

		try {
			const response = await fetch('/api/admin/feedback', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ feedbackId, status, adminNotes: notes })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update feedback');
			}

			// Refresh feedback list
			await queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] });

			// Close modal
			showFeedbackModal = false;
			selectedFeedback = null;
			adminNotes = '';
			newStatus = '';

		} catch (error) {
			updateError = error instanceof Error ? error.message : 'Failed to update feedback';
		} finally {
			isUpdating = false;
		}
	}

	// Get type icon
	function getTypeIcon(type: string) {
		switch (type) {
			case 'bug': return Bug;
			case 'feature': return Lightbulb;
			case 'praise': return Heart;
			default: return MessageCircle;
		}
	}

	// Get type color
	function getTypeColor(type: string) {
		switch (type) {
			case 'bug': return 'var(--color-danger-600)';
			case 'feature': return 'var(--color-info-600)';
			case 'praise': return 'var(--color-success-600)';
			default: return 'var(--text-primary)';
		}
	}

	// Get status badge
	function getStatusBadge(status: string) {
		switch (status) {
			case 'new': return 'badge-new';
			case 'acknowledged': return 'badge-acknowledged';
			case 'in_progress': return 'badge-in-progress';
			case 'resolved': return 'badge-resolved';
			case 'wont_fix': return 'badge-wont-fix';
			default: return 'badge-default';
		}
	}

	// Get urgency color
	function getUrgencyColor(urgency: number) {
		if (urgency >= 4) return 'var(--color-danger-600)';
		if (urgency >= 3) return 'var(--color-warning-600)';
		return 'var(--text-tertiary)';
	}

	// Convert feedback to development item
	async function convertToDevelopmentItem(event: Event) {
		event.preventDefault();
		if (!selectedFeedback) return;

		isConverting = true;
		convertError = null;

		try {
			const response = await fetch('/api/admin/feedback/convert', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					feedbackId: selectedFeedback.id,
					title: convertForm.title,
					priority: convertForm.priority,
					category: convertForm.category,
					effort: convertForm.effort,
					assignedTo: convertForm.assignedTo || null,
					userImpact: convertForm.userImpact,
					businessValue: convertForm.businessValue,
					technicalNotes: convertForm.technicalNotes,
					acceptanceCriteria: convertForm.acceptanceCriteria.filter(c => c.trim()),
					tags: convertForm.tags,
					targetRelease: convertForm.targetRelease || null,
					estimatedHours: convertForm.estimatedHours ? parseFloat(convertForm.estimatedHours) : null,
					targetDate: convertForm.targetDate || null
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to convert feedback');
			}

			// Close modals and refresh data
			showConvertModal = false;
			showFeedbackModal = false;
			selectedFeedback = null;
			resetConvertForm();

			await queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] });

		} catch (error) {
			convertError = error instanceof Error ? error.message : 'Failed to convert feedback';
		} finally {
			isConverting = false;
		}
	}

	// Reset convert form
	function resetConvertForm() {
		convertForm = {
			title: '',
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

	// Initialize convert form with feedback data
	function initializeConvertForm(feedback: any) {
		convertForm.title = `${feedback.type === 'bug' ? 'Fix: ' : feedback.type === 'feature' ? 'Feature: ' : ''}${feedback.description.substring(0, 100)}`;
		convertForm.userImpact = Math.max(feedback.urgency || 3, 3);
		convertForm.businessValue = feedback.urgency || 3;
		
		// Set category based on page URL or feedback content
		if (feedback.page_url) {
			if (feedback.page_url.includes('/tours')) convertForm.category = 'tours';
			else if (feedback.page_url.includes('/book')) convertForm.category = 'bookings';
			else if (feedback.page_url.includes('/payment')) convertForm.category = 'payments';
			else if (feedback.page_url.includes('/dashboard')) convertForm.category = 'admin';
		}
	}

	// Add acceptance criteria field
	function addAcceptanceCriteria() {
		convertForm.acceptanceCriteria = [...convertForm.acceptanceCriteria, ''];
	}

	// Remove acceptance criteria field
	function removeAcceptanceCriteria(index: number) {
		convertForm.acceptanceCriteria = convertForm.acceptanceCriteria.filter((_, i) => i !== index);
	}
</script>

<svelte:head>
	<title>Feedback Management - Admin | Zaur</title>
</svelte:head>

{#if browser && $isAdmin}
	<div class="w-full px-6 sm:px-8 lg:px-12 py-8">
		<PageHeader 
			title="Beta Feedback"
		/>

		<!-- Stats Cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Total Feedback</p>
						<p class="text-2xl font-bold" style="color: var(--text-primary);">{stats.total}</p>
					</div>
					<MessageSquare class="h-8 w-8" style="color: var(--text-tertiary);" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">New Items</p>
						<p class="text-2xl font-bold text-yellow-600">{stats.byStatus.new}</p>
					</div>
					<Clock class="h-8 w-8 text-yellow-600" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Critical Bugs</p>
						<p class="text-2xl font-bold text-red-600">{stats.criticalBugs}</p>
					</div>
					<AlertCircle class="h-8 w-8 text-red-600" />
				</div>
			</div>
			
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium" style="color: var(--text-secondary);">Resolved</p>
						<p class="text-2xl font-bold text-green-600">{stats.byStatus.resolved}</p>
					</div>
					<CheckCircle class="h-8 w-8 text-green-600" />
				</div>
			</div>
		</div>

		<!-- Type Breakdown -->
		<div class="grid grid-cols-4 gap-2 mb-6">
			<button
				onclick={() => selectedType = 'bug'}
				class="p-3 rounded-lg transition-all {selectedType === 'bug' ? 'ring-2' : ''}"
				style="background: var(--bg-primary); border: 1px solid {selectedType === 'bug' ? 'var(--color-danger-600)' : 'var(--border-primary)'}; {selectedType === 'bug' ? 'ring-color: var(--color-danger-600);' : ''}"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Bug class="h-4 w-4" style="color: var(--color-danger-600);" />
						<span class="text-sm font-medium">Bugs</span>
					</div>
					<span class="text-lg font-bold">{stats.byType.bug}</span>
				</div>
			</button>
			
			<button
				onclick={() => selectedType = 'feature'}
				class="p-3 rounded-lg transition-all {selectedType === 'feature' ? 'ring-2' : ''}"
				style="background: var(--bg-primary); border: 1px solid {selectedType === 'feature' ? 'var(--color-info-600)' : 'var(--border-primary)'}; {selectedType === 'feature' ? 'ring-color: var(--color-info-600);' : ''}"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Lightbulb class="h-4 w-4" style="color: var(--color-info-600);" />
						<span class="text-sm font-medium">Features</span>
					</div>
					<span class="text-lg font-bold">{stats.byType.feature}</span>
				</div>
			</button>
			
			<button
				onclick={() => selectedType = 'general'}
				class="p-3 rounded-lg transition-all {selectedType === 'general' ? 'ring-2' : ''}"
				style="background: var(--bg-primary); border: 1px solid {selectedType === 'general' ? 'var(--text-primary)' : 'var(--border-primary)'}; {selectedType === 'general' ? 'ring-color: var(--text-primary);' : ''}"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<MessageCircle class="h-4 w-4" style="color: var(--text-primary);" />
						<span class="text-sm font-medium">General</span>
					</div>
					<span class="text-lg font-bold">{stats.byType.general}</span>
				</div>
			</button>
			
			<button
				onclick={() => selectedType = 'praise'}
				class="p-3 rounded-lg transition-all {selectedType === 'praise' ? 'ring-2' : ''}"
				style="background: var(--bg-primary); border: 1px solid {selectedType === 'praise' ? 'var(--color-success-600)' : 'var(--border-primary)'}; {selectedType === 'praise' ? 'ring-color: var(--color-success-600);' : ''}"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Heart class="h-4 w-4" style="color: var(--color-success-600);" />
						<span class="text-sm font-medium">Praise</span>
					</div>
					<span class="text-lg font-bold">{stats.byType.praise}</span>
				</div>
			</button>
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
						placeholder="Search feedback..."
						class="form-input pl-10 w-full"
					/>
				</div>
				
				<!-- Type Filter -->
				<button
					onclick={() => selectedType = 'all'}
					class="button-secondary button-gap"
				>
					{selectedType === 'all' ? 'All Types' : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
					<ChevronDown class="h-4 w-4" />
				</button>
				
				<!-- Status Filter -->
				<select bind:value={selectedStatus} class="form-select">
					<option value="all">All Statuses</option>
					<option value="new">New</option>
					<option value="acknowledged">Acknowledged</option>
					<option value="in_progress">In Progress</option>
					<option value="resolved">Resolved</option>
					<option value="wont_fix">Won't Fix</option>
				</select>
				
				<!-- Refresh -->
				<button
					onclick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'feedback'] })}
					class="button-secondary p-2"
				>
					<RefreshCw class="h-4 w-4" />
				</button>
			</div>
		</div>

		<!-- Feedback List -->
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
			</div>
		{:else if isError}
			<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<AlertCircle class="h-12 w-12 mx-auto mb-4" style="color: var(--color-danger-600);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Failed to load feedback</h3>
				<p class="text-sm" style="color: var(--text-secondary);">Please refresh the page to try again.</p>
			</div>
		{:else if filteredFeedback.length === 0}
			<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<MessageSquare class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No feedback found</h3>
				<p class="text-sm" style="color: var(--text-secondary);">
					{feedback.length === 0 ? 'No feedback has been submitted yet.' : 'No feedback matches your current filters.'}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredFeedback as item}
					<button 
						class="rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer w-full text-left" 
						style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
						onclick={() => {
							selectedFeedback = item;
							adminNotes = item.admin_notes || '';
							newStatus = item.status;
							showFeedbackModal = true;
						}}
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									{#if item.type}
										{@const IconComponent = getTypeIcon(item.type)}
										<IconComponent class="h-5 w-5" style="color: {getTypeColor(item.type)};" />
									{/if}
									<h3 class="text-base font-semibold" style="color: var(--text-primary);">
										{item.type.charAt(0).toUpperCase() + item.type.slice(1)}
										{#if item.type === 'bug' && item.urgency}
											<span class="ml-2 text-sm" style="color: {getUrgencyColor(item.urgency)};">
												Urgency: {item.urgency}/5
											</span>
										{/if}
									</h3>
									<div class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium {getStatusBadge(item.status)}">
										{item.status.replace('_', ' ').toUpperCase()}
									</div>
								</div>
								
								<p class="text-sm mb-2 line-clamp-2" style="color: var(--text-secondary);">
									{item.description}
								</p>
								
								<div class="flex flex-wrap items-center gap-4 text-xs" style="color: var(--text-tertiary);">
									<div class="flex items-center gap-1">
										<User class="h-3 w-3" />
										{item.user_name || 'Unknown'}
									</div>
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(item.created_at)}
									</div>
									{#if item.page_url}
										<div class="flex items-center gap-1">
											<Globe class="h-3 w-3" />
											{item.page_url}
										</div>
									{/if}
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Feedback Detail Modal -->
	{#if showFeedbackModal && selectedFeedback}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6">
					<div class="flex items-start justify-between mb-6">
						<div>
							<h2 class="text-xl font-semibold flex items-center gap-2" style="color: var(--text-primary);">
								{#if selectedFeedback.type}
									{@const IconComponent = getTypeIcon(selectedFeedback.type)}
									<IconComponent class="h-6 w-6" style="color: {getTypeColor(selectedFeedback.type)};" />
								{/if}
								{selectedFeedback.type.charAt(0).toUpperCase() + selectedFeedback.type.slice(1)} Feedback
							</h2>
							<div class="flex items-center gap-2 mt-1">
								<div class="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium {getStatusBadge(selectedFeedback.status)}">
									{selectedFeedback.status.replace('_', ' ').toUpperCase()}
								</div>
								{#if selectedFeedback.type === 'bug' && selectedFeedback.urgency}
									<span class="text-sm" style="color: {getUrgencyColor(selectedFeedback.urgency)};">
										Urgency: {selectedFeedback.urgency}/5
									</span>
								{/if}
							</div>
						</div>
						<button
							onclick={() => {
								showFeedbackModal = false;
								selectedFeedback = null;
								updateError = null;
							}}
							class="p-2 hover:bg-gray-100 rounded-lg"
						>
							<XCircle class="h-5 w-5" />
						</button>
					</div>

					<!-- Feedback Details -->
					<div class="space-y-4">
						<!-- Description -->
						<div>
							<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Description</h3>
							<p class="text-sm p-3 rounded-lg" style="color: var(--text-primary); background: var(--bg-secondary);">
								{selectedFeedback.description}
							</p>
						</div>

						<!-- User Info -->
						<div>
							<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Submitted By</h3>
							<div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
								<User class="h-8 w-8 p-1.5 rounded-full" style="background: var(--bg-tertiary); color: var(--text-secondary);" />
								<div>
									<p class="text-sm font-medium" style="color: var(--text-primary);">{selectedFeedback.user_name}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">{selectedFeedback.user_email}</p>
								</div>
							</div>
						</div>

						<!-- Metadata -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Submitted</h3>
								<p class="text-sm" style="color: var(--text-primary);">
									{formatDate(selectedFeedback.created_at)}
								</p>
							</div>
							{#if selectedFeedback.page_url}
								<div>
									<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Page</h3>
									<p class="text-sm" style="color: var(--text-primary);">
										{selectedFeedback.page_url}
									</p>
								</div>
							{/if}
						</div>

						{#if selectedFeedback.browser_info}
							<div>
								<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Browser Info</h3>
								<p class="text-xs font-mono p-2 rounded" style="color: var(--text-tertiary); background: var(--bg-secondary);">
									{selectedFeedback.browser_info}
								</p>
							</div>
						{/if}

						<!-- Update Status -->
						<div>
							<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Update Status</h3>
							<select bind:value={newStatus} class="form-select w-full">
								<option value="new">New</option>
								<option value="acknowledged">Acknowledged</option>
								<option value="in_progress">In Progress</option>
								<option value="resolved">Resolved</option>
								<option value="wont_fix">Won't Fix</option>
							</select>
						</div>

						<!-- Admin Notes -->
						<div>
							<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Admin Notes</h3>
							<textarea
								bind:value={adminNotes}
								placeholder="Add notes about this feedback..."
								class="form-textarea w-full"
								rows="3"
							></textarea>
						</div>

						{#if updateError}
							<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
								<p class="text-sm" style="color: var(--color-danger-700);">{updateError}</p>
							</div>
						{/if}

						<!-- Action Buttons -->
						<div class="flex flex-col gap-3 pt-4 border-t" style="border-color: var(--border-primary);">
							<div class="flex gap-3">
								<button
									onclick={() => updateFeedbackStatus(selectedFeedback.id, newStatus, adminNotes)}
									disabled={isUpdating}
									class="button-primary button-gap flex-1"
								>
									{#if isUpdating}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<CheckCircle class="h-4 w-4" />
									{/if}
									Update Feedback
								</button>
								<button
									onclick={() => {
										showFeedbackModal = false;
										selectedFeedback = null;
									}}
									class="button-secondary flex-1"
								>
									Cancel
								</button>
							</div>
							
							{#if selectedFeedback.type === 'bug' || selectedFeedback.type === 'feature'}
								<div class="pt-2 border-t" style="border-color: var(--border-secondary);">
									<button
										onclick={() => {
											initializeConvertForm(selectedFeedback);
											showConvertModal = true;
										}}
										class="button-info button-gap w-full"
									>
										<Code class="h-4 w-4" />
										<ArrowRight class="h-4 w-4" />
										Convert to Development Item
									</button>
									<p class="text-xs text-center mt-1" style="color: var(--text-tertiary);">
										Track this as a development task with priority and progress
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Convert to Development Item Modal -->
	{#if showConvertModal && selectedFeedback}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6">
					<div class="flex items-center justify-between mb-6">
						<div>
							<h2 class="text-xl font-semibold flex items-center gap-2" style="color: var(--text-primary);">
								<Code class="h-6 w-6" style="color: var(--color-info-600);" />
								Convert to Development Item
							</h2>
							<p class="text-sm mt-1" style="color: var(--text-secondary);">
								Transform this feedback into a trackable development task
							</p>
						</div>
						<button
							onclick={() => {
								showConvertModal = false;
								resetConvertForm();
								convertError = null;
							}}
							class="button-secondary button-icon"
						>
							<X class="h-5 w-5" />
						</button>
					</div>

					<!-- Original Feedback Context -->
					<div class="mb-6 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Original Feedback</h3>
						<div class="flex items-start gap-3">
							{#if selectedFeedback.type}
								{@const IconComponent = getTypeIcon(selectedFeedback.type)}
								<IconComponent class="h-5 w-5 mt-0.5" style="color: {getTypeColor(selectedFeedback.type)};" />
							{/if}
							<div class="flex-1">
								<p class="text-sm mb-1" style="color: var(--text-primary);">{selectedFeedback.description}</p>
								<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
									<span>By: {selectedFeedback.user_name}</span>
									<span>Urgency: {selectedFeedback.urgency}/5</span>
									{#if selectedFeedback.page_url}
										<span>Page: {selectedFeedback.page_url}</span>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<form onsubmit={convertToDevelopmentItem} class="space-y-4">
						<!-- Title -->
						<div>
							<label class="form-label">Development Item Title *</label>
							<input
								type="text"
								bind:value={convertForm.title}
								placeholder="Clear, actionable title for the development task"
								class="form-input w-full"
								required
							/>
						</div>

						<!-- Priority, Category, Effort -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label for="convert-priority" class="form-label">Priority</label>
								<select id="convert-priority" bind:value={convertForm.priority} class="form-select w-full">
									<option value="critical">Critical</option>
									<option value="high">High</option>
									<option value="medium">Medium</option>
									<option value="low">Low</option>
									<option value="backlog">Backlog</option>
								</select>
							</div>
							<div>
								<label class="form-label">Category</label>
								<select bind:value={convertForm.category} class="form-select w-full">
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
							<div>
								<label class="form-label">Effort Estimate</label>
								<select bind:value={convertForm.effort} class="form-select w-full">
									<option value="xs">XS (1-2h)</option>
									<option value="s">S (3-8h)</option>
									<option value="m">M (1-2d)</option>
									<option value="l">L (3-5d)</option>
									<option value="xl">XL (1-2w)</option>
									<option value="xxl">XXL (3w+)</option>
								</select>
							</div>
						</div>

						<!-- User Impact, Business Value -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="form-label">User Impact (1-5)</label>
								<input
									type="number"
									bind:value={convertForm.userImpact}
									min="1"
									max="5"
									class="form-input w-full"
								/>
								<p class="text-xs mt-1" style="color: var(--text-tertiary);">How many users are affected?</p>
							</div>
							<div>
								<label class="form-label">Business Value (1-5)</label>
								<input
									type="number"
									bind:value={convertForm.businessValue}
									min="1"
									max="5"
									class="form-input w-full"
								/>
								<p class="text-xs mt-1" style="color: var(--text-tertiary);">How important for business goals?</p>
							</div>
						</div>

						<!-- Acceptance Criteria -->
						<div>
							<label class="form-label">Acceptance Criteria</label>
							{#each convertForm.acceptanceCriteria as criteria, index}
								<div class="flex gap-2 mb-2">
									<input
										type="text"
										bind:value={convertForm.acceptanceCriteria[index]}
										placeholder="Define what 'done' looks like"
										class="form-input flex-1"
									/>
									{#if convertForm.acceptanceCriteria.length > 1}
										<button
											type="button"
											onclick={() => removeAcceptanceCriteria(index)}
											class="button-danger button-icon"
										>
											<X class="h-4 w-4" />
										</button>
									{/if}
								</div>
							{/each}
							<button
								type="button"
								onclick={addAcceptanceCriteria}
								class="button-secondary button-gap text-sm"
							>
								<Plus class="h-3 w-3" />
								Add Criteria
							</button>
						</div>

						<!-- Technical Notes -->
						<div>
							<label class="form-label">Technical Notes</label>
							<textarea
								bind:value={convertForm.technicalNotes}
								placeholder="Implementation notes, technical considerations, potential challenges..."
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
									bind:value={convertForm.targetRelease}
									placeholder="v1.2.0"
									class="form-input w-full"
								/>
							</div>
							<div>
								<DatePicker
									bind:value={convertForm.targetDate}
									label="Target Date"
									placeholder="Select target date"
								/>
							</div>
						</div>

						{#if convertError}
							<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
								<p class="text-sm" style="color: var(--color-danger-700);">{convertError}</p>
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-3 pt-4 border-t" style="border-color: var(--border-primary);">
							<button
								type="submit"
								disabled={isConverting || !convertForm.title}
								class="button-primary button-gap flex-1"
							>
								{#if isConverting}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Code class="h-4 w-4" />
									<ArrowRight class="h-4 w-4" />
								{/if}
								Convert to Development Item
							</button>
							<button
								type="button"
								onclick={() => {
									showConvertModal = false;
									resetConvertForm();
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
{/if}

<style>
	.badge-new {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}
	
	.badge-acknowledged {
		background: var(--color-info-100);
		color: var(--color-info-700);
		border: 1px solid var(--color-info-200);
	}
	
	.badge-in-progress {
		background: #dbeafe;
		color: #1e40af;
		border: 1px solid #93c5fd;
	}
	
	.badge-resolved {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}
	
	.badge-wont-fix {
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
