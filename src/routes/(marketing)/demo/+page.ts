export const load = async () => {
    // Return empty data - all demo data handled client-side
    return {};
};

// Disable SSR to prevent 502 errors on refresh
export const ssr = false; 