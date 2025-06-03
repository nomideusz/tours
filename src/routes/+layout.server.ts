import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Root layout is minimal - individual layout groups handle their own auth logic
  // This allows us to have different auth behaviors for public vs app routes
  console.log('Root layout server load - minimal processing for:', url.pathname);
  
  return {};
}; 