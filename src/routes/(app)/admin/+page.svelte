<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import TableSort from '$lib/components/TableSort.svelte';
	import { formatDate, formatDateTime } from '$lib/utils/date-helpers.js';
	import { globalCurrencyFormatter, formatCurrency } from '$lib/utils/currency.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import { createTableSort, sortData, createSortableFields } from '$lib/utils/table-sort.js';
	
	// Icons
	import Users from 'lucide-svelte/icons/users';
	import UserPlus from 'lucide-svelte/icons/user-plus';
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
	import FileText from 'lucide-svelte/icons/file-text';
	import Image from 'lucide-svelte/icons/image';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Send from 'lucide-svelte/icons/send';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Code from 'lucide-svelte/icons/code';
	
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
		{ key: 'lastLogin', label: 'JOINED / ACTIVITY' },
		{ key: 'revenue', label: 'STATS' },
		{ key: 'actions', label: 'ACTIONS', sortable: false }
	];
	
	// Modal states
	let deleteUserModal = $state(false);
	let userToDelete = $state<any>(null);
	let isDeleting = $state(false);
	let deleteError = $state<string | null>(null);
	
	// Create user modal states
	let showCreateUserModal = $state(false);
	let isCreatingUser = $state(false);
	let createUserError = $state<string | null>(null);
	let createUserSuccess = $state<string | null>(null);
	
	// WhatsApp test modal states
	let showWhatsAppTestModal = $state(false);
	let isTestingWhatsApp = $state(false);
	let whatsAppTestError = $state<string | null>(null);
	let whatsAppTestSuccess = $state<string | null>(null);
	let testPhoneNumber = $state('');
	let testTemplate = $state('booking_confirmation');
	let testParameters = $state(['Test User', 'Test Tour', 'Tomorrow at 2:00 PM', 'Main Square', '2', '$50', 'TEST123', 'Zaur']);

	// User details modal states
	let showUserDetailsModal = $state(false);
	let selectedUser = $state<any>(null);
	let userDetails = $state<any>(null);
	let isLoadingUserDetails = $state(false);
	let userDetailsError = $state<string | null>(null);
	
	// Announcement modal states
	let showAnnouncementModal = $state(false);
	let isSendingAnnouncement = $state(false);
	let announcementError = $state<string | null>(null);
	let announcementSuccess = $state<string | null>(null);
	let announcementRecipientType = $state<'all' | 'beta' | 'plan' | 'verified' | 'active'>('beta');
	let announcementPlanFilter = $state<'free' | 'starter_pro' | 'professional' | 'agency'>('free');
	let announcementSubject = $state('');
	let announcementHeading = $state('');
	let announcementMessage = $state('');
	let announcementCtaText = $state('');
	let announcementCtaUrl = $state('');
	let announcementFooter = $state('');
	let announcementResults = $state<any[]>([]);
	let showRecipientList = $state(false);
	let recipientEmails = $state<string[]>([]);
	let isLoadingRecipients = $state(false);
	
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
	
	// Create user function
	async function createUser(event: SubmitEvent) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);
		
		isCreatingUser = true;
		createUserError = null;
		createUserSuccess = null;
		
		try {
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				body: formData
			});
			
			const result = await response.json();
			
			if (!response.ok) {
				throw new Error(result.error || 'Failed to create user');
			}
			
			// Show success message
			createUserSuccess = result.message;
			
			// Refresh users list and stats
			await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
			await queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
			
			// Clear form and close modal after a short delay
			setTimeout(() => {
				showCreateUserModal = false;
				createUserSuccess = null;
				// Reset form
				const form = event.target as HTMLFormElement;
				form.reset();
			}, 2000);
		} catch (error) {
			createUserError = error instanceof Error ? error.message : 'Failed to create user';
		} finally {
			isCreatingUser = false;
		}
	}
	
	// Test WhatsApp message
	async function testWhatsAppMessage(event: SubmitEvent) {
		event.preventDefault();
		
		whatsAppTestError = null;
		whatsAppTestSuccess = null;
		isTestingWhatsApp = true;
		
		try {
			const response = await fetch('/api/admin/whatsapp-test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phoneNumber: testPhoneNumber,
					template: testTemplate,
					parameters: testParameters
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send test message');
			}
			
			const result = await response.json();
			whatsAppTestSuccess = `Test message sent successfully! Message ID: ${result.messageId} (via ${result.provider})`;
			
			// Clear form after success
			setTimeout(() => {
				whatsAppTestSuccess = null;
				showWhatsAppTestModal = false;
				testPhoneNumber = '';
			}, 3000);
			
		} catch (error) {
			whatsAppTestError = error instanceof Error ? error.message : 'Failed to send test message';
		} finally {
			isTestingWhatsApp = false;
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
			Created: formatDateTime(user.createdAt),
			LastLogin: user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'
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

	// Fetch user details
	async function fetchUserDetails(user: any) {
		selectedUser = user;
		showUserDetailsModal = true;
		isLoadingUserDetails = true;
		userDetailsError = null;
		userDetails = null;

		try {
			const response = await fetch(`/api/admin/users/${user.id}/details`);
			if (!response.ok) {
				throw new Error('Failed to fetch user details');
			}
			userDetails = await response.json();
		} catch (error) {
			userDetailsError = error instanceof Error ? error.message : 'Failed to load user details';
		} finally {
			isLoadingUserDetails = false;
		}
	}

	// Get booking status badge class
	function getBookingStatusBadge(status: string) {
		switch (status) {
			case 'confirmed':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
			case 'cancelled':
			case 'no_show':
				return 'badge-danger';
			case 'completed':
				return 'badge-info';
			default:
				return 'badge-default';
		}
	}

	// Get payment status badge class
	function getPaymentStatusBadge(status: string) {
		switch (status) {
			case 'paid':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
			case 'failed':
			case 'refunded':
				return 'badge-danger';
			default:
				return 'badge-default';
		}
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
	
	// Get recipient count for announcements
	let announcementRecipientCount = $derived.by(() => {
		switch (announcementRecipientType) {
			case 'all':
				return users.length;
			case 'beta':
				return users.filter((u: any) => u.earlyAccessMember).length;
			case 'plan':
				return users.filter((u: any) => u.subscriptionPlan === announcementPlanFilter).length;
			case 'verified':
				return users.filter((u: any) => u.emailVerified).length;
			case 'active':
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				return users.filter((u: any) => u.lastLogin && new Date(u.lastLogin) > thirtyDaysAgo).length;
			default:
				return 0;
		}
	});
	
	// Reset recipient list when filter changes
	$effect(() => {
		// Watch for changes to recipient type or plan filter
		announcementRecipientType;
		announcementPlanFilter;
		// Clear the preview when filters change
		showRecipientList = false;
		recipientEmails = [];
	});
	
	// Preview recipients
	async function previewRecipients() {
		isLoadingRecipients = true;
		announcementError = null;
		
		try {
			// Get recipients based on current filter
			let filteredRecipients;
			
			switch (announcementRecipientType) {
				case 'all':
					filteredRecipients = users;
					break;
				case 'beta':
					filteredRecipients = users.filter((u: any) => u.earlyAccessMember);
					break;
				case 'plan':
					filteredRecipients = users.filter((u: any) => u.subscriptionPlan === announcementPlanFilter);
					break;
				case 'verified':
					filteredRecipients = users.filter((u: any) => u.emailVerified);
					break;
				case 'active':
					const thirtyDaysAgo = new Date();
					thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
					filteredRecipients = users.filter((u: any) => u.lastLogin && new Date(u.lastLogin) > thirtyDaysAgo);
					break;
				default:
					filteredRecipients = [];
			}
			
			recipientEmails = filteredRecipients.map((u: any) => u.email).sort();
			showRecipientList = true;
		} catch (error) {
			announcementError = error instanceof Error ? error.message : 'Failed to load recipients';
		} finally {
			isLoadingRecipients = false;
		}
	}
	
	// Send announcement
	async function sendAnnouncement(event: SubmitEvent, isTest = false) {
		event.preventDefault();
		
		if (!announcementSubject || !announcementHeading || !announcementMessage) {
			announcementError = 'Please fill in all required fields';
			return;
		}
		
		isSendingAnnouncement = true;
		announcementError = null;
		announcementSuccess = null;
		announcementResults = [];
		
		try {
			const response = await fetch('/api/admin/send-announcement', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: announcementSubject,
					heading: announcementHeading,
					message: announcementMessage,
					ctaText: announcementCtaText || undefined,
					ctaUrl: announcementCtaUrl || undefined,
					footer: announcementFooter || undefined,
					recipientType: isTest ? 'test' : announcementRecipientType,
					recipientFilter: announcementRecipientType === 'plan' ? { plan: announcementPlanFilter } : undefined
				})
			});
			
			const result = await response.json();
			
			if (!response.ok) {
				throw new Error(result.error || 'Failed to send announcement');
			}
			
			announcementSuccess = isTest 
				? `Test email sent successfully to b.dymet@gmail.com`
				: `Successfully sent to ${result.sent} out of ${result.totalRecipients} recipients`;
			announcementResults = result.details || [];
			
			// Clear form after success (only for non-test sends)
			if (!isTest) {
				setTimeout(() => {
					showAnnouncementModal = false;
					announcementSubject = '';
					announcementHeading = '';
					announcementMessage = '';
					announcementCtaText = '';
					announcementCtaUrl = '';
					announcementFooter = '';
					announcementSuccess = null;
					announcementResults = [];
				}, 5000);
			}
			
		} catch (error) {
			announcementError = error instanceof Error ? error.message : 'Failed to send announcement';
		} finally {
			isSendingAnnouncement = false;
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
							label: 'Development',
							icon: Code,
							onclick: () => goto('/admin/development'),
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
					<div class="flex flex-wrap items-center gap-3">
						<button onclick={() => goto('/admin/tours')} class="button-secondary button--gap">
							<MapPin class="h-4 w-4" />
							Tours
						</button>
						<button onclick={() => goto('/admin/beta-applications')} class="button-secondary button--gap">
							<Users class="h-4 w-4" />
							Beta Applications
						</button>
						<button onclick={() => goto('/admin/feedback')} class="button-secondary button--gap">
							<MessageSquare class="h-4 w-4" />
							Feedback
						</button>
						<button onclick={() => goto('/admin/development')} class="button-secondary button--gap">
							<Code class="h-4 w-4" />
							Development
						</button>
						<button onclick={() => goto('/admin/email-dashboard')} class="button-secondary button--gap">
							<Mail class="h-4 w-4" />
							Email
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
			
			<StatsCard 
				title="New Today"
				value={stats.newUsersToday}
				subtitle="New signups"
				icon={Users}
			/>
		</div>
		
		<!-- Marketing Tools Section -->
		<div class="mb-6">
			<div class="rounded-xl border" style="background: var(--bg-primary); border-color: var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Marketing Tools</h2>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Generate promotional materials for the platform</p>
				</div>
				<div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<!-- Stickers -->
					<button 
						onclick={() => goto('/admin/stickers')} 
						class="group p-4 rounded-lg border transition-all hover:border-primary"
						style="background: var(--bg-secondary); border-color: var(--border-primary);"
					>
						<div class="flex items-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(250, 107, 93, 0.1);">
								<QrCode class="w-5 h-5" style="color: #e8523e;" />
							</div>
							<h3 class="font-medium" style="color: var(--text-primary);">Promotional Stickers</h3>
						</div>
						<p class="text-sm mb-3" style="color: var(--text-secondary);">Generate QR code stickers for marketing campaigns</p>
						<p class="text-xs text-primary group-hover:underline">Generate PDF →</p>
					</button>
					
					<!-- Business Cards -->
					<button 
						onclick={() => goto('/admin/business-cards')} 
						class="group p-4 rounded-lg border transition-all hover:border-primary"
						style="background: var(--bg-secondary); border-color: var(--border-primary);"
					>
						<div class="flex items-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(250, 107, 93, 0.1);">
								<CreditCard class="w-5 h-5" style="color: #e8523e;" />
							</div>
							<h3 class="font-medium" style="color: var(--text-primary);">Business Cards</h3>
						</div>
						<p class="text-sm mb-3" style="color: var(--text-secondary);">Professional cards with platform branding</p>
						<p class="text-xs text-primary group-hover:underline">Create Templates →</p>
					</button>
					
					<!-- Flyers -->
					<button 
						onclick={() => goto('/admin/flyers')} 
						class="group p-4 rounded-lg border transition-all hover:border-primary"
						style="background: var(--bg-secondary); border-color: var(--border-primary);"
					>
						<div class="flex items-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(79, 157, 166, 0.1);">
								<FileText class="w-5 h-5" style="color: #0d9488;" />
							</div>
							<h3 class="font-medium" style="color: var(--text-primary);">Promotional Flyers</h3>
						</div>
						<p class="text-sm mb-3" style="color: var(--text-secondary);">A4 flyers for events and partner locations</p>
						<p class="text-xs text-primary group-hover:underline">Design Flyers →</p>
					</button>
					
					<!-- Social Graphics -->
					<button 
						onclick={() => goto('/admin/social-graphics')} 
						class="group p-4 rounded-lg border transition-all hover:border-primary"
						style="background: var(--bg-secondary); border-color: var(--border-primary);"
					>
						<div class="flex items-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(139, 92, 246, 0.1);">
								<Image class="w-5 h-5" style="color: #7c3aed;" />
							</div>
							<h3 class="font-medium" style="color: var(--text-primary);">Social Media Graphics</h3>
						</div>
						<p class="text-sm mb-3" style="color: var(--text-secondary);">Eye-catching graphics for social platforms</p>
						<p class="text-xs text-primary group-hover:underline">Create Graphics →</p>
					</button>
				</div>
			</div>
		</div>
		
		<!-- WhatsApp Testing Section -->
		<div class="mb-6">
			<div class="rounded-xl border" style="background: var(--bg-primary); border-color: var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">WhatsApp Testing</h2>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Test WhatsApp message delivery in production</p>
				</div>
				<div class="p-4">
					<button 
						onclick={() => showWhatsAppTestModal = true}
						class="group p-4 rounded-lg border transition-all hover:border-primary w-full max-w-md"
						style="background: var(--bg-secondary); border-color: var(--border-primary);"
					>
						<div class="flex items-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(34, 197, 94, 0.1);">
								<MessageSquare class="w-5 h-5" style="color: #16a34a;" />
							</div>
							<h3 class="font-medium" style="color: var(--text-primary);">Send Test Message</h3>
						</div>
						<p class="text-sm mb-3" style="color: var(--text-secondary);">Send a test WhatsApp message to verify integration</p>
						<p class="text-xs text-primary group-hover:underline">Open Test Panel →</p>
					</button>
				</div>
			</div>
		</div>
		
		<!-- Announcement Section -->
		<div class="mb-6">
			<div class="rounded-xl border" style="background: var(--bg-primary); border-color: var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Email Announcements</h2>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Send email announcements to user groups</p>
				</div>
				<div class="p-4">
					<button 
						onclick={() => showAnnouncementModal = true}
						class="group p-4 rounded-lg border transition-all hover:border-primary w-full max-w-md"
						style="background: var(--bg-secondary); border-color: var(--border-primary);"
					>
						<div class="flex items-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(250, 107, 93, 0.1);">
								<Send class="w-5 h-5" style="color: #e8523e;" />
							</div>
							<h3 class="font-medium" style="color: var(--text-primary);">Send Announcement</h3>
						</div>
						<p class="text-sm mb-3" style="color: var(--text-secondary);">Send emails to Beta users, subscription tiers, or all users</p>
						<p class="text-xs text-primary group-hover:underline">Compose Message →</p>
					</button>
				</div>
			</div>
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
				
				<!-- Create User Button -->
				<button
					onclick={() => showCreateUserModal = true}
					class="button-primary button--gap"
				>
					<UserPlus class="h-4 w-4" />
					Create User
				</button>
				
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
												Joined {formatDateTime(user.createdAt)}
											</p>
											{#if user.lastLogin}
												<p class="text-xs" style="color: var(--text-tertiary);">
													Last login: {formatDateTime(user.lastLogin)}
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
											<Tooltip text="View Details" position="top">
												<button
													onclick={() => fetchUserDetails(user)}
													class="button-primary button--small button--icon"
												>
													<Eye class="h-4 w-4" />
												</button>
											</Tooltip>
											<Tooltip text="View Profile" position="top">
												<button
													onclick={() => window.open(`/${user.username}`, '_blank')}
													class="button-secondary button--small button--icon"
													disabled={!user.username}
												>
													<ExternalLink class="h-4 w-4" />
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
										onclick={() => fetchUserDetails(user)}
										class="button-primary button--small button--icon"
									>
										<Eye class="h-4 w-4" />
									</button>
									<button
										onclick={() => window.open(`/${user.username}`, '_blank')}
										class="button-secondary button--small button--icon"
										disabled={!user.username}
									>
										<ExternalLink class="h-4 w-4" />
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
								Joined {formatDateTime(user.createdAt)}
								{#if user.lastLogin}
									• Last login {formatDateTime(user.lastLogin)}
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
	
	<!-- User Details Modal -->
	{#if showUserDetailsModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between p-6 border-b" style="border-color: var(--border-primary);">
					<div>
						<h3 class="text-xl font-semibold" style="color: var(--text-primary);">User Details</h3>
						{#if selectedUser}
							<p class="text-sm" style="color: var(--text-secondary);">{selectedUser.name} ({selectedUser.email})</p>
						{/if}
					</div>
					<button
						onclick={() => showUserDetailsModal = false}
						class="button-secondary button--icon"
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="overflow-y-auto max-h-[calc(90vh-80px)]">
					{#if isLoadingUserDetails}
						<div class="flex items-center justify-center p-12">
							<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
							<span class="ml-3" style="color: var(--text-secondary);">Loading user details...</span>
						</div>
					{:else if userDetailsError}
						<div class="p-6 text-center">
							<AlertCircle class="h-12 w-12 mx-auto mb-4" style="color: var(--color-danger);" />
							<p class="text-lg font-medium mb-2" style="color: var(--text-primary);">Failed to Load Details</p>
							<p style="color: var(--text-secondary);">{userDetailsError}</p>
							<button
								onclick={() => fetchUserDetails(selectedUser)}
								class="button-primary mt-4"
							>
								Try Again
							</button>
						</div>
					{:else if userDetails}
						<div class="p-6 space-y-8">
							<!-- User Info Section -->
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<!-- Basic Info -->
								<div class="space-y-4">
									<h4 class="text-lg font-semibold" style="color: var(--text-primary);">Basic Information</h4>
									<div class="space-y-3">
										<div class="grid grid-cols-3 gap-2">
											<span class="text-sm font-medium" style="color: var(--text-secondary);">Name:</span>
											<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.name}</span>
										</div>
										<div class="grid grid-cols-3 gap-2">
											<span class="text-sm font-medium" style="color: var(--text-secondary);">Email:</span>
											<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.email}</span>
										</div>
										{#if userDetails.user.username}
											<div class="grid grid-cols-3 gap-2">
												<span class="text-sm font-medium" style="color: var(--text-secondary);">Username:</span>
												<span class="col-span-2 text-sm" style="color: var(--text-primary);">@{userDetails.user.username}</span>
											</div>
										{/if}
										{#if userDetails.user.businessName}
											<div class="grid grid-cols-3 gap-2">
												<span class="text-sm font-medium" style="color: var(--text-secondary);">Business:</span>
												<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.businessName}</span>
											</div>
										{/if}
										{#if userDetails.user.phone}
											<div class="grid grid-cols-3 gap-2">
												<span class="text-sm font-medium" style="color: var(--text-secondary);">Phone:</span>
												<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.phone}</span>
											</div>
										{/if}
										{#if userDetails.user.website}
											<div class="grid grid-cols-3 gap-2">
												<span class="text-sm font-medium" style="color: var(--text-secondary);">Website:</span>
												<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.website}</span>
											</div>
										{/if}
										{#if userDetails.user.location}
											<div class="grid grid-cols-3 gap-2">
												<span class="text-sm font-medium" style="color: var(--text-secondary);">Location:</span>
												<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.location}</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Account Info -->
								<div class="space-y-4">
									<h4 class="text-lg font-semibold" style="color: var(--text-primary);">Account Details</h4>
									<div class="space-y-3">
										<div class="grid grid-cols-3 gap-2">
											<span class="text-sm font-medium" style="color: var(--text-secondary);">Role:</span>
											<span class="col-span-2">
												<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userDetails.user.role === 'admin' ? 'badge-admin' : 'badge-default'}">
													{#if userDetails.user.role === 'admin'}
														<Shield class="h-3 w-3 mr-1" />
													{/if}
													{userDetails.user.role}
												</span>
											</span>
										</div>
										<div class="grid grid-cols-3 gap-2">
											<span class="text-sm font-medium" style="color: var(--text-secondary);">Plan:</span>
											<span class="col-span-2">
												<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getPlanBadgeClass(userDetails.user.subscriptionPlan)}">
													{formatPlanName(userDetails.user.subscriptionPlan)}
												</span>
											</span>
										</div>
										<div class="grid grid-cols-3 gap-2">
											<span class="text-sm font-medium" style="color: var(--text-secondary);">Currency:</span>
											<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.currency}</span>
										</div>
										<div class="grid grid-cols-3 gap-2">
											<span class="text-sm font-medium" style="color: var(--text-secondary);">Verified:</span>
											<span class="col-span-2 text-sm" style="color: var(--text-primary);">{userDetails.user.emailVerified ? 'Yes' : 'No'}</span>
										</div>
										<div class="grid grid-cols-3 gap-2">
											<span class="text-sm font-medium" style="color: var(--text-secondary);">Joined:</span>
											<span class="col-span-2 text-sm" style="color: var(--text-primary);">{formatDate(userDetails.user.createdAt)}</span>
										</div>
										{#if userDetails.user.lastLogin}
											<div class="grid grid-cols-3 gap-2">
												<span class="text-sm font-medium" style="color: var(--text-secondary);">Last Login:</span>
												<span class="col-span-2 text-sm" style="color: var(--text-primary);">{formatDate(userDetails.user.lastLogin)}</span>
											</div>
										{/if}
									</div>
								</div>
							</div>

							<!-- Stats Overview -->
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
									<div class="flex items-center gap-3">
										<div class="p-2 rounded-lg" style="background: var(--color-primary-light);">
											<MapPin class="h-5 w-5" style="color: var(--color-primary);" />
										</div>
										<div>
											<p class="text-2xl font-bold" style="color: var(--text-primary);">{userDetails.stats.totalTours}</p>
											<p class="text-xs" style="color: var(--text-secondary);">Total Tours</p>
										</div>
									</div>
								</div>
								<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
									<div class="flex items-center gap-3">
										<div class="p-2 rounded-lg" style="background: var(--color-success-light);">
											<Calendar class="h-5 w-5" style="color: var(--color-success);" />
										</div>
										<div>
											<p class="text-2xl font-bold" style="color: var(--text-primary);">{userDetails.stats.totalBookings}</p>
											<p class="text-xs" style="color: var(--text-secondary);">Bookings</p>
										</div>
									</div>
								</div>
								<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
									<div class="flex items-center gap-3">
										<div class="p-2 rounded-lg" style="background: var(--color-warning-light);">
											<DollarSign class="h-5 w-5" style="color: var(--color-warning);" />
										</div>
										<div>
											<p class="text-2xl font-bold" style="color: var(--text-primary);">{formatCurrency(userDetails.stats.totalRevenue, { currency: userDetails.user.currency })}</p>
											<p class="text-xs" style="color: var(--text-secondary);">Revenue</p>
										</div>
									</div>
								</div>
								<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
									<div class="flex items-center gap-3">
										<div class="p-2 rounded-lg" style="background: var(--color-info-light);">
											<QrCode class="h-5 w-5" style="color: var(--color-info);" />
										</div>
										<div>
											<p class="text-2xl font-bold" style="color: var(--text-primary);">{userDetails.stats.totalQrScans}</p>
											<p class="text-xs" style="color: var(--text-secondary);">QR Scans</p>
										</div>
									</div>
								</div>
							</div>

							<!-- Tours Section -->
							{#if userDetails.tours.length > 0}
								<div>
									<div class="flex items-center justify-between mb-4">
										<h4 class="text-lg font-semibold" style="color: var(--text-primary);">Tours ({userDetails.tours.length})</h4>
										<div class="flex items-center gap-2 text-sm">
											<span class="px-2 py-1 rounded-full" style="background: var(--color-success-light); color: var(--color-success);">
												Active: {userDetails.stats.activeTours}
											</span>
											<span class="px-2 py-1 rounded-full" style="background: var(--color-warning-light); color: var(--color-warning);">
												Drafts: {userDetails.stats.draftTours}
											</span>
										</div>
									</div>
									<div class="space-y-3">
										{#each userDetails.tours as tour}
											<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
												<div class="flex items-start justify-between gap-4">
													<div class="flex-1">
														<div class="flex items-center gap-2 mb-2">
															<h5 class="font-medium" style="color: var(--text-primary);">{tour.name}</h5>
															<span class="px-2 py-1 rounded-full text-xs font-medium {tour.status === 'active' ? 'badge-success' : 'badge-warning'}">
																{tour.status}
															</span>
														</div>
														<p class="text-sm mb-2" style="color: var(--text-secondary);">{tour.description}</p>
														<div class="flex items-center gap-4 text-xs" style="color: var(--text-tertiary);">
															<span>Price: {formatCurrency(Number(tour.price), { currency: userDetails.user.currency })}</span>
															<span>Duration: {formatDuration(tour.duration)}</span>
															<span>Capacity: {tour.capacity}</span>
															{#if tour.location}
																<span>Location: {tour.location}</span>
															{/if}
														</div>
													</div>
													<div class="text-right">
														<div class="space-y-1 text-xs">
															<p><span style="color: var(--text-secondary);">Bookings:</span> <span class="font-medium" style="color: var(--text-primary);">{tour.bookingCount}</span></p>
															<p><span style="color: var(--text-secondary);">Revenue:</span> <span class="font-medium" style="color: var(--text-primary);">{formatCurrency(tour.revenue, { currency: userDetails.user.currency })}</span></p>
															<p><span style="color: var(--text-secondary);">QR Scans:</span> <span class="font-medium" style="color: var(--text-primary);">{tour.qrScans}</span></p>
														</div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Recent Customer Bookings -->
							{#if userDetails.customerBookings.length > 0}
								<div>
									<h4 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Recent Bookings as Customer</h4>
									<div class="space-y-3">
										{#each userDetails.customerBookings as booking}
											<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
												<div class="flex items-start justify-between gap-4">
													<div class="flex-1">
														<h5 class="font-medium mb-1" style="color: var(--text-primary);">{booking.tourName}</h5>
														<p class="text-sm mb-2" style="color: var(--text-secondary);">
															{formatDate(booking.startTime)} • {booking.participants} participants
														</p>
														<div class="flex items-center gap-2">
															<span class="px-2 py-1 rounded-full text-xs font-medium {getBookingStatusBadge(booking.status)}">
																{booking.status}
															</span>
															<span class="px-2 py-1 rounded-full text-xs font-medium {getPaymentStatusBadge(booking.paymentStatus)}">
																{booking.paymentStatus}
															</span>
														</div>
													</div>
													<div class="text-right">
														<p class="font-medium" style="color: var(--text-primary);">{formatCurrency(Number(booking.totalAmount), { currency: userDetails.user.currency })}</p>
														<p class="text-xs" style="color: var(--text-secondary);">#{booking.bookingReference}</p>
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

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
	
	<!-- Create User Modal -->
	<Modal 
		isOpen={showCreateUserModal}
		onClose={() => {
			showCreateUserModal = false;
			createUserError = null;
			createUserSuccess = null;
		}}
	>
		<div class="p-6">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--text-primary);">
				Create New User Account
			</h2>
			
			<form onsubmit={createUser} class="space-y-4">
				<div>
					<label for="user-email" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Email Address
					</label>
					<input
						id="user-email"
						name="email"
						type="email"
						required
						class="form-input w-full"
						placeholder="user@example.com"
						disabled={isCreatingUser}
					/>
				</div>
				
				<div>
					<label for="user-name" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Full Name
					</label>
					<input
						id="user-name"
						name="name"
						type="text"
						required
						class="form-input w-full"
						placeholder="John Doe"
						disabled={isCreatingUser}
					/>
				</div>
				
				<div>
					<label for="user-password" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Password
					</label>
					<input
						id="user-password"
						name="password"
						type="password"
						required
						minlength="8"
						class="form-input w-full"
						placeholder="Minimum 8 characters"
						disabled={isCreatingUser}
					/>
				</div>
				
				<div>
					<label for="user-role" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Role
					</label>
					<select
						id="user-role"
						name="role"
						class="form-select w-full"
						disabled={isCreatingUser}
					>
						<option value="user">User (Tour Guide)</option>
						<option value="admin">Admin</option>
					</select>
				</div>
				
				<div class="flex items-start gap-3">
					<input
						id="beta-tester"
						name="betaTester"
						type="checkbox"
						class="form-checkbox mt-1"
						disabled={isCreatingUser}
					/>
					<div class="flex-1">
						<label for="beta-tester" class="block text-sm font-medium" style="color: var(--text-secondary);">
							Beta Tester Account
						</label>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">
							Automatically applies BETA_APPRECIATION promo code (12 months free + 30% lifetime discount)
						</p>
					</div>
				</div>
				
				{#if createUserError}
					<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
						<p class="text-sm" style="color: var(--color-danger-700);">
							{createUserError}
						</p>
					</div>
				{/if}
				
				{#if createUserSuccess}
					<div class="rounded-lg p-3" style="background: var(--color-success-100); border: 1px solid var(--color-success-200);">
						<p class="text-sm" style="color: var(--color-success-700);">
							<CheckCircle class="h-4 w-4 inline mr-1" />
							{createUserSuccess}
						</p>
					</div>
				{/if}
				
				<div class="flex gap-3 pt-4">
					<button
						type="submit"
						disabled={isCreatingUser}
						class="button-primary flex-1 button--gap"
					>
						{#if isCreatingUser}
							<Loader2 class="h-4 w-4 animate-spin" />
							Creating...
						{:else}
							<UserPlus class="h-4 w-4" />
							Create User
						{/if}
					</button>
					<button
						type="button"
						onclick={() => {
							showCreateUserModal = false;
							createUserError = null;
							createUserSuccess = null;
						}}
						disabled={isCreatingUser}
						class="button-secondary"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</Modal>
	
	<!-- WhatsApp Test Modal -->
	<Modal 
		isOpen={showWhatsAppTestModal}
		onClose={() => {
			showWhatsAppTestModal = false;
			whatsAppTestError = null;
			whatsAppTestSuccess = null;
		}}
	>
		<div class="p-6">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--text-primary);">
				Send Test WhatsApp Message
			</h2>
			
			<form onsubmit={testWhatsAppMessage} class="space-y-4">
				<div>
					<label for="test-phone" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Phone Number
					</label>
					<input
						id="test-phone"
						bind:value={testPhoneNumber}
						type="tel"
						required
						class="form-input w-full"
						placeholder="+48602846912 or 15558149967"
						disabled={isTestingWhatsApp}
					/>
					<p class="text-xs mt-1" style="color: var(--text-tertiary);">
						Enter phone number with country code (e.g., +48602846912)
					</p>
				</div>
				
				<div>
					<label for="test-template" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Message Template
					</label>
					<select
						id="test-template"
						bind:value={testTemplate}
						class="form-select w-full"
						disabled={isTestingWhatsApp}
					>
						<option value="booking_confirmation">Booking Confirmation</option>
						<option value="booking_reminder">Tour Reminder</option>
						<option value="new_booking_guide">Guide Notification</option>
						<option value="booking_cancelled">Booking Cancelled</option>
					</select>
				</div>
				
				<div>
					<label for="message-preview" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Test Message Preview
					</label>
					<div id="message-preview" class="rounded-lg p-3 text-sm" style="background: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-secondary);" role="region" aria-live="polite">
						{#if testTemplate === 'booking_confirmation'}
							🎉 <strong>Booking Confirmed!</strong><br/>
							Hello Test User,<br/><br/>
							Your booking for <strong>Test Tour</strong> on Tomorrow at 2:00 PM has been confirmed!<br/><br/>
							📍 Meeting point: Main Square<br/>
							👥 Participants: 2<br/>
							💰 Total: $50<br/><br/>
							Your ticket code: <strong>TEST123</strong><br/><br/>
							Show this code at check-in.<br/><br/>
							Thank you for booking with Zaur
						{:else if testTemplate === 'booking_reminder'}
							⏰ <strong>Tour Reminder</strong><br/>
							Hi Test User,<br/><br/>
							This is a friendly reminder about your tour tomorrow!<br/><br/>
							🎯 <strong>Test Tour</strong><br/>
							📅 Tomorrow at 2:00 PM<br/>
							📍 Meeting point: Main Square<br/><br/>
							Your ticket code: <strong>TEST123</strong><br/><br/>
							Please arrive 10 minutes early. See you there!
						{:else if testTemplate === 'new_booking_guide'}
							🎉 <strong>New Booking Received!</strong><br/>
							Hello Zaur,<br/><br/>
							You have a new booking!<br/><br/>
							🎯 Tour: <strong>Test Tour</strong><br/>
							📅 Date: Tomorrow at 2:00 PM<br/>
							👤 Customer: Test User<br/>
							👥 Participants: 2<br/>
							💰 Amount: $50<br/><br/>
							Check your dashboard for full details.
						{:else if testTemplate === 'booking_cancelled'}
							❌ <strong>Booking Cancelled</strong><br/>
							Hi Test User,<br/><br/>
							Your booking for <strong>Test Tour</strong> on Tomorrow at 2:00 PM has been cancelled.<br/><br/>
							If you have any questions, please contact us.
						{/if}
					</div>
				</div>
				
				{#if whatsAppTestError}
					<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
						<p class="text-sm" style="color: var(--color-danger-700);">
							<XCircle class="h-4 w-4 inline mr-1" />
							{whatsAppTestError}
						</p>
					</div>
				{/if}
				
				{#if whatsAppTestSuccess}
					<div class="rounded-lg p-3" style="background: var(--color-success-100); border: 1px solid var(--color-success-200);">
						<p class="text-sm" style="color: var(--color-success-700);">
							<CheckCircle class="h-4 w-4 inline mr-1" />
							{whatsAppTestSuccess}
						</p>
					</div>
				{/if}
				
				<div class="flex gap-3 pt-4">
					<button
						type="submit"
						disabled={isTestingWhatsApp || !testPhoneNumber}
						class="button-primary flex-1 button--gap"
					>
						{#if isTestingWhatsApp}
							<Loader2 class="h-4 w-4 animate-spin" />
							Sending...
						{:else}
							<MessageSquare class="h-4 w-4" />
							Send Test Message
						{/if}
					</button>
					<button
						type="button"
						onclick={() => {
							showWhatsAppTestModal = false;
							whatsAppTestError = null;
							whatsAppTestSuccess = null;
						}}
						disabled={isTestingWhatsApp}
						class="button-secondary"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</Modal>
	
	<!-- Announcement Modal -->
	<Modal 
		isOpen={showAnnouncementModal}
		onClose={() => {
			showAnnouncementModal = false;
			announcementError = null;
			announcementSuccess = null;
			announcementResults = [];
			showRecipientList = false;
			recipientEmails = [];
		}}
	>
		<div class="p-6">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--text-primary);">
				Send Email Announcement
			</h2>
			
			<form onsubmit={sendAnnouncement} class="space-y-4">
				<div>
					<label for="recipient-type" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Recipient Group
					</label>
					<select
						id="recipient-type"
						bind:value={announcementRecipientType}
						class="form-select w-full"
						disabled={isSendingAnnouncement}
					>
						<option value="all">All Users ({users.length})</option>
						<option value="beta">Beta Testers ({users.filter((u: any) => u.earlyAccessMember).length})</option>
						<option value="verified">Verified Users ({users.filter((u: any) => u.emailVerified).length})</option>
						<option value="active">Active Users (Last 30 days)</option>
						<option value="plan">By Subscription Plan</option>
					</select>
				</div>
				
				{#if announcementRecipientType === 'plan'}
					<div>
						<label for="plan-filter" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							Select Plan
						</label>
						<select
							id="plan-filter"
							bind:value={announcementPlanFilter}
							class="form-select w-full"
							disabled={isSendingAnnouncement}
						>
							<option value="free">Free ({users.filter((u: any) => u.subscriptionPlan === 'free').length})</option>
							<option value="starter_pro">Starter Pro ({users.filter((u: any) => u.subscriptionPlan === 'starter_pro').length})</option>
							<option value="professional">Professional ({users.filter((u: any) => u.subscriptionPlan === 'professional').length})</option>
							<option value="agency">Agency ({users.filter((u: any) => u.subscriptionPlan === 'agency').length})</option>
						</select>
					</div>
				{/if}
				
				<div class="rounded-lg p-3 space-y-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium" style="color: var(--text-primary);">
							Recipients: {announcementRecipientCount} user{announcementRecipientCount === 1 ? '' : 's'}
						</p>
						<button
							type="button"
							onclick={previewRecipients}
							disabled={isLoadingRecipients || announcementRecipientCount === 0}
							class="text-xs button-secondary button--small button--gap"
						>
							{#if isLoadingRecipients}
								<Loader2 class="h-3 w-3 animate-spin" />
								Loading...
							{:else}
								<Eye class="h-3 w-3" />
								{showRecipientList ? 'Refresh List' : 'Preview Recipients'}
							{/if}
						</button>
					</div>
					
					{#if showRecipientList && recipientEmails.length > 0}
						<div class="border-t pt-3" style="border-color: var(--border-primary);">
							<div class="max-h-48 overflow-y-auto space-y-1">
								<p class="text-xs font-medium mb-2" style="color: var(--text-secondary);">
									Email addresses ({recipientEmails.length}):
								</p>
								{#each recipientEmails as email}
									<div class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary); color: var(--text-secondary);">
										{email}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				
				<div>
					<label for="subject" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Email Subject <span style="color: var(--color-danger-600);">*</span>
					</label>
					<input
						id="subject"
						bind:value={announcementSubject}
						type="text"
						required
						class="form-input w-full"
						placeholder="e.g., Important Update for Beta Testers"
						disabled={isSendingAnnouncement}
					/>
				</div>
				
				<div>
					<label for="heading" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Email Heading <span style="color: var(--color-danger-600);">*</span>
					</label>
					<input
						id="heading"
						bind:value={announcementHeading}
						type="text"
						required
						class="form-input w-full"
						placeholder="e.g., New Features Coming Soon!"
						disabled={isSendingAnnouncement}
					/>
				</div>
				
				<div>
					<label for="message" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Message <span style="color: var(--color-danger-600);">*</span>
					</label>
					<textarea
						id="message"
						bind:value={announcementMessage}
						required
						rows="6"
						class="form-textarea w-full"
						placeholder="Your message content here...&#10;&#10;Use double line breaks for paragraphs."
						disabled={isSendingAnnouncement}
					></textarea>
					<p class="text-xs mt-1" style="color: var(--text-tertiary);">
						Use double line breaks to create paragraphs
					</p>
				</div>
				
				<div class="rounded-lg p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border-primary);">
					<p class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Optional Call-to-Action Button</p>
					<div class="space-y-3">
						<div>
							<label for="cta-text" class="block text-xs font-medium mb-1" style="color: var(--text-tertiary);">
								Button Text
							</label>
							<input
								id="cta-text"
								bind:value={announcementCtaText}
								type="text"
								class="form-input form-input--small w-full"
								placeholder="e.g., View New Features"
								disabled={isSendingAnnouncement}
							/>
						</div>
						<div>
							<label for="cta-url" class="block text-xs font-medium mb-1" style="color: var(--text-tertiary);">
								Button URL
							</label>
							<input
								id="cta-url"
								bind:value={announcementCtaUrl}
								type="url"
								class="form-input form-input--small w-full"
								placeholder="e.g., https://zaur.app/blog/new-features"
								disabled={isSendingAnnouncement}
							/>
						</div>
					</div>
				</div>
				
				<div>
					<label for="footer" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Footer Text (Optional)
					</label>
					<input
						id="footer"
						bind:value={announcementFooter}
						type="text"
						class="form-input w-full"
						placeholder="e.g., Thank you for being a Beta tester!"
						disabled={isSendingAnnouncement}
					/>
				</div>
				
				{#if announcementError}
					<div class="rounded-lg p-3" style="background: var(--color-danger-100); border: 1px solid var(--color-danger-200);">
						<p class="text-sm" style="color: var(--color-danger-700);">
							<XCircle class="h-4 w-4 inline mr-1" />
							{announcementError}
						</p>
					</div>
				{/if}
				
				{#if announcementSuccess}
					<div class="rounded-lg p-3" style="background: var(--color-success-100); border: 1px solid var(--color-success-200);">
						<p class="text-sm" style="color: var(--color-success-700);">
							<CheckCircle class="h-4 w-4 inline mr-1" />
							{announcementSuccess}
						</p>
					</div>
				{/if}
				
				{#if announcementResults.length > 0}
					<div class="rounded-lg p-3 max-h-48 overflow-y-auto" style="background: var(--bg-tertiary); border: 1px solid var(--border-primary);">
						<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Send Results:</p>
						<div class="space-y-1 text-xs">
							{#each announcementResults as result}
								<div class="flex items-center gap-2">
									{#if result.success}
										<CheckCircle class="h-3 w-3 flex-shrink-0" style="color: var(--color-success-600);" />
									{:else}
										<XCircle class="h-3 w-3 flex-shrink-0" style="color: var(--color-danger-600);" />
									{/if}
									<span style="color: var(--text-secondary);">
										{result.name || result.email}
										{#if !result.success}
											- {result.error}
										{/if}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<div class="space-y-3 pt-4">
					<div class="flex gap-3">
						<button
							type="submit"
							disabled={isSendingAnnouncement || announcementRecipientCount === 0}
							class="button-primary flex-1 button--gap"
						>
							{#if isSendingAnnouncement}
								<Loader2 class="h-4 w-4 animate-spin" />
								Sending...
							{:else}
								<Send class="h-4 w-4" />
								Send to {announcementRecipientCount} User{announcementRecipientCount === 1 ? '' : 's'}
							{/if}
						</button>
						<button
							type="button"
							onclick={() => {
								showAnnouncementModal = false;
								announcementError = null;
								announcementSuccess = null;
								announcementResults = [];
								showRecipientList = false;
								recipientEmails = [];
							}}
							disabled={isSendingAnnouncement}
							class="button-secondary"
						>
							Cancel
						</button>
					</div>
					<button
						type="button"
						onclick={(e) => sendAnnouncement(e as any, true)}
						disabled={isSendingAnnouncement}
						class="button-secondary w-full button--gap"
					>
						<Mail class="h-4 w-4" />
						Send Test Email to b.dymet@gmail.com
					</button>
				</div>
			</form>
		</div>
	</Modal>
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