/**
 * Mobile keyboard detection store
 * Detects when the mobile keyboard is visible using multiple methods
 * and provides a reactive store to hide/show sticky bottom elements
 * 
 * Enhanced for iOS Safari to handle viewport issues and persistent gaps
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const isKeyboardVisible = writable(false);

if (browser) {
	let initialHeight = window.innerHeight;
	let isInputFocused = false;
	let lastKnownKeyboardState = false;
	let resetTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// iOS detection
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
	
	// Threshold: if viewport shrinks by more than this value, keyboard is likely open
	// Reduced for better iOS detection
	const KEYBOARD_THRESHOLD = isIOS ? 100 : 150;
	
	const checkKeyboard = () => {
		// Clear any pending reset timeout
		if (resetTimeout) {
			clearTimeout(resetTimeout);
			resetTimeout = null;
		}
		
		// Method 1: Visual Viewport API (most reliable for modern browsers)
		if (window.visualViewport) {
			const viewportHeight = window.visualViewport.height;
			const windowHeight = window.innerHeight;
			const heightDiff = windowHeight - viewportHeight;
			
			// iOS Safari specific: also check if viewport is at the top
			// When keyboard closes, sometimes viewport doesn't reset properly
			const viewportOffset = window.visualViewport.offsetTop || 0;
			
			// Keyboard is open if:
			// 1. Viewport is significantly smaller
			// 2. An input is focused OR we previously detected keyboard was open
			// 3. For iOS: viewport offset is significant
			const keyboardOpen = (heightDiff > KEYBOARD_THRESHOLD || viewportOffset > 50) && 
								(isInputFocused || lastKnownKeyboardState);
			
			// Update keyboard visibility state
			isKeyboardVisible.set(keyboardOpen);
			
			lastKnownKeyboardState = keyboardOpen;
			return;
		}
		
		// Method 2: Fallback - compare current window height to initial
		const currentHeight = window.innerHeight;
		const heightDiff = initialHeight - currentHeight;
		const keyboardOpen = heightDiff > KEYBOARD_THRESHOLD && isInputFocused;
		
		isKeyboardVisible.set(keyboardOpen);
		lastKnownKeyboardState = keyboardOpen;
	};
	
	// Store original body styles
	let originalBodyPosition = '';
	let originalBodyTop = '';
	let originalBodyOverflow = '';
	
	// Track input focus state
	const handleFocusIn = (e: FocusEvent) => {
		const target = e.target as HTMLElement;
		if (target && (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT' ||
			target.isContentEditable
		)) {
			isInputFocused = true;
			
			// Apply iOS-specific body fix when keyboard opens
			if (isIOS) {
				// Store current scroll position
				const scrollY = window.scrollY;
				originalBodyPosition = document.body.style.position;
				originalBodyTop = document.body.style.top;
				
				// Fix body position to prevent viewport expansion
				document.body.style.position = 'fixed';
				document.body.style.top = `-${scrollY}px`;
				document.body.style.width = '100%';
			} else {
				// For other browsers, just prevent scrolling
				originalBodyOverflow = document.body.style.overflow;
				document.body.style.overflow = 'hidden';
			}
			
			// Small delay to let keyboard animation start
			setTimeout(checkKeyboard, 100);
		}
	};
	
	const handleFocusOut = () => {
		isInputFocused = false;
		
		// Restore body styles when keyboard closes
		if (isIOS) {
			// Get the scroll position from the fixed top value
			const scrollY = parseInt(document.body.style.top || '0') * -1;
			
			// Restore original position
			document.body.style.position = originalBodyPosition;
			document.body.style.top = originalBodyTop;
			document.body.style.width = '';
			
			// Restore scroll position
			window.scrollTo(0, scrollY);
		} else {
			// Restore overflow for other browsers
			document.body.style.overflow = originalBodyOverflow;
		}
		
		// Longer delay for iOS to ensure keyboard is fully closed
		setTimeout(checkKeyboard, isIOS ? 350 : 100);
		
		// iOS Safari fix: Additional check to ensure proper reset
		if (isIOS) {
			setTimeout(checkKeyboard, 600);
		}
	};
	
	// iOS Safari specific: Handle viewport scroll events
	const handleScroll = () => {
		if (isIOS && window.visualViewport) {
			checkKeyboard();
		}
	};
	
	// Listen to focus events
	document.addEventListener('focusin', handleFocusIn);
	document.addEventListener('focusout', handleFocusOut);
	
	// Listen to viewport changes
	if (window.visualViewport) {
		window.visualViewport.addEventListener('resize', checkKeyboard);
		window.visualViewport.addEventListener('scroll', handleScroll);
	} else {
		window.addEventListener('resize', checkKeyboard);
	}
	
	// Update initial height on orientation change
	window.addEventListener('orientationchange', () => {
		setTimeout(() => {
			initialHeight = window.innerHeight;
			// Reset keyboard state on orientation change
			isKeyboardVisible.set(false);
			lastKnownKeyboardState = false;
			checkKeyboard();
		}, 100);
	});
	
	// Cleanup function to restore body styles if needed
	const cleanup = () => {
		if (isIOS && document.body.style.position === 'fixed') {
			const scrollY = parseInt(document.body.style.top || '0') * -1;
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			window.scrollTo(0, scrollY);
		} else if (originalBodyOverflow) {
			document.body.style.overflow = originalBodyOverflow;
		}
		isKeyboardVisible.set(false);
		lastKnownKeyboardState = false;
	};
	
	// Clean up on page unload
	window.addEventListener('beforeunload', cleanup);
}

