/**
 * Touch Support & Haptic Feedback Utility
 * Provides comprehensive touch, haptic, and audio feedback for mobile devices
 */

// ============================================================================
// Haptic Feedback
// ============================================================================

export const haptic = {
  // Light tap feedback
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  // Medium feedback for button presses
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  // Strong feedback for important actions
  strong: () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  },

  // Success pattern
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  // Error pattern
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50, 100, 50]);
    }
  },

  // Warning pattern
  warning: () => {
    if (navigator.vibrate) {
      navigator.vibrate([40, 80, 40]);
    }
  },

  // Selection pattern
  select: () => {
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  },

  // Long press pattern
  longPress: () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }
};

// ============================================================================
// Sound Effects
// ============================================================================

class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    this.audioContext = null;
    this._contextInitialized = false;
    
    // Sound is OFF by default — only enabled if user explicitly turned it on
    const soundPreference = localStorage.getItem('sound_enabled');
    this.enabled = soundPreference === 'true';
    
    // Do NOT create AudioContext here - browsers block it before a user gesture.
    // It will be created lazily on first generateBeep() call.
  }
  
  // Initialize AudioContext lazily (only after a user gesture)
  initAudioContext() {
    if (this._contextInitialized) return;
    this._contextInitialized = true;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('AudioContext initialization failed:', error);
      this.audioContext = null;
    }
  }

  // Load sound file
  loadSound(name, url) {
    try {
      this.sounds[name] = new Audio(url);
      this.sounds[name].volume = this.volume;
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  // Play sound
  play(name) {
    if (!this.enabled || !this.sounds[name]) return;
    
    try {
      // Clone audio to allow multiple simultaneous plays
      const sound = this.sounds[name].cloneNode();
      sound.volume = this.volume;
      sound.play().catch(err => console.warn('Sound play failed:', err));
    } catch (error) {
      console.warn(`Failed to play sound: ${name}`, error);
    }
  }

  // Toggle sounds on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('sound_enabled', this.enabled);
    return this.enabled;
  }

  // Set volume (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }

  // Generate simple beep sounds using Web Audio API
  generateBeep(frequency = 440, duration = 100) {
    if (!this.enabled) return;
    if (!this.audioContext) {
      this.initAudioContext();
      if (!this.audioContext) return; // Still failed, give up
    }

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => console.warn('AudioContext resume failed:', err));
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(this.volume * 0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
      
      // Clean up oscillator after it's done
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.warn('Beep generation failed:', error);
    }
  }
}

export const sounds = new SoundManager();

// Pre-generate common sounds
export const playSound = {
  tap: () => sounds.generateBeep(800, 50),
  click: () => sounds.generateBeep(600, 80),
  success: () => sounds.generateBeep(1000, 150),
  error: () => sounds.generateBeep(200, 200),
  notification: () => sounds.generateBeep(900, 100),
  select: () => sounds.generateBeep(700, 60),
  swipe: () => sounds.generateBeep(500, 40),
};

// ============================================================================
// Touch Gesture Detection
// ============================================================================

export class TouchGestureDetector {
  constructor(element, callbacks = {}) {
    this.element = element;
    this.callbacks = callbacks;
    this.touchStart = null;
    this.touchEnd = null;
    this.longPressTimer = null;
    this.minSwipeDistance = 50;
    this.longPressDuration = 500;

    this.init();
  }

  init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  handleTouchStart(e) {
    this.touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      if (this.callbacks.onLongPress) {
        haptic.longPress();
        this.callbacks.onLongPress(e);
      }
    }, this.longPressDuration);
  }

  handleTouchMove(e) {
    // Cancel long press if user moves finger
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.touchStart) return;

    this.touchEnd = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }

  handleTouchEnd(e) {
    // Cancel long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.touchStart) return;

    if (!this.touchEnd) {
      this.touchEnd = this.touchStart;
    }

    const deltaX = this.touchEnd.x - this.touchStart.x;
    const deltaY = this.touchEnd.y - this.touchStart.y;
    const duration = Date.now() - this.touchStart.time;

    // Detect swipe
    if (Math.abs(deltaX) > this.minSwipeDistance || Math.abs(deltaY) > this.minSwipeDistance) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      
      if (this.callbacks.onSwipe) {
        haptic.light();
        playSound.swipe();
        this.callbacks.onSwipe(direction, { deltaX, deltaY, duration });
      }
    } else {
      // Regular tap
      if (this.callbacks.onTap) {
        haptic.light();
        playSound.tap();
        this.callbacks.onTap(e);
      }
    }

    this.touchStart = null;
    this.touchEnd = null;
  }

  getSwipeDirection(deltaX, deltaY) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }
}

