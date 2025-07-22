import puppeteer, { type Browser, type PuppeteerLaunchOptions } from 'puppeteer';

let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
	// If we already have a browser instance, reuse it
	if (browserInstance && browserInstance.connected) {
		return browserInstance;
	}

	// If a launch is already in progress, wait for it
	if (browserLaunchPromise) {
		return browserLaunchPromise;
	}

	// Launch a new browser instance
	browserLaunchPromise = launchBrowser();
	
	try {
		browserInstance = await browserLaunchPromise;
		return browserInstance;
	} finally {
		browserLaunchPromise = null;
	}
}

async function launchBrowser(): Promise<Browser> {
	const isProduction = process.env.NODE_ENV === 'production';
	
	const options: PuppeteerLaunchOptions = {
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-accelerated-2d-canvas',
			'--no-first-run',
			'--no-zygote',
			'--disable-gpu',
			'--disable-extensions',
			'--disable-background-networking',
			'--disable-background-timer-throttling',
			'--disable-backgrounding-occluded-windows',
			'--disable-breakpad',
			'--disable-client-side-phishing-detection',
			'--disable-component-extensions-with-background-pages',
			'--disable-default-apps',
			'--disable-features=TranslateUI',
			'--disable-hang-monitor',
			'--disable-ipc-flooding-protection',
			'--disable-popup-blocking',
			'--disable-prompt-on-repost',
			'--disable-renderer-backgrounding',
			'--disable-sync',
			'--metrics-recording-only',
			'--mute-audio',
			'--no-default-browser-check',
			'--safebrowsing-disable-auto-update',
			'--enable-automation',
			'--password-store=basic',
			'--use-mock-keychain'
		]
	};

	// Use system Chrome in production
	if (isProduction && process.env.PUPPETEER_EXECUTABLE_PATH) {
		options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
	}

	// Add timeout for browser launch
	const browser = await Promise.race([
		puppeteer.launch(options),
		new Promise<never>((_, reject) => 
			setTimeout(() => reject(new Error('Browser launch timeout after 30 seconds')), 30000)
		)
	]);

	// Set up cleanup on browser disconnect
	browser.on('disconnected', () => {
		if (browserInstance === browser) {
			browserInstance = null;
		}
	});

	return browser;
}

export async function closeBrowser(): Promise<void> {
	if (browserInstance) {
		try {
			await browserInstance.close();
		} catch (error) {
			console.error('Error closing browser:', error);
		} finally {
			browserInstance = null;
		}
	}
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
	process.on('SIGINT', closeBrowser);
	process.on('SIGTERM', closeBrowser);
	process.on('exit', closeBrowser);
} 