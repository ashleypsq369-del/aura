/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('accessibility_settings');
    const defaults = {
      highContrast: false,
      colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia, monochrome
      fontSize: 'medium', // small, medium, large, xlarge, xxlarge
      reducedMotion: false,
      screenReaderMode: false,
      voiceControl: false,
      keyboardOnly: false,
      largeTouch: false,
      simplifiedUI: false,
      assistedMode: false, // Master toggle for dementia/cognitive impairment support
      activePreset: null,  // Which condition preset is active
      focusMode: false,          // dims everything except focused element
      readingGuide: false,       // horizontal line follows cursor
      textSpacing: 'normal',     // 'normal' | 'relaxed' | 'wide'
      dyslexiaFont: false,       // uses OpenDyslexic-like font stack
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
  }, [settings]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Color blind / visual impairment mode
    root.classList.remove('cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia', 'cb-monochrome', 'cb-low_contrast', 'cb-photosensitive');
    if (settings.colorBlindMode && settings.colorBlindMode !== 'none') {
      root.classList.add(`cb-${settings.colorBlindMode}`);
      // Photosensitive also implies reduced motion
      if (settings.colorBlindMode === 'photosensitive') {
        root.classList.add('reduced-motion');
      }
    }

    // Font size
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-xlarge', 'text-xxlarge');
    root.classList.add(`text-${settings.fontSize}`);

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader mode
    if (settings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
      announceToScreenReader('Screen reader mode enabled');
    } else {
      root.classList.remove('screen-reader-mode');
    }

    // Large touch targets
    if (settings.largeTouch) {
      root.classList.add('large-touch');
    } else {
      root.classList.remove('large-touch');
    }

    // Simplified UI
    if (settings.simplifiedUI) {
      root.classList.add('simplified-ui');
    } else {
      root.classList.remove('simplified-ui');
    }

    // Assisted Mode (dementia / cognitive impairment support)
    if (settings.assistedMode) {
      root.classList.add('assisted-mode');
    } else {
      root.classList.remove('assisted-mode');
    }

    // Keyboard only mode
    if (settings.keyboardOnly) {
      root.classList.add('keyboard-only');
    } else {
      root.classList.remove('keyboard-only');
    }

    // Voice control active - clean up the CSS class when disabled
    if (!settings.voiceControl) {
      root.classList.remove('voice-control-active');
    }

    // Focus mode
    if (settings.focusMode) {
      root.classList.add('focus-mode');
    } else {
      root.classList.remove('focus-mode');
    }

    // Reading guide
    if (settings.readingGuide) {
      root.classList.add('reading-guide');
    } else {
      root.classList.remove('reading-guide');
    }

    // Text spacing
    root.classList.remove('spacing-normal', 'spacing-relaxed', 'spacing-wide');
    root.classList.add(`spacing-${settings.textSpacing || 'normal'}`);

    // Dyslexia font
    if (settings.dyslexiaFont) {
      root.classList.add('dyslexia-font');
    } else {
      root.classList.remove('dyslexia-font');
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Announce changes to screen readers
    const messages = {
      highContrast: value ? 'High contrast mode enabled' : 'High contrast mode disabled',
      colorBlindMode: value === 'none' ? 'Visual impairment filter removed' : `${value.replace(/_/g,' ')} filter enabled`,
      fontSize: `Font size set to ${value}`,
      reducedMotion: value ? 'Reduced motion enabled' : 'Reduced motion disabled',
      screenReaderMode: value ? 'Screen reader mode enabled' : 'Screen reader mode disabled',
      voiceControl: value ? 'Voice control enabled' : 'Voice control disabled',
      keyboardOnly: value ? 'Keyboard only mode enabled' : 'Keyboard only mode disabled',
      largeTouch: value ? 'Large touch targets enabled' : 'Large touch targets disabled',
      simplifiedUI: value ? 'Simplified interface enabled' : 'Simplified interface disabled',
      assistedMode: value ? 'Assisted mode enabled. Large text and simplified layout active.' : 'Assisted mode disabled.',
      focusMode: value ? 'Focus mode enabled' : 'Focus mode disabled',
      readingGuide: value ? 'Reading guide enabled' : 'Reading guide disabled',
      textSpacing: `Text spacing set to ${value}`,
      dyslexiaFont: value ? 'Dyslexia font enabled' : 'Dyslexia font disabled',
    };

    if (messages[key]) {
      announceToScreenReader(messages[key]);
    }
  };

  // Enable assisted mode: turns on all settings that help cognitively/physically impaired patients
  const enableAssistedMode = () => {
    setSettings(prev => ({
      ...prev,
      assistedMode: true,
      fontSize: 'xlarge',   // Comfortable large - not xxlarge which Tailwind fights
      largeTouch: true,
      simplifiedUI: false,  // Do NOT enable simplifiedUI - it strips colours
      reducedMotion: true,
      highContrast: false,
    }));
    announceToScreenReader('Assisted mode enabled. Large text and large buttons are now active.');
    if (window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance('Assisted mode is now on. The app has been simplified for easier use.');
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  };

  // Apply a condition preset atomically — resets all to defaults first, then applies preset
  const applyPreset = (presetId, presetSettings) => {
    const PRESET_DEFAULTS = {
      highContrast: false, colorBlindMode: 'none', fontSize: 'medium',
      reducedMotion: false, screenReaderMode: false, voiceControl: false,
      keyboardOnly: false, largeTouch: false, simplifiedUI: false,
      dyslexiaFont: false, textSpacing: 'normal', focusMode: false, readingGuide: false,
    };
    setSettings(prev => ({
      ...prev,
      ...PRESET_DEFAULTS,        // reset all toggleable settings
      assistedMode: true,         // always on for any preset
      activePreset: presetId,
      ...presetSettings,          // apply only this preset's overrides
    }));
  };
  const disableAssistedMode = () => {
    setSettings(prev => ({
      ...prev,
      assistedMode: false,
      activePreset: null,
      fontSize: 'medium',
      largeTouch: false,
      simplifiedUI: false,
      reducedMotion: false,
      highContrast: false,
      dyslexiaFont: false,
      textSpacing: 'normal',
      focusMode: false,
    }));
    // Also clean up body::before from focus mode
    document.documentElement.classList.remove(
      'focus-mode', 'dyslexia-font',
      'spacing-relaxed', 'spacing-wide',
    );
    announceToScreenReader('Assisted mode disabled. Normal layout restored.');
  };

  const resetSettings = () => {
    const defaults = {
      highContrast: false,
      colorBlindMode: 'none',
      fontSize: 'medium',
      reducedMotion: false,
      screenReaderMode: false,
      voiceControl: false,
      keyboardOnly: false,
      largeTouch: false,
      simplifiedUI: false,
      assistedMode: false,
      activePreset: null,
      focusMode: false,
      readingGuide: false,
      textSpacing: 'normal',
      dyslexiaFont: false,
    };
    setSettings(defaults);
    announceToScreenReader('Accessibility settings reset to defaults');
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings, enableAssistedMode, disableAssistedMode, applyPreset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Utility function to announce to screen readers - always invisible
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  // Force it to be visually hidden regardless of any CSS rules
  announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;background:none;';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}
