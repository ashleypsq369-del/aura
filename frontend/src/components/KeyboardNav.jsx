import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';

const FONT_SIZES = ['small', 'medium', 'large', 'xlarge', 'xxlarge'];

/**
 * KeyboardNav Component
 * Provides skip navigation links and keyboard shortcuts for accessibility
 */
export default function KeyboardNav() {
 const navigate = useNavigate();
 const { settings, updateSetting } = useAccessibility();

 // Focus main content
 const focusMainContent = () => {
 const mainContent = document.getElementById('main-content') || 
 document.querySelector('main') ||
 document.querySelector('[role="main"]');
 if (mainContent) {
 mainContent.setAttribute('tabindex', '-1');
 mainContent.focus();
 }
 };

 // Focus navigation
 const focusNavigation = () => {
 const nav = document.getElementById('main-nav') || 
 document.querySelector('nav') ||
 document.querySelector('[role="navigation"]');
 if (nav) {
 const firstLink = nav.querySelector('a, button');
 if (firstLink) {
 firstLink.focus();
 }
 }
 };

 // Focus search
 const focusSearch = () => {
 const search = document.getElementById('search') || 
 document.querySelector('[type="search"]') ||
 document.querySelector('[role="search"] input');
 if (search) {
 search.focus();
 }
 };

 useEffect(() => {
 const handleKeyDown = (e) => {
 // Only process if keyboard-only mode is enabled or Alt key is pressed
 if (!settings.keyboardOnly && !e.altKey) return;

 // Skip navigation shortcuts (Alt + number)
 if (e.altKey && !e.ctrlKey && !e.shiftKey) {
 switch (e.key) {
 case '1':
 e.preventDefault();
 focusMainContent();
 announceToScreenReader('Jumped to main content');
 break;
 case '2':
 e.preventDefault();
 focusNavigation();
 announceToScreenReader('Jumped to navigation');
 break;
 case '3':
 e.preventDefault();
 focusSearch();
 announceToScreenReader('Jumped to search');
 break;
 case 'h':
 case 'H':
 e.preventDefault();
 navigate('/');
 announceToScreenReader('Navigating to home');
 break;
 case 'm':
 case 'M':
 e.preventDefault();
 navigate('/messages');
 announceToScreenReader('Navigating to messages');
 break;
 case 'p':
 case 'P':
 e.preventDefault();
 navigate('/patients');
 announceToScreenReader('Navigating to patients');
 break;
 case 'a':
 case 'A':
 e.preventDefault();
 navigate('/alerts');
 announceToScreenReader('Navigating to alerts');
 break;
 case 'd':
 case 'D':
 e.preventDefault();
 navigate('/dashboard');
 announceToScreenReader('Navigating to dashboard');
 break;
 case 'n':
 case 'N':
 e.preventDefault();
 navigate('/notifications');
 announceToScreenReader('Navigating to notifications');
 break;
 case 'c':
 case 'C':
 e.preventDefault();
 navigate('/care-settings');
 announceToScreenReader('Navigating to care settings');
 break;
 case 's':
 case 'S':
 e.preventDefault();
 navigate('/settings');
 announceToScreenReader('Navigating to settings');
 break;
 case 'v':
 case 'V':
 e.preventDefault();
 updateSetting('voiceControl', !settings.voiceControl);
 announceToScreenReader(settings.voiceControl ? 'Voice control disabled' : 'Voice control enabled');
 break;
 case 'f':
 case 'F':
 e.preventDefault();
 updateSetting('focusMode', !settings.focusMode);
 announceToScreenReader(settings.focusMode ? 'Focus mode disabled' : 'Focus mode enabled');
 break;
 case '+':
 case '=': {
 e.preventDefault();
 const currentUp = FONT_SIZES.indexOf(settings.fontSize);
 const nextUp = Math.min(currentUp + 1, FONT_SIZES.length - 1);
 updateSetting('fontSize', FONT_SIZES[nextUp]);
 announceToScreenReader(`Font size increased to ${FONT_SIZES[nextUp]}`);
 break;
 }
 case '-': {
 e.preventDefault();
 const currentDown = FONT_SIZES.indexOf(settings.fontSize);
 const nextDown = Math.max(currentDown - 1, 0);
 updateSetting('fontSize', FONT_SIZES[nextDown]);
 announceToScreenReader(`Font size decreased to ${FONT_SIZES[nextDown]}`);
 break;
 }
 default:
 break;
 }
 }

 // Escape key to close modals/dialogs
 if (e.key === 'Escape') {
 const dialog = document.querySelector('[role="dialog"]');
 const modal = document.querySelector('[aria-modal="true"]');
 if (dialog || modal) {
 const closeButton = (dialog || modal).querySelector('[aria-label*="close" i], [aria-label*="cancel" i]');
 if (closeButton) {
 closeButton.click();
 announceToScreenReader('Dialog closed');
 }
 }
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [navigate, settings.keyboardOnly, settings.voiceControl, settings.focusMode, settings.fontSize, updateSetting]);

 // Reading Guide effect - injects a div that follows the mouse
 useEffect(() => {
 if (!settings.readingGuide) return;

 const line = document.createElement('div');
 line.className = 'reading-guide-line';
 document.body.appendChild(line);

 const handleMouseMove = (e) => {
 line.style.top = `${e.clientY - 16}px`;
 };

 window.addEventListener('mousemove', handleMouseMove);

 return () => {
 window.removeEventListener('mousemove', handleMouseMove);
 if (document.body.contains(line)) {
 document.body.removeChild(line);
 }
 };
 }, [settings.readingGuide]);

 return (
 <>
 {/* Skip Navigation Links - Hidden until focused */}
 <div className="sr-only-focusable">
 <a
 href="#main-content"
 className="skip-link"
 onClick={(e) => {
 e.preventDefault();
 focusMainContent();
 }}
 >
 Skip to main content
 </a>
 <a
 href="#main-nav"
 className="skip-link"
 onClick={(e) => {
 e.preventDefault();
 focusNavigation();
 }}
 >
 Skip to navigation
 </a>
 {settings.keyboardOnly && (
 <div
 className="keyboard-help"
 role="region"
 aria-label="Keyboard shortcuts information"
 >
 <p className="text-sm">
 Press <kbd>Alt + 1</kbd> for main content, 
 <kbd>Alt + 2</kbd> for navigation, 
 <kbd>Alt + H</kbd> for home
 </p>
 </div>
 )}
 </div>

 {/* Focus Trap Styles - Injected dynamically */}
 <style>{`
 /* Skip links - visible when focused */
 .sr-only-focusable {
 position: absolute;
 top: 0;
 left: 0;
 z-index: 9999;
 }

 .skip-link {
 position: absolute;
 left: -9999px;
 top: 0;
 z-index: 9999;
 padding: 1rem 1.5rem;
 background: var(--color-primary);
 color: white;
 text-decoration: none;
 font-weight: 600;
 border-radius: 0 0 8px 0;
 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
 }

 .skip-link:focus {
 left: 0;
 outline: 4px solid white;
 outline-offset: 2px;
 }

 .keyboard-help {
 position: absolute;
 left: -9999px;
 top: 3rem;
 background: white;
 padding: 0.75rem 1rem;
 border: 2px solid var(--color-primary);
 border-radius: 8px;
 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
 }

 .keyboard-help:focus-within {
 left: 0;
 }

 .keyboard-help kbd {
 display: inline-block;
 padding: 0.125rem 0.375rem;
 font-size: 0.875rem;
 font-family: monospace;
 background: var(--color-bg-secondary);
 border: 1px solid var(--color-border-medium);
 border-radius: 4px;
 margin: 0 0.125rem;
 }

 /* Enhanced focus indicators for keyboard-only mode */
 .keyboard-only *:focus {
 outline: 3px solid var(--color-primary) !important;
 outline-offset: 2px !important;
 box-shadow: 0 0 0 4px rgba(13, 115, 119, 0.2) !important;
 }

 .keyboard-only button:focus,
 .keyboard-only a:focus,
 .keyboard-only input:focus,
 .keyboard-only textarea:focus,
 .keyboard-only select:focus {
 outline: 3px solid var(--color-primary) !important;
 outline-offset: 2px !important;
 }

 /* Focus visible - show focus only for keyboard users */
 :focus-visible {
 outline: 3px solid var(--color-primary);
 outline-offset: 2px;
 }

 /* Remove focus for mouse users (but keep for keyboard) */
 :focus:not(:focus-visible) {
 outline: none;
 }
 `}</style>
 </>
 );
}

// Utility function to announce to screen readers
function announceToScreenReader(message) {
 const announcement = document.createElement('div');
 announcement.setAttribute('role', 'status');
 announcement.setAttribute('aria-live', 'polite');
 announcement.setAttribute('aria-atomic', 'true');
 announcement.className = 'sr-only';
 announcement.textContent = message;
 
 document.body.appendChild(announcement);
 
 setTimeout(() => {
 document.body.removeChild(announcement);
 }, 1000);
}
