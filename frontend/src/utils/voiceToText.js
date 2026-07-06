/**
 * Voice-to-Text Manager
 * Uses Web Speech API for voice input
 * Supports continuous and single-phrase recognition
 */

class VoiceToTextManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
    
    this.initRecognition();
  }

  /**
   * Check if browser supports Web Speech API
   */
  static isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize speech recognition
   */
  initRecognition() {
    if (!VoiceToTextManager.isSupported()) {
      console.warn('⚠️ Web Speech API not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configuration
    this.recognition.continuous = false; // Stop after one result
    this.recognition.interimResults = true; // Show interim results
    this.recognition.lang = 'en-US'; // Default to English
    this.recognition.maxAlternatives = 1;

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Voice recognition started');
    };

    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        this.transcript = lastResult[0].transcript;
        console.log('✅ Final transcript:', this.transcript);
        
        if (this.onResult) {
          this.onResult({
            transcript: this.transcript,
            confidence: lastResult[0].confidence,
            isFinal: true
          });
        }
      } else {
        // Interim result
        const interimTranscript = lastResult[0].transcript;
        if (this.onResult) {
          this.onResult({
            transcript: interimTranscript,
            confidence: lastResult[0].confidence,
            isFinal: false
          });
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.onError) {
        this.onError({
          error: event.error,
          message: this.getErrorMessage(event.error)
        });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🔴 Voice recognition ended');
      
      if (this.onEnd) {
        this.onEnd({ transcript: this.transcript });
      }
    };
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'Microphone not found. Please check your microphone.';
      case 'not-allowed':
        return 'Microphone access denied. Please allow microphone access.';
      case 'network':
        return 'Network error. Please check your internet connection.';
      case 'aborted':
        return 'Speech recognition aborted.';
      default:
        return `Speech recognition error: ${error}`;
    }
  }

  /**
   * Start listening
   */
  start(options = {}) {
    if (!this.recognition) {
      console.error('❌ Speech recognition not available');
      return false;
    }

    if (this.isListening) {
      console.warn('⚠️ Already listening');
      return false;
    }

    // Apply options
    if (options.continuous !== undefined) {
      this.recognition.continuous = options.continuous;
    }
    if (options.lang) {
      this.recognition.lang = options.lang;
    }

    // Set callbacks
    if (options.onResult) this.onResult = options.onResult;
    if (options.onError) this.onError = options.onError;
    if (options.onEnd) this.onEnd = options.onEnd;

    try {
      this.transcript = '';
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('❌ Failed to start recognition:', error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this.recognition) return false;
    
    if (this.isListening) {
      this.recognition.stop();
      return true;
    }
    
    return false;
  }

  /**
   * Abort listening (immediately)
   */
  abort() {
    if (!this.recognition) return false;
    
    if (this.isListening) {
      this.recognition.abort();
      return true;
    }
    
    return false;
  }

  /**
   * Change language
   */
  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Get current listening state
   */
  getState() {
    return {
      isListening: this.isListening,
      isSupported: VoiceToTextManager.isSupported(),
      currentTranscript: this.transcript
    };
  }
}

// Create singleton instance
const voiceToText = new VoiceToTextManager();

// Export both the instance and the class
export default voiceToText;
export { VoiceToTextManager };
