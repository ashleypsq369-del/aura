/**
 * React Hook for Touch Support, Haptics, and Sound Feedback
 * Auto-initializes touch features for the entire app
 */

import { useEffect, useRef } from 'react';
import { haptic, playSound, sounds } from '../utils/touchSupport';

/**
 * Hook to enable touch, haptic, and sound feedback throughout the app
 * Call once in App.jsx to enable globally
 */
export function useTouchSupport() {
 useEffect(() => {
 console.log('🎯 Initializing Touch Support...');

 // Load user preferences - sound is OFF by default, only on if user explicitly enabled it
 const hapticEnabled = localStorage.getItem('touch_haptic_enabled') === 'true';
 const soundEnabled = localStorage.getItem('touch_sound_enabled') === 'true';

 console.log('📳 Haptic feedback:', hapticEnabled ? 'enabled' : 'disabled');
 console.log('🔊 Sound effects:', soundEnabled ? 'enabled' : 'disabled');

 // Add global touch event listeners for all interactive elements
 const addTouchFeedback = () => {
 // Select all interactive elements
 const interactiveElements = document.querySelectorAll(
 'button, a, input, textarea, select, [role="button"], [role="link"], .clickable'
 );

 interactiveElements.forEach(element => {
 // Skip if already has touch feedback
 if (element.dataset.touchEnabled) return;
 element.dataset.touchEnabled = 'true';

 // Add touch feedback on tap/click
 const handleInteraction = () => {
 // Check preferences - sound off by default
 const hapticEnabled = localStorage.getItem('touch_haptic_enabled') === 'true';
 const soundEnabled = localStorage.getItem('touch_sound_enabled') === 'true';

 // Determine feedback type based on element
 if (element.type === 'submit' || element.classList.contains('btn-primary')) {
 if (hapticEnabled) haptic.medium();
 if (soundEnabled) playSound.click();
 } else if (element.classList.contains('btn-danger') || element.classList.contains('text-red-500')) {
 if (hapticEnabled) haptic.warning();
 if (soundEnabled) playSound.error();
 } else if (element.classList.contains('btn-success') || element.classList.contains('text-green-500')) {
 if (hapticEnabled) haptic.success();
 if (soundEnabled) playSound.success();
 } else {
 // Default light feedback
 if (hapticEnabled) haptic.light();
 if (soundEnabled) playSound.tap();
 }
 };

 // Listen to both touch and click for cross-platform support
 element.addEventListener('touchstart', handleInteraction, { passive: true });
 element.addEventListener('click', handleInteraction, { passive: true });
 });
 };

 // Initial setup
 addTouchFeedback();

 // Re-run when DOM changes (for dynamically added elements)
 const observer = new MutationObserver(() => {
 addTouchFeedback();
 });

 observer.observe(document.body, {
 childList: true,
 subtree: true
 });

 // Add pull-to-refresh on touch screens
 let touchStartY = 0;
 let pulling = false;

 const handleTouchStart = (e) => {
 touchStartY = e.touches[0].clientY;
 };

 const handleTouchMove = (e) => {
 const touchY = e.touches[0].clientY;
 const pullDistance = touchY - touchStartY;

 // Check if user is at top of page and pulling down
 if (window.scrollY === 0 && pullDistance > 0) {
 pulling = true;
 
 // Visual feedback at threshold
 if (pullDistance > 100 && !e.target.closest('.no-pull-refresh')) {
 const hapticEnabled = localStorage.getItem('touch_haptic_enabled') !== 'false';
 if (hapticEnabled) haptic.light();
 }
 }
 };

 const handleTouchEnd = (e) => {
 if (pulling) {
 const touchY = e.changedTouches[0].clientY;
 const pullDistance = touchY - touchStartY;

 // Trigger refresh if pulled far enough
 if (pullDistance > 150 && !e.target.closest('.no-pull-refresh')) {
 const hapticEnabled = localStorage.getItem('touch_haptic_enabled') === 'true';
 const soundEnabled = localStorage.getItem('touch_sound_enabled') === 'true';
 
 if (hapticEnabled) haptic.success();
 if (soundEnabled) playSound.notification();
 
 // Reload page
 window.location.reload();
 }
 }
 
 pulling = false;
 };

 // Add pull-to-refresh listeners
 document.addEventListener('touchstart', handleTouchStart, { passive: true });
 document.addEventListener('touchmove', handleTouchMove, { passive: true });
 document.addEventListener('touchend', handleTouchEnd, { passive: true });

 console.log('✅ Touch Support initialized');

 // Cleanup
 return () => {
 observer.disconnect();
 document.removeEventListener('touchstart', handleTouchStart);
 document.removeEventListener('touchmove', handleTouchMove);
 document.removeEventListener('touchend', handleTouchEnd);
 };
 }, []);

 // Return utilities for manual use
 return {
 haptic,
 playSound,
 sounds
 };
}

