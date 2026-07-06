/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import voiceControlService from '../services/VoiceControlService';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Custom hook for voice control integration
 * Manages voice control state and lifecycle
 */
export default function useVoiceControl() {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(voiceControlService.isSupported);
  const [lastCommand, setLastCommand] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);

  // Initialize voice control when enabled
  useEffect(() => {
    if (settings.voiceControl && isSupported) {
      // Initialize with navigation function
      voiceControlService.initialize(navigate);

      // Register command listener
      const unsubscribe = voiceControlService.onCommand((command) => {
        setLastCommand(command);
      });

      // Start listening if not already listening
      if (!voiceControlService.getIsListening()) {
        const started = voiceControlService.startListening();
        setIsListening(started);
        
        // Greet user only once per session
        if (started && !hasGreeted) {
          // Wait a moment for the voice control to fully initialize
          setTimeout(() => {
            voiceControlService.speak('Welcome to ProjectAura. Voice control is active.');
          }, 500);
          setHasGreeted(true);
        }

        // Add visual indicator
        if (started) {
          document.documentElement.classList.add('voice-control-active');
        }
      } else {
        // Already listening, just update state and re-initialize navigate function
        setIsListening(true);
        document.documentElement.classList.add('voice-control-active');
      }

      return () => {
        // Don't stop listening on unmount, only remove the callback
        unsubscribe();
      };
    } else if (!settings.voiceControl && isListening) {
      // Stop when disabled
      voiceControlService.stopListening();
      setIsListening(false);
      setHasGreeted(false);
      document.documentElement.classList.remove('voice-control-active');
    }
  }, [settings.voiceControl, isSupported, navigate, hasGreeted, isListening]);

  // Manual toggle
  const toggleListening = () => {
    if (isListening) {
      voiceControlService.stopListening();
      setIsListening(false);
      document.documentElement.classList.remove('voice-control-active');
    } else {
      const started = voiceControlService.startListening();
      setIsListening(started);
      if (started) {
        document.documentElement.classList.add('voice-control-active');
      }
    }
  };

  // Speak text
  const speak = (text, options) => {
    voiceControlService.speak(text, options);
  };

  // Announce to screen reader and speak
  const announce = (message) => {
    voiceControlService.announce(message);
  };

  return {
    isListening,
    isSupported,
    lastCommand,
    toggleListening,
    speak,
    announce,
  };
}
