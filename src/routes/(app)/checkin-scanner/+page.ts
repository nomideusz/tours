export const load = async () => {
	// Return scanner configuration
	return {
		scannerConfig: {
			highlightScanRegion: true,
			highlightCodeOutline: true
		}
	};
};

// Disable SSR to prevent 502 errors on refresh
export const ssr = false; 