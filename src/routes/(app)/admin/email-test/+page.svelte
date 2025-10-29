<script lang="ts">
  import { browser } from '$app/environment';
  
  type EmailResult = {
    time: string;
    action: string;
    status: 'success' | 'error';
    message: string;
  };
  
  let isLoading = false;
  let results: EmailResult[] = [];
  let bookingId = '';
  let emailType = 'confirmation';
  let testBookingId = '';
  let testingPayment = false;
  let paymentTestResult: any;
  
  async function testEmail(action: string, data: Record<string, any> = {}) {
    if (!browser) return;
    
    isLoading = true;
    try {
      const response = await fetch('/api/test-booking-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...data
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        results = [...results, {
          time: new Date().toLocaleTimeString(),
          action,
          status: 'success',
          message: result.message
        }];
      } else {
        results = [...results, {
          time: new Date().toLocaleTimeString(),
          action,
          status: 'error',
          message: result.error || 'Unknown error'
        }];
      }
    } catch (error) {
      results = [...results, {
        time: new Date().toLocaleTimeString(),
        action,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }];
    } finally {
      isLoading = false;
    }
  }
  
  function clearResults() {
    results = [];
  }

  async function confirmTestPayment() {
    testingPayment = true;
    try {
      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: testBookingId
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        paymentTestResult = result;
      } else {
        paymentTestResult = { error: result.error || 'Unknown error' };
      }
    } catch (error) {
      paymentTestResult = { error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      testingPayment = false;
    }
  }

  async function checkBookingStatus() {
    try {
      const response = await fetch('/api/check-booking-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: testBookingId
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        paymentTestResult = result;
      } else {
        paymentTestResult = { error: result.error || 'Unknown error' };
      }
    } catch (error) {
      paymentTestResult = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
</script>

<div class="w-full px-6 sm:px-8 lg:px-12 py-8">
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📧 Email System Test</h1>
      <p class="text-gray-600">Test the booking email notifications system</p>
    </div>

    <!-- Test Buttons -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">System Tests</h2>
      <div class="space-y-4">
        <div>
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            onclick={() => testEmail('test')}
          >
            {isLoading ? 'Testing...' : '🧪 Send Test Email'}
          </button>
          <p class="text-sm text-gray-500 mt-1">Sends a test email to verify the system is working</p>
        </div>
        
        <div>
          <button
            class="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            onclick={() => testEmail('send-reminders')}
          >
            {isLoading ? 'Sending...' : '⏰ Send Booking Reminders'}
          </button>
          <p class="text-sm text-gray-500 mt-1">Sends reminder emails for bookings starting tomorrow</p>
        </div>
      </div>
    </div>

    <!-- Manual Email Testing -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Manual Email Testing</h2>
      <div class="space-y-4">
        <div>
          <label for="bookingId" class="block text-sm font-medium text-gray-700 mb-1">
            Booking ID
          </label>
          <input
            id="bookingId"
            type="text"
            bind:value={bookingId}
            placeholder="Enter booking ID"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        
        <div>
          <label for="emailType" class="block text-sm font-medium text-gray-700 mb-1">
            Email Type
          </label>
          <select
            id="emailType"
            bind:value={emailType}
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="confirmation">📋 Booking Confirmation</option>
            <option value="payment">💳 Payment Received</option>
            <option value="reminder">⏰ Booking Reminder</option>
            <option value="cancelled">❌ Booking Cancelled</option>
          </select>
        </div>
        
        <div class="flex space-x-4">
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !bookingId}
            onclick={() => testEmail('send-email', { bookingId, emailType })}
          >
            {isLoading ? 'Sending...' : `📧 Send ${emailType} Email`}
          </button>
          
          <button
            class="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !bookingId}
            onclick={() => testEmail('send-qr-ticket', { bookingId })}
          >
            {isLoading ? 'Sending...' : '🎫 Send QR Ticket'}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    {#if results.length > 0}
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Test Results</h2>
          <button
            class="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 text-sm rounded-lg transition-colors duration-200"
            onclick={clearResults}
          >
            Clear Results
          </button>
        </div>
        
        <div class="space-y-3">
          {#each results as result}
            <div class="border rounded-lg p-4 {result.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium {result.status === 'success' ? 'text-green-800' : 'text-red-800'}">
                      {result.status === 'success' ? '✅' : '❌'} {result.action}
                    </span>
                    <span class="text-xs text-gray-500">{result.time}</span>
                  </div>
                  <p class="text-sm {result.status === 'success' ? 'text-green-700' : 'text-red-700'} mt-1">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Test Payment Processing</h2>
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="mb-4">
          <label for="bookingId" class="block text-sm font-medium text-gray-700 mb-2">
            Booking ID
          </label>
          <input
            id="bookingId"
            type="text"
            bind:value={testBookingId}
            placeholder="hclq1iz6xk54omw2ul5"
            class="form-input w-full"
          />
        </div>
        
        <div class="flex gap-3">
          <button 
            onclick={confirmTestPayment}
            disabled={testingPayment || !testBookingId}
            class="button-primary button-gap"
          >
            {#if testingPayment}
              <div class="form-spinner"></div>
              Confirming...
            {:else}
              Manually Confirm Payment
            {/if}
          </button>
          
          <button 
            onclick={checkBookingStatus}
            disabled={testingPayment || !testBookingId}
            class="button-secondary button-gap"
          >
            Check Status
          </button>
        </div>
        
        {#if paymentTestResult}
          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Result:</h4>
            <pre class="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(paymentTestResult, null, 2)}</pre>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div> 