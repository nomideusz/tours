<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import Check from 'lucide-svelte/icons/check';
  import X from 'lucide-svelte/icons/x';
  import Gift from 'lucide-svelte/icons/gift';
  import Loader from 'lucide-svelte/icons/loader';
  
  const dispatch = createEventDispatcher<{
    applied: {
      code: string;
      benefits: {
        discountPercentage: number;
        freeMonths: number;
        isLifetime: boolean;
        description: string;
      };
    };
    error: { message: string };
  }>();
  
  let { 
    disabled = false,
    placeholder = "Enter promo code",
    class: className = ""
  } = $props();
  
  let code = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let validationResult = $state<{
    valid: boolean;
    benefitText: string;
    benefits: {
      discountPercentage: number;
      freeMonths: number;
      isLifetime: boolean;
      description: string;
    };
  } | null>(null);
  
  async function validateCode() {
    if (!code.trim()) {
      error = 'Please enter a promo code';
      return;
    }
    
    loading = true;
    error = null;
    validationResult = null;
    
    try {
      const response = await fetch('/api/promo-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        validationResult = {
          valid: true,
          benefitText: data.benefitText,
          benefits: data.benefits
        };
      } else {
        error = data.error || 'Invalid promo code';
      }
    } catch (err) {
      error = 'Failed to validate promo code';
    } finally {
      loading = false;
    }
  }
  
  async function applyCode() {
    if (!validationResult || !code.trim()) return;
    
    loading = true;
    
    try {
      const response = await fetch('/api/promo-code/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('applied', {
          code: code.trim(),
          benefits: validationResult.benefits
        });
        // Reset form
        code = '';
        validationResult = null;
        error = null;
      } else {
        error = data.error || 'Failed to apply promo code';
      }
    } catch (err) {
      error = 'Failed to apply promo code';
    } finally {
      loading = false;
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (validationResult) {
        applyCode();
      } else {
        validateCode();
      }
    }
  }
  
  function resetForm() {
    code = '';
    validationResult = null;
    error = null;
  }
</script>

<div class="promo-code-input {className}">
  <div class="flex gap-2">
    <div class="flex-1">
      <input
        type="text"
        bind:value={code}
        {placeholder}
        {disabled}
        onkeydown={handleKeydown}
        class="w-full px-3 py-2 border rounded-md text-sm"
        style="
          background: var(--bg-primary);
          border-color: var(--border-primary);
          color: var(--text-primary);
        "
      />
    </div>
    
    {#if validationResult}
      <button
        type="button"
        onclick={applyCode}
        disabled={loading || disabled}
        class="button-primary button--small"
      >
        {#if loading}
          <Loader class="w-4 h-4 animate-spin" />
        {:else}
          Apply
        {/if}
      </button>
      <button
        type="button"
        onclick={resetForm}
        disabled={loading || disabled}
        class="button-secondary button--small"
      >
        <X class="w-4 h-4" />
      </button>
    {:else}
      <button
        type="button"
        onclick={validateCode}
        disabled={loading || disabled || !code.trim()}
        class="button-secondary button--small"
      >
        {#if loading}
          <Loader class="w-4 h-4 animate-spin" />
        {:else}
          Check
        {/if}
      </button>
    {/if}
  </div>
  
  {#if error}
    <div class="mt-2 flex items-center gap-2 text-sm" style="color: var(--color-danger-600);" transition:fade>
      <X class="w-4 h-4" />
      {error}
    </div>
  {/if}
  
  {#if validationResult}
    <div class="mt-2 p-3 rounded-md border" 
         style="background: var(--color-success-50); border-color: var(--color-success-200);"
         transition:fade>
      <div class="flex items-start gap-2">
        <Gift class="w-5 h-5 mt-0.5 text-green-600" />
        <div>
          <p class="font-medium text-sm" style="color: var(--color-success-800);">
            Valid promo code!
          </p>
          <p class="text-sm mt-1" style="color: var(--color-success-700);">
            {validationResult.benefitText}
          </p>
          {#if validationResult.benefits.description}
            <p class="text-xs mt-1" style="color: var(--color-success-600);">
              {validationResult.benefits.description}
            </p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .promo-code-input input:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
  }
  
  .promo-code-input input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style> 