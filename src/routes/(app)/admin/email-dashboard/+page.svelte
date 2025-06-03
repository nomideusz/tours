<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  type EmailStats = {
    totalSent: number;
    lastDay: number;
    lastWeek: number;
    byType: Record<string, number>;
  };
  
  type RecentBooking = {
    id: string;
    customerName: string;
    customerEmail: string;
    bookingReference: string;
    status: string;
    paymentStatus: string;
    ticketQRCode: string;
    tourName: string;
    created: string;
  };
  
  let isLoading = false;
  let stats: EmailStats | null = null;
  let recentBookings: RecentBooking[] = [];
  let selectedBookings: string[] = [];
  let bulkEmailType = 'confirmation';
  let bulkResults: any[] = [];
  
  onMount(async () => {
    if (browser) {
      await loadRecentBookings();
    }
  });
  
  async function loadRecentBookings() {
    try {
      isLoading = true;
      const response = await fetch('/api/list-recent-bookings');
      const result = await response.json();
      
      if (result.success) {
        recentBookings = result.bookings;
      }
    } catch (error) {
      console.error('Failed to load recent bookings:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function sendBulkEmails() {
    if (selectedBookings.length === 0) return;
    
    isLoading = true;
    bulkResults = [];
    
    for (const bookingId of selectedBookings) {
      try {
        const response = await fetch('/api/send-booking-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            emailType: bulkEmailType
          })
        });
        
        const result = await response.json();
        const booking = recentBookings.find(b => b.id === bookingId);
        
        bulkResults.push({
          bookingId,
          customerName: booking?.customerName || 'Unknown',
          success: response.ok,
          message: result.message || result.error || 'Unknown'
        });
      } catch (error) {
        bulkResults.push({
          bookingId,
          customerName: 'Unknown',
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    isLoading = false;
    selectedBookings = [];
  }
  
  async function sendReminders() {
    try {
      isLoading = true;
      const response = await fetch('/api/send-booking-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Reminders sent successfully! Found: ${result.found}, Sent: ${result.sent}`);
      } else {
        alert(`Failed to send reminders: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isLoading = false;
    }
  }
  
  function selectAll() {
    selectedBookings = recentBookings.map(b => b.id);
  }
  
  function clearSelection() {
    selectedBookings = [];
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
  
  function getPaymentStatusColor(status: string) {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📧 Email Dashboard</h1>
      <p class="text-gray-600">Manage booking email notifications and view recent activity</p>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          on:click={sendReminders}
        >
          {isLoading ? 'Sending...' : '⏰ Send Daily Reminders'}
        </button>
        
        <a
          href="/admin/email-test"
          class="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-center"
        >
          🧪 Email Testing
        </a>
        
        <button
          class="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          on:click={loadRecentBookings}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh Data'}
        </button>
      </div>
    </div>

    <!-- Bulk Email Operations -->
    {#if selectedBookings.length > 0}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-blue-900 mb-4">
          Bulk Email ({selectedBookings.length} selected)
        </h2>
        <div class="flex items-center space-x-4">
          <select
            bind:value={bulkEmailType}
            class="rounded-lg border border-blue-300 px-3 py-2 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="confirmation">📋 Booking Confirmation</option>
            <option value="payment">💳 Payment Received</option>
            <option value="reminder">⏰ Booking Reminder</option>
            <option value="cancelled">❌ Booking Cancelled</option>
            <option value="qr-ticket">🎫 QR Ticket</option>
          </select>
          
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            on:click={sendBulkEmails}
          >
            {isLoading ? 'Sending...' : `Send ${bulkEmailType} emails`}
          </button>
          
          <button
            class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            on:click={clearSelection}
          >
            Clear Selection
          </button>
        </div>
      </div>
    {/if}

    <!-- Bulk Results -->
    {#if bulkResults.length > 0}
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Bulk Email Results</h2>
        <div class="space-y-2">
          {#each bulkResults as result}
            <div class="flex justify-between items-center p-3 rounded-lg {result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
              <span class="font-medium {result.success ? 'text-green-800' : 'text-red-800'}">
                {result.customerName}
              </span>
              <span class="text-sm {result.success ? 'text-green-600' : 'text-red-600'}">
                {result.success ? '✅' : '❌'} {result.message}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recent Bookings -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <div class="space-x-2">
            <button
              class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1 px-3 rounded transition-colors duration-200"
              on:click={selectAll}
            >
              Select All
            </button>
            <button
              class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1 px-3 rounded transition-colors duration-200"
              on:click={clearSelection}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      {#if isLoading}
        <div class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600">Loading recent bookings...</p>
        </div>
      {:else if recentBookings.length === 0}
        <div class="p-8 text-center text-gray-500">
          No recent bookings found
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tour
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each recentBookings as booking (booking.id)}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      bind:group={selectedBookings}
                      value={booking.id}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{booking.customerName}</div>
                    <div class="text-sm text-gray-500">{booking.customerEmail}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.tourName}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {booking.bookingReference}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-medium {getStatusColor(booking.status)}">
                      {booking.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-medium {getPaymentStatusColor(booking.paymentStatus)}">
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.ticketQRCode !== 'NOT_GENERATED' ? '✅' : '❌'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(booking.created)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div> 