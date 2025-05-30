import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: { 
		adapter: adapter({
			// Ensure the adapter uses the PORT environment variable
			env: {
				port: 'PORT'
			}
		})
	}
};

export default config;
