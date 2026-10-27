/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import voiceToText from '../utils/voiceToText';

export default function VoiceInput({ 
  onTranscript, 
  continuous = false,
  lang = "en-US",
  className = "",
  buttonClassName = ""
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  // Check browser support on mount
  const checkSupport = () => {
    if (!voiceToText.getState().isSupported) {
      setIsSupported(false);
    }
  };
  
  useEffect(() => {
    checkSupport();
  }, []);

  const handleStart = () => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const started = voiceToText.start({
      continuous,
      lang,
      onResult: (result) => {
        if (result.isFinal) {
          setTranscript(result.transcript);
          setInterimTranscript('');
          
          // Call parent callback
          if (onTranscript) {
            onTranscript(result.transcript);
          }
        } else {
          setInterimTranscript(result.transcript);
        }
      },
      onError: (err) => {
        setError(err.message);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
        setInterimTranscript('');
      }
    });

    if (started) {
      setIsListening(true);
    }
  };

  const handleStop = () => {
    voiceToText.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      handleStop();
    } else {
      handleStart();
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200 ${className}`}>
        <p className="text-sm text-yellow-800">
          ⚠️ Voice input not supported in this browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Voice Button */}
      <button
        type="button"
        onClick={toggleListening}
        className={`
          relative group
          ${buttonClassName || 'p-3 rounded-lg border-2 transition-all'}
          ${isListening 
            ? 'bg-red-500 border-red-600 text-white' 
            : 'bg-teal-500 border-teal-600 text-white hover:bg-teal-600'
          }
        `}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Mic className="w-5 h-5" />
          </motion.div>
        ) : (
          <MicOff className="w-5 h-5" />
        )}

        {/* Listening indicator */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-red-400 opacity-30"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </button>

      {/* Status/Transcript Display */}
      <AnimatePresence>
        {(isListening || transcript || interimTranscript || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 z-50"
          >
            <div className="bg-[#e8fafa] rounded-lg shadow-lg border-2 border-slate-200 p-4">
              {/* Listening State */}
              {isListening && !error && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                  <span className="text-sm font-medium text-teal-600">
                    Listening...
                  </span>
                </div>
              )}

              {/* Interim Transcript */}
              {interimTranscript && (
                <p className="text-sm text-slate-500 italic mt-2">
                  "{interimTranscript}"
                </p>
              )}

              {/* Final Transcript */}
              {transcript && !isListening && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">Recognized:</p>
                  <p className="text-sm text-slate-900 font-medium">
                    "{transcript}"
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <p className="text-xs text-red-800">{error}</p>
                </div>
              )}

              {/* Instructions */}
              {isListening && !error && (
                <p className="text-xs text-slate-500 mt-2">
                  Speak clearly into your microphone. Click the button again to stop.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
