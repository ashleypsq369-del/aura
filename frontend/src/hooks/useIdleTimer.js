/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useIdleTimer Hook
 * HIPAA Compliance: 15-minute inactivity auto-logoff
 * Gap Analysis Priority 2
 * 
 * Tracks user activity and triggers warnings/logout after inactivity
 */

const DEFAULT_IDLE_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 14 * 60 * 1000; // Show warning at 14 minutes

export default function useIdleTimer({
  idleTime = DEFAULT_IDLE_TIME,
  warningTime = WARNING_TIME,
  onIdle,
  onWarning,
  onActive,
  enabled = true
}) {
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(idleTime);
  
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  // eslint-disable-next-line react-hooks/purity
  const lastActivityRef = useRef(Date.now());

  // Activity events to track
  const events = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'wheel'
  ];

  // Reset timers on activity
  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setShowWarning(false);
    setRemainingTime(idleTime);

    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    if (!enabled) return;

    // Set warning timer (14 minutes)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      if (onWarning) {
        onWarning();
      }

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, idleTime - elapsed);
        setRemainingTime(remaining);

        if (remaining === 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);
    }, warningTime);

    // Set idle timer (15 minutes)
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      setShowWarning(false);
      if (onIdle) {
        onIdle();
      }

      // Clear countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }, idleTime);

    // Call onActive if provided
    if (onActive && (isIdle || showWarning)) {
      onActive();
    }
  }, [enabled, idleTime, warningTime, onIdle, onWarning, onActive, isIdle, showWarning]);

  // Stay active function (for "I'm still here" button)
  const stayActive = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) {
      // Clear all timers if disabled
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimers, { passive: true });
    });

    // Start timers
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [enabled, resetTimers, events]);

  return {
    isIdle,
    showWarning,
    remainingTime,
    remainingSeconds: Math.ceil(remainingTime / 1000),
    stayActive,
    resetTimers
  };
}
