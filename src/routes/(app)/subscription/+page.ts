import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const response = await fetch('/api/subscriptions/usage');
    if (response.ok) {
      const usage = await response.json();
      return {
        usage
      };
    }
  } catch (error) {
    console.error('Failed to fetch subscription usage:', error);
  }
  
  return {
    usage: null
  };
}; 