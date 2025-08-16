<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	
	// Icons
	import Users from 'lucide-svelte/icons/users';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import UserX from 'lucide-svelte/icons/user-x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import Globe from 'lucide-svelte/icons/globe';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Building from 'lucide-svelte/icons/building';
	import Calendar from 'lucide-svelte/icons/calendar';

	const queryClient = useQueryClient();

	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});

	// Query for beta applications
	const applicationsQuery = createQuery({
		queryKey: ['admin', 'beta-applications'],
		queryFn: async () => {
			const response = await fetch('/api/admin/beta-applications');
			if (!response.ok) throw new Error('Failed to fetch beta applications');
			return response.json();
		},
		enabled: browser,
		staleTime: 30 * 1000
	});

	// Derived states
	let applications = $derived($applicationsQuery.data || []);
	let isLoading = $derived($applicationsQuery.isLoading);
	let isError = $derived($applicationsQuery.isError);

	// Filter and search states
	let searchQuery = $state('');
	let selectedStatus = $state<'all' | 'pending' | 'accepted' | 'rejected' | 'waitlisted'>('all');
	let showFilters = $state(false);

	// Modal states
	let selectedApplication = $state<any>(null);
	let showApplicationModal = $state(false);
	let isUpdating = $state(false);
	let updateError = $state<string | null>(null);
	
	// Beta account creation states
	let isCreatingAccount = $state(false);
	let createAccountError = $state<string | null>(null);
	let createAccountSuccess = $state<string | null>(null);

	// Filter applications
	let filteredApplications = $derived.by(() => {
		let result = [...applications];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(app => 
				app.name.toLowerCase().includes(query) ||
				app.email.toLowerCase().includes(query) ||
				app.location.toLowerCase().includes(query) ||
				(app.businessName && app.businessName.toLowerCase().includes(query))
			);
		}

		// Filter by status
		if (selectedStatus !== 'all') {
			result = result.filter(app => app.status === selectedStatus);
		}

		return result;
	});

	// Status counts
	let statusCounts = $derived.by(() => {
		const counts = {
			total: applications.length,
			pending: 0,
			accepted: 0,
			rejected: 0,
			waitlisted: 0
		};

		applications.forEach((app: any) => {
			if (counts.hasOwnProperty(app.status)) {
				counts[app.status as keyof typeof counts]++;
			}
		});

		return counts;
	});

	// Update application status
	async function updateApplicationStatus(applicationId: string, status: string, reviewerNotes?: string) {
		isUpdating = true;
		updateError = null;

		try {
			const response = await fetch('/api/admin/beta-applications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ applicationId, status, reviewerNotes })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update application');
			}

			// Refresh applications list
			await queryClient.invalidateQueries({ queryKey: ['admin', 'beta-applications'] });

			// Close modal
			showApplicationModal = false;
			selectedApplication = null;

		} catch (error) {
			updateError = error instanceof Error ? error.message : 'Failed to update application';
		} finally {
			isUpdating = false;
		}
	}

	// Create beta account from application
	async function createBetaAccount(application: any) {
		isCreatingAccount = true;
		createAccountError = null;
		createAccountSuccess = null;

		try {
			// Generate a professional temporary password
			const randomDigits = Math.floor(1000 + Math.random() * 9000);
			const tempPassword = `BetaZaur2025!${randomDigits}`;

			const response = await fetch('/api/admin/beta-applications/create-account', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					applicationId: application.id,
					email: application.email,
					name: application.name,
					password: tempPassword,
					businessName: application.businessName,
					phone: application.phone,
					location: application.location,
					country: application.country
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create beta account');
			}

			createAccountSuccess = `Beta account created successfully! Temporary password: ${tempPassword}`;

			// Refresh applications list to show updated status
			await queryClient.invalidateQueries({ queryKey: ['admin', 'beta-applications'] });

		} catch (error) {
			createAccountError = error instanceof Error ? error.message : 'Failed to create beta account';
		} finally {
			isCreatingAccount = false;
		}
	}

	// Get status badge classes
	function getStatusBadge(status: string) {
		switch (status) {
			case 'pending':
				return 'badge-pending';
			case 'accepted':
				return 'badge-accepted';
			case 'rejected':
				return 'badge-rejected';
			case 'waitlisted':
				return 'badge-waitlisted';
			default:
				return 'badge-default';
		}
	}

	// Get status icon
	function getStatusIcon(status: string) {
		switch (status) {
			case 'pending':
				return Clock;
			case 'accepted':
				return CheckCircle;
			case 'rejected':
				return XCircle;
			case 'waitlisted':
				return UserX;
			default:
				return AlertCircle;
		}
	}
