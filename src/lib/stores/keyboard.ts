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
			
			// If keyboard state changed from open to closed
			if (lastKnownKeyboardState && !keyboardOpen && !isInputFocused) {
				// iOS Safari fix: Force reset after keyboard closes
				if (isIOS) {
					// Immediate hide
					isKeyboardVisible.set(false);
					
					// Force viewport reset
					if (window.visualViewport) {
						// Scroll to top temporarily to reset viewport
						const currentScroll = window.scrollY;
						window.scrollTo(0, 0);
						setTimeout(() => {
							window.scrollTo(0, currentScroll);
						}, 10);
					}
					
					// Force layout recalculation
					resetTimeout = setTimeout(() => {
						// Trigger resize event to force Safari to recalculate
						window.dispatchEvent(new Event('resize'));
						
						// Additional reset attempt
						if (window.visualViewport && window.visualViewport.height < window.innerHeight) {
							// Force another check if viewport is still wrong
							isKeyboardVisible.set(false);
							document.body.style.position = 'fixed';
							document.body.style.width = '100%';
							setTimeout(() => {
								document.body.style.position = '';
								document.body.style.width = '';
							}, 100);
						}
					}, 350);
				}
			} else {
				isKeyboardVisible.set(keyboardOpen);
			}
			
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
			// Small delay to let keyboard animation start
			setTimeout(checkKeyboard, 100);
		}
	};
	
	const handleFocusOut = () => {
		isInputFocused = false;
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
	
	// iOS Safari: Periodic check to ensure proper state
	if (isIOS) {
		let checkInterval = setInterval(() => {
			// If no input is focused but keyboard was detected as open
			if (!isInputFocused && lastKnownKeyboardState) {
				checkKeyboard();
			}
			
			// Also check if visual viewport is in incorrect state
			if (!isInputFocused && window.visualViewport) {
				const viewportHeight = window.visualViewport.height;
				const windowHeight = window.innerHeight;
				
				// If there's still a significant difference without input focus
				if (Math.abs(windowHeight - viewportHeight) > 50) {
					isKeyboardVisible.set(false);
					lastKnownKeyboardState = false;
					// Force viewport reset
					window.scrollTo(0, window.scrollY + 1);
					setTimeout(() => {
						window.scrollTo(0, window.scrollY - 1);
					}, 50);
				}
			}
		}, 500);
		
		// Clean up interval on page unload
		window.addEventListener('beforeunload', () => {
			clearInterval(checkInterval);
		});
	}
}