/**
 * Hook for adding touch gestures to specific elements
 * Usage: const ref = useTouchGestures({ onSwipe, onLongPress, onTap })
 */
export function useTouchGestures(callbacks = {}) {
 const elementRef = useRef(null);

 useEffect(() => {
 if (!elementRef.current) return;

 let touchStart = null;
 let touchEnd = null;
 let longPressTimer = null;
 const minSwipeDistance = 50;
 const longPressDuration = 500;

 const handleTouchStart = (e) => {
 touchStart = {
 x: e.touches[0].clientX,
 y: e.touches[0].clientY,
 time: Date.now()
 };

 // Start long press timer
 longPressTimer = setTimeout(() => {
 if (callbacks.onLongPress) {
 const hapticEnabled = localStorage.getItem('touch_haptic_enabled') !== 'false';
 if (hapticEnabled) haptic.longPress();
 callbacks.onLongPress(e);
 }
 }, longPressDuration);
 };

 const handleTouchMove = (e) => {
 // Cancel long press if user moves finger
 if (longPressTimer) {
 clearTimeout(longPressTimer);
 longPressTimer = null;
 }

 if (!touchStart) return;

 touchEnd = {
 x: e.touches[0].clientX,
 y: e.touches[0].clientY
 };
 };

 const handleTouchEnd = (e) => {
 // Cancel long press timer
 if (longPressTimer) {
 clearTimeout(longPressTimer);
 longPressTimer = null;
 }

 if (!touchStart) return;
 if (!touchEnd) touchEnd = touchStart;

 const deltaX = touchEnd.x - touchStart.x;
 const deltaY = touchEnd.y - touchStart.y;

 // Detect swipe
 if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
 const direction = Math.abs(deltaX) > Math.abs(deltaY)
 ? (deltaX > 0 ? 'right' : 'left')
 : (deltaY > 0 ? 'down' : 'up');

 if (callbacks.onSwipe) {
 const hapticEnabled = localStorage.getItem('touch_haptic_enabled') !== 'false';
 const soundEnabled = localStorage.getItem('touch_sound_enabled') !== 'false';
 
 if (hapticEnabled) haptic.light();
 if (soundEnabled) playSound.swipe();
 
 callbacks.onSwipe(direction, { deltaX, deltaY });
 }
 } else {
 // Regular tap
 if (callbacks.onTap) {
 const hapticEnabled = localStorage.getItem('touch_haptic_enabled') !== 'false';
 const soundEnabled = localStorage.getItem('touch_sound_enabled') !== 'false';
 
 if (hapticEnabled) haptic.light();
 if (soundEnabled) playSound.tap();
 
 callbacks.onTap(e);
 }
 }

 touchStart = null;
 touchEnd = null;
 };

 const element = elementRef.current;
 element.addEventListener('touchstart', handleTouchStart, { passive: true });
 element.addEventListener('touchmove', handleTouchMove, { passive: true });
 element.addEventListener('touchend', handleTouchEnd, { passive: true });

 return () => {
 element.removeEventListener('touchstart', handleTouchStart);
 element.removeEventListener('touchmove', handleTouchMove);
 element.removeEventListener('touchend', handleTouchEnd);
 if (longPressTimer) clearTimeout(longPressTimer);
 };
 }, [callbacks]);

 return elementRef;
}

export default useTouchSupport;