</script>

<svelte:head>
	<title>Beta Applications - Admin | Zaur</title>
</svelte:head>

{#if browser && $isAdmin}
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<PageHeader 
			title="Beta Applications"
		/>

		<!-- Stats Cards -->
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<p class="text-sm font-medium" style="color: var(--text-secondary);">Total</p>
				<p class="text-2xl font-bold" style="color: var(--text-primary);">{statusCounts.total}</p>
			</div>
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<p class="text-sm font-medium" style="color: var(--text-secondary);">Pending</p>
				<p class="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
			</div>
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<p class="text-sm font-medium" style="color: var(--text-secondary);">Accepted</p>
				<p class="text-2xl font-bold text-green-600">{statusCounts.accepted}</p>
			</div>
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<p class="text-sm font-medium" style="color: var(--text-secondary);">Waitlisted</p>
				<p class="text-2xl font-bold text-blue-600">{statusCounts.waitlisted}</p>
			</div>
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<p class="text-sm font-medium" style="color: var(--text-secondary);">Rejected</p>
				<p class="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
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
						placeholder="Search by name, email, location, or business..."
						class="form-input pl-10 w-full"
					/>
				</div>
				
				<!-- Status Filter -->
				<select bind:value={selectedStatus} class="form-select">
					<option value="all">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="accepted">Accepted</option>
					<option value="waitlisted">Waitlisted</option>
					<option value="rejected">Rejected</option>
				</select>
			</div>
		</div>

		<!-- Applications List -->
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
			</div>
		{:else if isError}
			<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<AlertCircle class="h-12 w-12 mx-auto mb-4" style="color: var(--color-danger-600);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Failed to load applications</h3>
				<p class="text-sm" style="color: var(--text-secondary);">Please refresh the page to try again.</p>
			</div>
		{:else if filteredApplications.length === 0}
			<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<Users class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No applications found</h3>
				<p class="text-sm" style="color: var(--text-secondary);">
					{applications.length === 0 ? 'No beta applications have been submitted yet.' : 'No applications match your current filters.'}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredApplications as application}
					<button class="rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer w-full text-left" 
						 style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
						 onclick={() => {
							selectedApplication = application;
							showApplicationModal = true;
						 }}>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-lg font-semibold" style="color: var(--text-primary);">
										{application.name}
									</h3>
									<div class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium {getStatusBadge(application.status)}">
										<svelte:component this={getStatusIcon(application.status)} class="h-3 w-3" />
										{application.status.charAt(0).toUpperCase() + application.status.slice(1)}
									</div>
								</div>
								
								<div class="flex flex-wrap items-center gap-4 text-sm" style="color: var(--text-secondary);">
									<div class="flex items-center gap-1">
										<Mail class="h-4 w-4" />
										{application.email}
									</div>
									<div class="flex items-center gap-1">
										<MapPin class="h-4 w-4" />
										{application.location}
									</div>
									{#if application.businessName}
										<div class="flex items-center gap-1">
											<Building class="h-4 w-4" />
											{application.businessName}
										</div>
									{/if}
									<div class="flex items-center gap-1">
										<Calendar class="h-4 w-4" />
										{formatDate(application.createdAt)}
									</div>
								</div>
								
								<p class="mt-2 text-sm line-clamp-2" style="color: var(--text-secondary);">
									{application.tourTypes}
								</p>
							</div>
							
							<ExternalLink class="h-5 w-5 opacity-50" style="color: var(--text-tertiary);" />
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Application Detail Modal -->
	{#if showApplicationModal && selectedApplication}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6">
					<div class="flex items-start justify-between mb-6">
						<div>
							<h2 class="text-xl font-semibold" style="color: var(--text-primary);">
								Beta Application - {selectedApplication.name}
							</h2>
							<div class="flex items-center gap-2 mt-1">
								<div class="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium {getStatusBadge(selectedApplication.status)}">
									<svelte:component this={getStatusIcon(selectedApplication.status)} class="h-4 w-4" />
									{selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
								</div>
								<span class="text-sm" style="color: var(--text-secondary);">
									Applied {formatDate(selectedApplication.createdAt)}
								</span>
							</div>
						</div>
						<button
							onclick={() => {
								showApplicationModal = false;
								selectedApplication = null;
								updateError = null;
							}}
							class="p-2 hover:bg-gray-100 rounded-lg"
						>
							<XCircle class="h-5 w-5" />
						</button>
					</div>

					<!-- Application Details -->
					<div class="space-y-6">
						<!-- Contact Information -->
						<div>
							<h3 class="text-lg font-medium mb-3" style="color: var(--text-primary);">Contact Information</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<div class="block text-sm font-medium" style="color: var(--text-secondary);">Email</div>
									<div class="flex items-center gap-2 mt-1">
										<Mail class="h-4 w-4" style="color: var(--text-tertiary);" />
										<span style="color: var(--text-primary);">{selectedApplication.email}</span>
									</div>
								</div>
								{#if selectedApplication.phone}
									<div>
										<div class="block text-sm font-medium" style="color: var(--text-secondary);">Phone</div>
										<div class="flex items-center gap-2 mt-1">
											<Phone class="h-4 w-4" style="color: var(--text-tertiary);" />
											<span style="color: var(--text-primary);">{selectedApplication.phone}</span>
										</div>
									</div>
								{/if}
								<div>
									<div class="block text-sm font-medium" style="color: var(--text-secondary);">Location</div>
									<div class="flex items-center gap-2 mt-1">
										<MapPin class="h-4 w-4" style="color: var(--text-tertiary);" />
										<span style="color: var(--text-primary);">{selectedApplication.location}, {selectedApplication.country}</span>
									</div>
								</div>
								{#if selectedApplication.website}
									<div>
										<div class="block text-sm font-medium" style="color: var(--text-secondary);">Website</div>
										<div class="flex items-center gap-2 mt-1">
											<Globe class="h-4 w-4" style="color: var(--text-tertiary);" />
											<a href={selectedApplication.website} target="_blank" rel="noopener noreferrer" 
											   class="text-blue-600 hover:underline">{selectedApplication.website}</a>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Business Information -->
						<div>
							<h3 class="text-lg font-medium mb-3" style="color: var(--text-primary);">Business Information</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#if selectedApplication.businessName}
									<div>
										<div class="block text-sm font-medium" style="color: var(--text-secondary);">Business Name</div>
										<span style="color: var(--text-primary);">{selectedApplication.businessName}</span>
									</div>
								{/if}
								<div>
									<div class="block text-sm font-medium" style="color: var(--text-secondary);">Years of Experience</div>
									<span style="color: var(--text-primary);">{selectedApplication.yearsExperience} years</span>
								</div>
								<div>
									<div class="block text-sm font-medium" style="color: var(--text-secondary);">Team Size</div>
									<span style="color: var(--text-primary);">{selectedApplication.teamSize} people</span>
								</div>
							</div>
						</div>

						<!-- Screening Questions -->
						<div>
							<h3 class="text-lg font-medium mb-3" style="color: var(--text-primary);">Screening Questions</h3>
							<div class="space-y-4">
								<div>
									<div class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Tour Types</div>
									<p class="text-sm" style="color: var(--text-primary);">{selectedApplication.tourTypes}</p>
								</div>
								<div>
									<div class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Tour Frequency</div>
									<p class="text-sm" style="color: var(--text-primary);">{selectedApplication.tourFrequency}</p>
								</div>
								<div>
									<div class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Current Booking Method</div>
									<p class="text-sm" style="color: var(--text-primary);">{selectedApplication.currentBookingMethod}</p>
								</div>
								<div>
									<div class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">Biggest Challenge</div>
									<p class="text-sm" style="color: var(--text-primary);">{selectedApplication.biggestChallenge}</p>
								</div>
								<div>
									<div class="block text-sm font-medium mb-1" style="color: var(--text-secondary);">How They Can Contribute to Beta</div>
									<p class="text-sm" style="color: var(--text-primary);">{selectedApplication.betaContribution}</p>
								</div>
							</div>
						</div>

						{#if selectedApplication.reviewerNotes}
							<div>
								<h3 class="text-lg font-medium mb-3" style="color: var(--text-primary);">Reviewer Notes</h3>
								<p class="text-sm p-3 rounded-lg" style="color: var(--text-primary); background: var(--bg-secondary);">
									{selectedApplication.reviewerNotes}
								</p>
							</div>
						{/if}

						{#if updateError}
							<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
								<p class="text-sm" style="color: var(--color-danger-700);">{updateError}</p>
							</div>
						{/if}

						{#if createAccountError}
							<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
								<p class="text-sm" style="color: var(--color-danger-700);">{createAccountError}</p>
							</div>
						{/if}

						{#if createAccountSuccess}
							<div class="rounded-lg p-3" style="background: var(--color-success-100); border: 1px solid var(--color-success-200);">
								<p class="text-sm font-medium" style="color: var(--color-success-700);">{createAccountSuccess}</p>
								<p class="text-xs mt-1" style="color: var(--color-success-600);">
									Copy this password and send it to the beta tester via email.
								</p>
							</div>
						{/if}

						<!-- Action Buttons -->
						{#if selectedApplication.status === 'pending'}
							<div class="flex flex-wrap gap-3 pt-4 border-t" style="border-color: var(--border-primary);">
								<button
									onclick={() => updateApplicationStatus(selectedApplication.id, 'accepted')}
									disabled={isUpdating}
									class="button-primary button--gap flex-1 sm:flex-none"
								>
									{#if isUpdating}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<CheckCircle class="h-4 w-4" />
									{/if}
									Accept
								</button>
								<button
									onclick={() => updateApplicationStatus(selectedApplication.id, 'waitlisted')}
									disabled={isUpdating}
									class="button-secondary button--gap flex-1 sm:flex-none"
								>
									<UserX class="h-4 w-4" />
									Waitlist
								</button>
								<button
									onclick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
									disabled={isUpdating}
									class="button-danger button--gap flex-1 sm:flex-none"
								>
									<XCircle class="h-4 w-4" />
									Reject
								</button>
							</div>
						{:else if selectedApplication.status === 'accepted'}
							<div class="flex flex-wrap gap-3 pt-4 border-t" style="border-color: var(--border-primary);">
								<button
									onclick={() => createBetaAccount(selectedApplication)}
									disabled={isCreatingAccount}
									class="button-primary button--gap flex-1 sm:flex-none"
								>
									{#if isCreatingAccount}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<Users class="h-4 w-4" />
									{/if}
									Create Beta Account
								</button>
								<p class="text-xs flex-1 text-center self-center" style="color: var(--text-tertiary);">
									This will create a user account with BETA_APPRECIATION promo code applied
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.badge-pending {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}
	
	.badge-accepted {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}
	
	.badge-rejected {
		background: var(--color-danger-100);
		color: var(--color-danger-700);
		border: 1px solid var(--color-danger-200);
	}
	
	.badge-waitlisted {
		background: var(--color-info-100);
		color: var(--color-info-700);
		border: 1px solid var(--color-info-200);
	}
	
	.badge-default {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>