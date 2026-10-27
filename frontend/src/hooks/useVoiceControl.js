/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import voiceControlService from '../services/VoiceControlService';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * useVoiceControl - manages voice control lifecycle.
 * Re-initialises navigate on every render so commands always use
 * the latest React Router navigate (avoids stale closure bug).
 */
export default function useVoiceControl() {
 const navigate = useNavigate();
 const { settings } = useAccessibility();
 const [isListening, setIsListening] = useState(false);
 const [isSupported] = useState(!!voiceControlService.isSupported);
 const [lastCommand, setLastCommand] = useState('');
 const [cmdFeedback, setCmdFeedback] = useState(null); // { command, matched }
 const greetedRef = useRef(false);
 const feedbackTimer = useRef(null);

 // Always keep navigate fresh - called on every render intentionally
 useEffect(() => {
 voiceControlService.initialize(navigate);
 }); // no dep array - runs after every render

 // Register command + feedback listeners once
 useEffect(() => {
 const unsub1 = voiceControlService.onCommand(cmd => {
 setLastCommand(cmd);
 });
 const unsub2 = voiceControlService.onCommandFeedback(({ command, matched }) => {
 setCmdFeedback({ command, matched });
 clearTimeout(feedbackTimer.current);
 feedbackTimer.current = setTimeout(() => setCmdFeedback(null), 3000);
 });
 return () => { unsub1(); unsub2(); };
 }, []);

 // Start/stop based on settings.voiceControl
 useEffect(() => {
 const publicPage = ['/login', '/register', '/forgot-password']
 .includes(window.location.pathname);
 if (publicPage) return;

 if (settings.voiceControl && isSupported) {
 if (!voiceControlService.getIsListening()) {
 const started = voiceControlService.startListening();
 setIsListening(started);
 if (started && !greetedRef.current) {
 greetedRef.current = true;
 }
 } else {
 setIsListening(true);
 }
 } else if (!settings.voiceControl && voiceControlService.getIsListening()) {
 voiceControlService.stopListening();
 setIsListening(false);
 greetedRef.current = false;
 }
 }, [settings.voiceControl, isSupported]);

 const toggleListening = () => {
 if (voiceControlService.getIsListening()) {
 voiceControlService.stopListening();
 setIsListening(false);
 } else {
 const started = voiceControlService.startListening();
 setIsListening(started);
 }
 };

 return {
 isListening,
 isSupported,
 lastCommand,
 cmdFeedback, // { command: string, matched: bool } | null
 toggleListening,
 speak: (t, o) => voiceControlService.speak(t, o),
 announce: (m) => voiceControlService.announce(m),
 };
}