// ============================================================================
// Touch-Optimized Component Wrapper
// ============================================================================

export const useTouchFeedback = (callback, feedbackType = 'medium') => {
  return (e) => {
    // Provide haptic feedback
    if (haptic[feedbackType]) {
      haptic[feedbackType]();
    }

    // Provide audio feedback
    if (feedbackType === 'success') {
      playSound.success();
    } else if (feedbackType === 'error') {
      playSound.error();
    } else {
      playSound.click();
    }

    // Execute callback
    if (callback) {
      callback(e);
    }
  };
};

// ============================================================================
// Touch Target Size Validator
// ============================================================================

export const validateTouchTarget = (element) => {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // WCAG 2.5.5 minimum touch target size

  const isValid = rect.width >= minSize && rect.height >= minSize;

  if (!isValid) {
    console.warn(
      `Touch target too small: ${rect.width}x${rect.height}px. ` +
      `Minimum recommended: ${minSize}x${minSize}px`,
      element
    );
  }

  return isValid;
};

// ============================================================================
// Pull-to-Refresh
// ============================================================================

export class PullToRefresh {
  constructor(element, onRefresh) {
    this.element = element;
    this.onRefresh = onRefresh;
    this.startY = 0;
    this.currentY = 0;
    this.dragging = false;
    this.threshold = 80;
    
    this.init();
  }

  init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleTouchStart(e) {
    // Only activate if at top of scroll
    if (this.element.scrollTop === 0) {
      this.startY = e.touches[0].clientY;
      this.dragging = true;
    }
  }

  handleTouchMove(e) {
    if (!this.dragging) return;

    this.currentY = e.touches[0].clientY;
    const pullDistance = this.currentY - this.startY;

    if (pullDistance > 0 && this.element.scrollTop === 0) {
      e.preventDefault();
      
      // Visual feedback (you can add a custom indicator)
      this.element.style.transform = `translateY(${Math.min(pullDistance * 0.5, this.threshold)}px)`;
    }
  }

  handleTouchEnd() {
    if (!this.dragging) return;

    const pullDistance = this.currentY - this.startY;

    if (pullDistance > this.threshold) {
      haptic.success();
      playSound.notification();
      
      if (this.onRefresh) {
        this.onRefresh();
      }
    }

    // Reset
    this.element.style.transform = '';
    this.dragging = false;
    this.startY = 0;
    this.currentY = 0;
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}

// ============================================================================
// Mobile Detection
// ============================================================================

export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// ============================================================================
// Touch Preferences
// ============================================================================

export const touchPreferences = {
  get hapticEnabled() {
    const pref = localStorage.getItem('haptic_enabled');
    return pref !== 'false';
  },

  set hapticEnabled(value) {
    localStorage.setItem('haptic_enabled', value);
  },

  get soundEnabled() {
    const pref = localStorage.getItem('sound_enabled');
    return pref !== 'false';
  },

  set soundEnabled(value) {
    localStorage.setItem('sound_enabled', value);
    sounds.enabled = value;
  },

  get gesturesEnabled() {
    const pref = localStorage.getItem('gestures_enabled');
    return pref !== 'false';
  },

  set gesturesEnabled(value) {
    localStorage.setItem('gestures_enabled', value);
  }
};

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  haptic,
  sounds,
  playSound,
  TouchGestureDetector,
  useTouchFeedback,
  validateTouchTarget,
  PullToRefresh,
  isTouchDevice,
  isMobileDevice,
  touchPreferences
};
