/**
 * Voice Control Service for ProjectAura
 * Enables hands-free navigation and control for users with motor impairments
 * Supports voice commands for navigation, form control, and common actions
 */

class VoiceControlService {
  constructor() {
    // Check browser support
    this.isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.synthesis = window.speechSynthesis;
      
      // Configure recognition
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
    
    this.isListening = false;
    this.callbacks = [];
    this.navigate = null; // Will be set by the component using this service
  }

  /**
   * Initialize voice control with navigation function
   */
  initialize(navigateFunction) {
    if (!this.isSupported) {
      console.warn('Voice control is not supported in this browser');
      return false;
    }
    
    this.navigate = navigateFunction;
    
    // Set up event handlers
    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      console.log('Voice command received:', command);
      this.processCommand(command);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        this.speak('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        this.speak('Microphone access denied. Please enable microphone permissions.');
      }
    };

    this.recognition.onend = () => {
      // Restart if we're supposed to be listening
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    return true;
  }

  /**
   * Start listening for voice commands
   */
  startListening() {
    if (!this.isSupported || this.isListening) {
      console.log('Voice control already listening or not supported');
      return this.isListening;
    }
    
    try {
      this.recognition.start();
      this.isListening = true;
      this.speak('Voice control activated. Say "help" for available commands.');
      console.log('✅ Voice control started listening');
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening() {
    if (!this.isSupported || !this.isListening) return;
    
    try {
      this.recognition.stop();
      this.isListening = false;
      this.speak('Voice control deactivated');
      return true;
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
      return false;
    }
  }

  /**
   * Process voice commands
   */
  processCommand(command) {
    // Notify all callbacks
    this.callbacks.forEach(callback => callback(command));

    // Check if we're on Settings page - ignore navigation commands to prevent interruption
    const currentPath = window.location.pathname;
    const isOnSettingsPage = currentPath.includes('/settings');

    // Navigation commands
    const navigationCommands = {
      'go home': '/',
      'go to home': '/',
      'home': '/',
      'dashboard': '/dashboard',
      'go to dashboard': '/dashboard',
      'patients': '/patients',
      'go to patients': '/patients',
      'show patients': '/patients',
      'alerts': '/alerts',
      'go to alerts': '/alerts',
      'show alerts': '/alerts',
      'medications': '/medications',
      'go to medications': '/medications',
      'appointments': '/appointments',
      'go to appointments': '/appointments',
      'caregivers': '/caregivers',
      'go to caregivers': '/caregivers',
      'care guide': '/care-guide',
      'go to care guide': '/care-guide',
      'assessments': '/assessments',
      'go to assessments': '/assessments',
      'memory vault': '/memory-vault',
      'go to memory vault': '/memory-vault',
      'journal': '/journal',
      'go to journal': '/journal',
      'my journal': '/journal',
      'community': '/community',
      'go to community': '/community',
      'messages': '/messages',
      'go to messages': '/messages',
      'my messages': '/messages',
      'profile': '/profile',
      'go to profile': '/profile',
      'my profile': '/profile',
      'resources': '/resources',
      'go to resources': '/resources',
      'my journey': '/my-journey',
      'go to my journey': '/my-journey',
      'settings': '/settings',
      'go to settings': '/settings',
    };

    // Check for navigation commands (but warn if on settings page)
    for (const [trigger, path] of Object.entries(navigationCommands)) {
      if (command === trigger || command.includes(trigger)) {
        if (this.navigate) {
          // If on settings and trying to navigate elsewhere, ask for confirmation
          if (isOnSettingsPage && path !== '/settings') {
            this.speak(`Navigating away from settings to ${trigger.replace('go to ', '')}`);
          } else {
            this.speak(`Navigating to ${trigger.replace('go to ', '')}`);
          }
          this.navigate(path);
        }
        return;
      }
    }

    // Action commands
    if (command.includes('save') || command === 'save form') {
      const saveButton = document.querySelector('button[type="submit"]');
      if (saveButton) {
        saveButton.click();
        this.speak('Saving');
      } else {
        this.speak('No save button found');
      }
      return;
    }

    if (command.includes('cancel') || command === 'cancel') {
      const cancelButton = document.querySelector('[aria-label*="cancel" i], [aria-label*="close" i]');
      if (cancelButton) {
        cancelButton.click();
        this.speak('Cancelled');
      } else {
        // Try to go back
        window.history.back();
        this.speak('Going back');
      }
      return;
    }

    if (command.includes('go back') || command === 'back') {
      window.history.back();
      this.speak('Going back');
      return;
    }

    if (command.includes('refresh') || command === 'reload') {
      window.location.reload();
      this.speak('Refreshing page');
      return;
    }

    if (command.includes('scroll down')) {
      window.scrollBy({ top: 300, behavior: 'smooth' });
      this.speak('Scrolling down');
      return;
    }

    if (command.includes('scroll up')) {
      window.scrollBy({ top: -300, behavior: 'smooth' });
      this.speak('Scrolling up');
      return;
    }

    if (command.includes('scroll to top') || command === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.speak('Scrolling to top');
      return;
    }

    if (command.includes('scroll to bottom') || command === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      this.speak('Scrolling to bottom');
      return;
    }

    // Help command
    if (command.includes('help') || command === 'what can you do') {
      this.speak('Available commands: go home, go to patients, go to dashboard, go to messages, save, cancel, go back, scroll up, scroll down, refresh, turn sound on, turn sound off. Say "list pages" for more navigation options.');
      return;
    }

    if (command.includes('list pages')) {
      this.speak('You can navigate to: home, dashboard, patients, alerts, medications, appointments, caregivers, care guide, assessments, memory vault, journal, community, messages, profile, resources, my journey, or settings');
      return;
    }

    // Settings control commands
    if (command.includes('turn sound on') || command.includes('enable sound') || command.includes('sound on')) {
      localStorage.setItem('touch_sound_enabled', 'true');
      this.speak('Sound feedback enabled');
      return;
    }

    if (command.includes('turn sound off') || command.includes('disable sound') || command.includes('sound off')) {
      localStorage.setItem('touch_sound_enabled', 'false');
      this.speak('Sound feedback disabled');
      return;
    }

    if (command.includes('turn haptic on') || command.includes('enable haptic') || command.includes('haptic on')) {
      localStorage.setItem('touch_haptic_enabled', 'true');
      this.speak('Haptic feedback enabled');
      return;
    }

    if (command.includes('turn haptic off') || command.includes('disable haptic') || command.includes('haptic off')) {
      localStorage.setItem('touch_haptic_enabled', 'false');
      this.speak('Haptic feedback disabled');
      return;
    }

    // Stop listening command
    if (command.includes('stop listening') || command === 'stop voice control') {
      this.stopListening();
      return;
    }

    // Command not recognized
    this.speak('Command not recognized. Say "help" for available commands.');
  }

  /**
   * Text-to-speech output
   */
  speak(text, options = {}) {
    if (!this.synthesis) return;
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    utterance.lang = options.lang || 'en-US';
    
    this.synthesis.speak(utterance);
  }

  /**
   * Register callback for commands
   */
  onCommand(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Check if browser supports voice control
   */
  static isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Get current listening state
   */
  getIsListening() {
    return this.isListening;
  }

  /**
   * Announce to screen reader and speak
   */
  announce(message) {
    // Create announcement element for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Also speak it out
    this.speak(message);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// Create singleton instance
const voiceControlService = new VoiceControlService();

export default voiceControlService;
