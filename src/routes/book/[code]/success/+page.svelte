<script lang="ts">
	import type { PageData } from './$types.js';
	import Check from 'lucide-svelte/icons/check';
	import Calendar from 'lucide-svelte/icons/calendar';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Users from 'lucide-svelte/icons/users';
	import Mail from 'lucide-svelte/icons/mail';
	
	let { data }: { data: PageData } = $props();
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	}
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<div class="max-w-2xl mx-auto">
			<!-- Success Message -->
			<div class="bg-white rounded-lg shadow-sm overflow-hidden">
				<div class="bg-green-50 px-6 py-8 text-center">
					<div class="flex justify-center mb-4">
						<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
							<Check class="w-10 h-10 text-green-600" />
						</div>
					</div>
					<h1 class="text-3xl font-bold text-green-900 mb-2">Booking Confirmed!</h1>
					<p class="text-green-700">
						Thank you for your booking. You'll receive a confirmation email shortly.
					</p>
				</div>
				
				<!-- Booking Details -->
				<div class="px-6 py-6">
					<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p class="text-sm font-medium text-blue-900 mb-1">Booking Reference</p>
						<p class="text-2xl font-mono font-bold text-blue-800">{data.booking.bookingReference}</p>
						<p class="text-xs text-blue-600 mt-1">Keep this reference for your records</p>
					</div>
					
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
					
					<div class="space-y-4">
						<div>
							<h3 class="font-medium text-gray-900 mb-2">{data.booking.expand?.tour?.name}</h3>
							{#if data.booking.expand?.tour?.description}
								<p class="text-sm text-gray-600">{data.booking.expand?.tour?.description}</p>
							{/if}
						</div>
						
						<div class="flex items-start gap-3">
							<Calendar class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<p class="font-medium text-gray-900">
									{formatDate(data.booking.expand?.timeSlot?.startTime)}
								</p>
								<p class="text-sm text-gray-600">
									{formatTime(data.booking.expand?.timeSlot?.startTime)} - 
									{formatTime(data.booking.expand?.timeSlot?.endTime)}
								</p>
							</div>
						</div>
						
						{#if data.booking.expand?.tour?.location}
							<div class="flex items-start gap-3">
								<MapPin class="w-5 h-5 text-gray-400 mt-0.5" />
								<div>
									<p class="font-medium text-gray-900">Meeting Point</p>
									<p class="text-sm text-gray-600">{data.booking.expand?.tour?.location}</p>
								</div>
							</div>
						{/if}
						
						<div class="flex items-start gap-3">
							<Users class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<p class="font-medium text-gray-900">
									{data.booking.participants} {data.booking.participants === 1 ? 'participant' : 'participants'}
								</p>
								<p class="text-sm text-gray-600">€{data.booking.totalAmount} total</p>
							</div>
						</div>
						
						<div class="flex items-start gap-3">
							<Mail class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<p class="font-medium text-gray-900">Confirmation sent to</p>
								<p class="text-sm text-gray-600">{data.booking.customerEmail}</p>
							</div>
						</div>
					</div>
					
					<!-- Important Information -->
					<div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
						<h3 class="font-medium text-amber-900 mb-2">Important Information</h3>
						<ul class="text-sm text-amber-700 space-y-1">
							<li>• Please arrive 10 minutes before the tour starts</li>
							<li>• Check your email for detailed meeting instructions</li>
							<li>• Contact your tour guide if you need to make changes</li>
						</ul>
					</div>
					
					<!-- Actions -->
					<div class="mt-6 flex flex-col sm:flex-row gap-3">
						<a
							href="/"
							class="button-secondary justify-center"
						>
							Back to Home
						</a>
						<button
							onclick={() => window.print()}
							class="button-secondary justify-center"
						>
							Print Confirmation
						</button>
					</div>
				</div>
			</div>
			
			<!-- Footer -->
			<div class="mt-8 text-center text-sm text-gray-500">
				<p>Need help? Contact your tour guide or visit <a href="https://zaur.app" class="text-blue-600 hover:underline">zaur.app</a></p>
			</div>
		</div>
	</div>
</div> 