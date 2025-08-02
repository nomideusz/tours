<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Users from 'lucide-svelte/icons/users';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Bell from 'lucide-svelte/icons/bell';
	import Settings from 'lucide-svelte/icons/settings';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Mail from 'lucide-svelte/icons/mail';
	import ExternalLink from 'lucide-svelte/icons/external-link';
</script>

<svelte:head>
	<title>Help Center | Zaur</title>
	<meta name="description" content="Get help with managing your tours, bookings, and customer interactions on Zaur." />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<PageHeader 
		title="Help Center" 
		subtitle="Get help with managing your tours and bookings"
	/>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
		<!-- Main Help Content -->
		<div class="lg:col-span-2 space-y-8">
			<!-- Getting Started -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
							<BookOpen class="h-4 w-4 text-blue-600" />
						</div>
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Getting Started</h2>
					</div>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Creating Your First Tour</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Start by creating a new tour with basic information like name, description, price, and duration. 
							Add photos to make your tour more appealing to customers.
						</p>
					</div>
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Setting Up Time Slots</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Use the schedule feature to create time slots when you're available to run tours. 
							You can create individual slots or use patterns for recurring schedules.
						</p>
					</div>
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Sharing Your Tour</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Each tour gets a unique QR code and booking link. Share these with customers so they can book your tours.
						</p>
					</div>
				</div>
			</div>

			<!-- Managing Bookings -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
							<Users class="h-4 w-4 text-green-600" />
						</div>
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Managing Bookings</h2>
					</div>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Booking Status</h3>
						<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
							<li><strong>Pending:</strong> Payment not yet confirmed</li>
							<li><strong>Confirmed:</strong> Payment received, customer is booked</li>
							<li><strong>Cancelled:</strong> Booking was cancelled</li>
							<li><strong>Completed:</strong> Tour has been completed</li>
						</ul>
					</div>
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Check-in Process</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Use the QR scanner to check in customers when they arrive. This marks their attendance and helps track tour completion.
						</p>
					</div>
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Managing Capacity</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Set capacity limits for each tour and time slot. The system will automatically stop accepting bookings when full.
						</p>
					</div>
				</div>
			</div>

			<!-- Scheduling -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
							<Calendar class="h-4 w-4 text-purple-600" />
						</div>
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Scheduling</h2>
					</div>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Schedule Patterns</h3>
						<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
							<li><strong>Daily:</strong> Same times every day</li>
							<li><strong>Weekend:</strong> Saturday and Sunday only</li>
							<li><strong>Custom:</strong> Specific days of the week</li>
							<li><strong>Manual:</strong> Individual time slots</li>
						</ul>
					</div>
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">Time Slot Status</h3>
						<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
							<li><strong>Available:</strong> Open for bookings</li>
							<li><strong>Full:</strong> Capacity reached</li>
							<li><strong>Cancelled:</strong> Not available for booking</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Quick Actions -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-medium" style="color: var(--text-primary);">Quick Actions</h3>
				</div>
				<div class="p-4 space-y-3">
					<a href="/tours/new" class="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50" style="border: 1px solid var(--border-primary);">
						<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
							<BookOpen class="h-4 w-4 text-blue-600" />
						</div>
						<div>
							<p class="font-medium text-sm" style="color: var(--text-primary);">Create New Tour</p>
							<p class="text-xs" style="color: var(--text-secondary);">Set up a new tour offering</p>
						</div>
					</a>
					
					<a href="/checkin-scanner" class="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50" style="border: 1px solid var(--border-primary);">
						<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
							<QrCode class="h-4 w-4 text-green-600" />
						</div>
						<div>
							<p class="font-medium text-sm" style="color: var(--text-primary);">Check-in Scanner</p>
							<p class="text-xs" style="color: var(--text-secondary);">Scan customer tickets</p>
						</div>
					</a>
					
					<a href="/profile" class="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50" style="border: 1px solid var(--border-primary);">
						<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
							<Settings class="h-4 w-4 text-purple-600" />
						</div>
						<div>
							<p class="font-medium text-sm" style="color: var(--text-primary);">Profile Settings</p>
							<p class="text-xs" style="color: var(--text-secondary);">Update your information</p>
						</div>
					</a>
				</div>
			</div>

			<!-- Common Topics -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-medium" style="color: var(--text-primary);">Common Topics</h3>
				</div>
				<div class="p-4 space-y-3">
					<div class="flex items-start gap-3">
						<QrCode class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium text-sm" style="color: var(--text-primary);">QR Code Sharing</p>
							<p class="text-xs" style="color: var(--text-secondary);">How to share your tour booking links</p>
						</div>
					</div>
					
					<div class="flex items-start gap-3">
						<CreditCard class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium text-sm" style="color: var(--text-primary);">Payment Processing</p>
							<p class="text-xs" style="color: var(--text-secondary);">Understanding payment status</p>
						</div>
					</div>
					
					<div class="flex items-start gap-3">
						<Bell class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
						<div>
							<p class="font-medium text-sm" style="color: var(--text-primary);">Notifications</p>
							<p class="text-xs" style="color: var(--text-secondary);">Managing booking alerts</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Contact Support -->
			<div class="rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-medium" style="color: var(--text-primary);">Need More Help?</h3>
				</div>
				<div class="p-4 space-y-3">
					<p class="text-sm" style="color: var(--text-secondary);">
						Can't find what you're looking for? Our support team is here to help.
					</p>
					
					<a 
						href="mailto:support@zaur.app" 
						class="flex items-center gap-2 text-sm font-medium transition-colors hover:underline"
						style="color: var(--color-primary-600);"
					>
						<Mail class="h-4 w-4" />
						Contact Support
					</a>
					
					<a 
						href="https://zaur.app" 
						target="_blank"
						class="flex items-center gap-2 text-sm font-medium transition-colors hover:underline"
						style="color: var(--color-primary-600);"
					>
						<ExternalLink class="h-4 w-4" />
						Visit Website
					</a>
				</div>
			</div>
		</div>
	</div>
</div> 