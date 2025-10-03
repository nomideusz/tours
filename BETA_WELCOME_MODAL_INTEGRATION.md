# Beta Welcome Modal Integration Guide

## Overview
The beta welcome modal (`BetaWelcomeModal.svelte`) replaces the standalone welcome page and provides a better onboarding experience for beta testers by showing a modal immediately after they log in for the first time.

## Component Location
`src/lib/components/BetaWelcomeModal.svelte`

## Integration Steps

### 1. Add to Dashboard or Main App Layout

Add the modal to your dashboard or main app layout where beta testers land after login:

```svelte
<script lang="ts">
  import BetaWelcomeModal from '$lib/components/BetaWelcomeModal.svelte';
  import { browser } from '$app/environment';
  
  let { data } = $props();
  
  // Check if user is a beta tester and hasn't seen the welcome modal
  let showBetaWelcome = $state(false);
  
  $effect(() => {
    if (browser && data.user?.earlyAccessMember) {
      // Check localStorage to see if they've seen the modal
      const hasSeenWelcome = localStorage.getItem('beta_welcome_seen');
      if (!hasSeenWelcome) {
        showBetaWelcome = true;
      }
    }
  });
  
  function handleCloseWelcome() {
    showBetaWelcome = false;
    // Mark as seen in localStorage
    if (browser) {
      localStorage.setItem('beta_welcome_seen', 'true');
    }
  }
</script>

{#if showBetaWelcome}
  <BetaWelcomeModal on:close={handleCloseWelcome} />
{/if}

<!-- Rest of your layout/dashboard -->
```

### 2. User Schema

The beta testers are identified by the `earlyAccessMember` field (camelCase in JavaScript):

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  earlyAccessMember?: boolean;  // Beta testers have this set to true
  // ... other fields
}
```

**Note:** In your database, the column is named `early_access_member` (snake_case), but your ORM converts it to `earlyAccessMember` (camelCase) in JavaScript.

### 3. Alternative: Show on First Dashboard Visit

If you want to show it specifically on the dashboard page:

**`src/routes/(app)/dashboard/+page.svelte`**

```svelte
<script lang="ts">
  import BetaWelcomeModal from '$lib/components/BetaWelcomeModal.svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  
  let { data } = $props();
  
  let showBetaWelcome = $state(false);
  
  $effect(() => {
    if (browser && data.user?.earlyAccessMember) {
      const hasSeenWelcome = localStorage.getItem('beta_welcome_seen');
      if (!hasSeenWelcome) {
        // Small delay for better UX
        setTimeout(() => {
          showBetaWelcome = true;
        }, 500);
      }
    }
  });
  
  function handleCloseWelcome() {
    showBetaWelcome = false;
    if (browser) {
      localStorage.setItem('beta_welcome_seen', 'true');
    }
  }
</script>

{#if showBetaWelcome}
  <BetaWelcomeModal on:close={handleCloseWelcome} />
{/if}

<!-- Dashboard content -->
<div class="dashboard">
  <!-- Your dashboard content -->
</div>
```

### 4. Optional: Add "Reset" Functionality for Testing

During development, you can add a way to reset the modal:

```javascript
// In browser console or dev tools:
localStorage.removeItem('beta_welcome_seen');
```

Or add a button in admin panel:

```svelte
{#if $currentUser?.role === 'admin'}
  <button onclick={() => {
    localStorage.removeItem('beta_welcome_seen');
    location.reload();
  }}>
    Reset Beta Welcome Modal
  </button>
{/if}
```

## Modal Features

The modal includes:

- **Beta Benefits**: Visual overview of what beta testers get
  - 12 months free
  - 30% lifetime discount
  - Direct influence on features
  - Extra rewards for feedback

- **How to Help**: Clear instructions on what's expected
  - Use Zaur for real tours
  - Share feedback
  - Answer weekly surveys

- **Rewards Info**: Gamified incentives
  - Critical bug: +2 months free
  - Implemented feature: +3 months free
  - User interview: +3 months free

- **Action Buttons**:
  - "Go to Dashboard"
  - "Create Your First Tour" (primary CTA)

## Styling

The modal uses your app's CSS variables:
- `--bg-primary` / `--bg-secondary`
- `--text-primary` / `--text-secondary`
- `--primary` / `--primary-light`
- `--border-primary`
- `--radius-lg` / `--radius-md`
- `--shadow-xl`

It's fully responsive and mobile-friendly.

## Accessibility

- Closes on `Escape` key press
- Proper ARIA labels
- Focus management
- Keyboard navigation support

## Tracking (Optional)

Consider adding analytics tracking:

```svelte
<script lang="ts">
  import { trackEvent } from '$lib/utils/analytics';
  
  function handleCloseWelcome() {
    trackEvent('beta_welcome_modal_closed');
    showBetaWelcome = false;
    localStorage.setItem('beta_welcome_seen', 'true');
  }
  
  function handleCreateTour() {
    trackEvent('beta_welcome_create_tour_clicked');
    // Modal handles navigation
  }
</script>

<BetaWelcomeModal 
  on:close={handleCloseWelcome}
/>
```

## Testing Checklist

- [ ] Modal appears for beta testers on first login
- [ ] Modal doesn't appear for non-beta users
- [ ] Modal doesn't appear again after being closed
- [ ] "Create Tour" button navigates correctly
- [ ] "Go to Dashboard" button works
- [ ] Close button works
- [ ] Escape key closes modal
- [ ] Clicking backdrop closes modal
- [ ] Mobile responsive design works
- [ ] All links are functional

## Notes

- The modal is one-time only (per browser/device)
- Uses localStorage for persistence
- Can be reset by clearing browser data
- Consider adding server-side tracking if you want to know who has seen it across devices

## Future Enhancements

Consider adding:
- Server-side persistence (database flag)
- "Don't show this again" checkbox
- Tour of key features
- Progress indicator for onboarding steps
- Personalized content based on tour type

