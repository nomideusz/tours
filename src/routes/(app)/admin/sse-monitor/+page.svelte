<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let monitorData: any = null;
  let loading = true;
  let error: string | null = null;
  let lastUpdated: Date | null = null;

  async function fetchMonitorData() {
    if (!browser) return;
    
    try {
      loading = true;
      error = null;
      
      const response = await fetch('/api/notifications/sse-monitor');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      monitorData = await response.json();
      lastUpdated = new Date();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch SSE monitor data:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchMonitorData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMonitorData, 30000);
    
    return () => clearInterval(interval);
  });

  function getStatusColor(status: string) {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
</script>

<svelte:head>
  <title>SSE Monitor - Admin</title>
</svelte:head>

<div class="w-full px-6 sm:px-8 lg:px-12 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">SSE Connection Monitor</h1>
    <p class="text-gray-600 dark:text-gray-400">
      Monitor Server-Sent Events connection health and performance
    </p>
    {#if lastUpdated}
      <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
        Last updated: {lastUpdated.toLocaleString()}
      </p>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading monitor data...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error loading monitor data</h3>
          <div class="mt-2 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    </div>
  {:else if monitorData}
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Active Connections</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {monitorData.stats.activeConnections}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Connections</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {monitorData.stats.totalConnections}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Errors</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {monitorData.stats.errorCount}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {monitorData.health.errorRate ? (monitorData.health.errorRate * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Health Report -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Health Report</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Stale Connections</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">
            {monitorData.health.staleConnectionsCount}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Active</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">
            {monitorData.health.totalActive}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Last Error</p>
          <p class="text-sm text-gray-900 dark:text-white">
            {monitorData.stats.lastErrorTime ? new Date(monitorData.stats.lastErrorTime).toLocaleString() : 'None'}
          </p>
        </div>
      </div>

      {#if monitorData.stats.lastError}
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Last Error</h3>
          <p class="text-sm text-red-700 dark:text-red-300 font-mono">
            {monitorData.stats.lastError}
          </p>
        </div>
      {/if}
    </div>

    <!-- Recommendations -->
    {#if monitorData.recommendations && monitorData.recommendations.length > 0}
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h2>
        
        <div class="space-y-3">
          {#each monitorData.recommendations as recommendation}
            <div class="flex items-start p-4 rounded-lg border {getStatusColor(recommendation.type)}">
              <div class="flex-shrink-0">
                {#if recommendation.type === 'critical'}
                  <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                {:else if recommendation.type === 'warning'}
                  <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium">
                  {recommendation.message}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Refresh Button -->
    <div class="mt-8 flex justify-center">
      <button 
        on:click={fetchMonitorData}
        class="button-primary"
        disabled={loading}
      >
        {#if loading}
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {/if}
        Refresh Data
      </button>
    </div>
  {/if}
</div>
