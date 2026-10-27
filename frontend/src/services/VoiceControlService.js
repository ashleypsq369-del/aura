/**
 * VoiceControlService.js - Project Aura
 * =======================================
 * Hands-free navigation via Web Speech API SpeechRecognition.
 * Designed for patients with motor impairments or dementia.
 *
 * Works on: Chrome, Edge (requires HTTPS or localhost)
 * Does NOT work on: Firefox (no SpeechRecognition support)
 */

class VoiceControlService {
 constructor() {
 const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
 this.isSupported = !!SR;
 this.recognition = null;
 this.synthesis = window.speechSynthesis || null;
 this.isListening = false;
 this.callbacks = [];
 this.navigate = null;
 this._permissionDenied = false;
 this._lastCommand = '';
 this._onCommandListeners = []; // for UI feedback

 if (this.isSupported) {
 this.recognition = new SR();
 this.recognition.continuous = true;
 this.recognition.interimResults = false;
 this.recognition.lang = 'en-US';
 this.recognition.maxAlternatives = 3;
 }
 }

 /** Wire up the React Router navigate function and event handlers */
 initialize(navigateFunction) {
 if (!this.isSupported) return false;

 // Always update navigate - avoids stale closure on re-renders
 this.navigate = navigateFunction;

 // Only set up handlers once
 if (this._handlersAttached) return true;
 this._handlersAttached = true;

 this.recognition.onresult = (e) => {
 // Try all alternatives, pick the first matching command
 const last = e.results.length - 1;
 const transcripts = [];
 for (let i = 0; i < e.results[last].length; i++) {
 transcripts.push(e.results[last][i].transcript.toLowerCase().trim());
 }
 console.log('[Voice] Heard:', transcripts);
 // Try each alternative until one matches
 for (const t of transcripts) {
 if (this._processCommand(t)) return;
 }
 // Nothing matched
 this._notifyListeners(transcripts[0], false);
 this._speak('Command not recognised. Say help for available commands.');
 };

 this.recognition.onerror = (e) => {
 if (e.error === 'not-allowed') {
 console.warn('[Voice] Microphone permission denied');
 this._permissionDenied = true;
 this.isListening = false;
 } else if (e.error === 'no-speech') {
 // Normal - user just paused
 } else if (e.error === 'aborted') {
 // Manually stopped - expected
 } else {
 console.warn('[Voice] Error:', e.error);
 }
 };

 this.recognition.onend = () => {
 if (this.isListening && !this._permissionDenied) {
 // Auto-restart to keep continuous listening
 try { this.recognition.start(); } catch (_) {}
 }
 };

 return true;
 }

 startListening() {
 if (!this.isSupported) {
 alert('Voice control is not supported in this browser. Please use Chrome or Edge.');
 return false;
 }
 if (this._permissionDenied) {
 alert('Microphone permission was denied. Please allow microphone access in your browser settings.');
 return false;
 }
 if (this.isListening) return true;

 try {
 this.recognition.start();
 this.isListening = true;
 document.documentElement.classList.add('voice-control-active');
 this._speak('Voice control on. Say help for commands.');
 return true;
 } catch (e) {
 console.error('[Voice] Start error:', e);
 return false;
 }
 }

 stopListening() {
 if (!this.isSupported || !this.isListening) return;
 try {
 this.isListening = false;
 this.recognition.stop();
 document.documentElement.classList.remove('voice-control-active');
 this._speak('Voice control off.');
 } catch (_) {}
 }

 getIsListening() { return this.isListening; }

 // Register a callback when commands come in (for UI feedback)
 onCommand(cb) {
 this.callbacks.push(cb);
 return () => { this.callbacks = this.callbacks.filter(c => c !== cb); };
 }

 // Register UI listener for showing last command + match status
 onCommandFeedback(cb) {
 this._onCommandListeners.push(cb);
 return () => { this._onCommandListeners = this._onCommandListeners.filter(c => c !== cb); };
 }

 _notifyListeners(command, matched) {
 this._lastCommand = command;
 this.callbacks.forEach(cb => cb(command));
 this._onCommandListeners.forEach(cb => cb({ command, matched }));
 }

 /** Returns true if command matched */
 _processCommand(cmd) {
 this._notifyListeners(cmd, true); // optimistic - corrected to false if no match

 // ── Navigation ────────────────────────────────────────────────────
 const NAV = {
 'go home': '/', 'home': '/',
 'dashboard': '/dashboard','go to dashboard': '/dashboard',
 'patients': '/patients', 'go to patients': '/patients', 'show patients': '/patients',
 'alerts': '/alerts', 'go to alerts': '/alerts',
 'medications': '/medications','go to medications':'/medications',
 'appointments': '/appointments','go to appointments':'/appointments',
 'caregivers': '/caregivers','go to caregivers': '/caregivers',
 'assessments': '/assessments','go to assessments':'/assessments',
 'memory vault': '/memory-vault','go to memory vault':'/memory-vault',
 'journal': '/journal', 'my journal': '/journal',
 'community': '/community','go to community': '/community',
 'messages': '/messages', 'go to messages': '/messages',
 'profile': '/profile', 'my profile': '/profile',
 'resources': '/resources','go to resources': '/resources',
 'my journey': '/my-journey',
 'settings': '/settings', 'go to settings': '/settings',
 'notifications': '/notifications','go to notifications':'/notifications',
 'care settings': '/care-settings',
 'my space': '/my-space',
 };

 for (const [trigger, path] of Object.entries(NAV)) {
 if (cmd === trigger || cmd.includes(trigger)) {
 if (this.navigate) {
 this.navigate(path);
 this._speak(`Going to ${trigger.replace('go to ', '').replace('go ', '')}`);
 return true;
 }
 }
 }

 // ── Scroll ────────────────────────────────────────────────────────
 if (cmd.includes('scroll down') || cmd === 'down') {
 window.scrollBy({ top: 400, behavior: 'smooth' });
 this._speak('Scrolling down'); return true;
 }
 if (cmd.includes('scroll up') || cmd === 'up') {
 window.scrollBy({ top: -400, behavior: 'smooth' });
 this._speak('Scrolling up'); return true;
 }
 if (cmd.includes('top') || cmd.includes('go to top')) {
 window.scrollTo({ top: 0, behavior: 'smooth' });
 this._speak('Top of page'); return true;
 }
 if (cmd.includes('bottom') || cmd.includes('go to bottom')) {
 window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
 this._speak('Bottom of page'); return true;
 }

 // ── Actions ───────────────────────────────────────────────────────
 if (cmd.includes('go back') || cmd === 'back') {
 window.history.back(); this._speak('Going back'); return true;
 }
 if (cmd.includes('refresh') || cmd === 'reload') {
 window.location.reload(); return true;
 }
 if (cmd.includes('save') || cmd === 'submit') {
 const btn = document.querySelector('button[type="submit"], button.btn-primary, [data-action="save"]');
 if (btn) { btn.click(); this._speak('Saved'); } else { this._speak('No save button found'); }
 return true;
 }
 if (cmd === 'cancel' || cmd.includes('close modal') || cmd.includes('close dialog')) {
 const close = document.querySelector('[aria-label*="close" i], [aria-label*="cancel" i], [data-dismiss]');
 if (close) { close.click(); this._speak('Closed'); } else { window.history.back(); this._speak('Going back'); }
 return true;
 }

 // ── Click by label ────────────────────────────────────────────────
 if (cmd.startsWith('click ') || cmd.startsWith('press ') || cmd.startsWith('tap ')) {
 const label = cmd.replace(/^(click|press|tap)\s+/i, '').trim();
 const found = this._findElementByLabel(label);
 if (found) { found.click(); this._speak(`Clicked ${label}`); return true; }
 this._speak(`Could not find ${label}`); return true;
 }

 // ── Focus by label ────────────────────────────────────────────────
 if (cmd.startsWith('focus ') || cmd.startsWith('go to field ')) {
 const label = cmd.replace(/^(focus|go to field)\s+/i, '').trim();
 const found = this._findInputByLabel(label);
 if (found) { found.focus(); this._speak(`Focused ${label}`); return true; }
 this._speak(`Field ${label} not found`); return true;
 }

 // ── Type text ─────────────────────────────────────────────────────
 if (cmd.startsWith('type ') || cmd.startsWith('enter ')) {
 const text = cmd.replace(/^(type|enter)\s+/i, '').trim();
 const active = document.activeElement;
 if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
 active.value += text;
 active.dispatchEvent(new Event('input', { bubbles: true }));
 this._speak(`Typed ${text}`);
 } else {
 this._speak('No text field is focused. Say focus followed by the field name first.');
 }
 return true;
 }

 // ── Stop voice ────────────────────────────────────────────────────
 if (cmd.includes('stop listening') || cmd.includes('stop voice') || cmd === 'voice off') {
 this.stopListening(); return true;
 }

 // ── Help ──────────────────────────────────────────────────────────
 if (cmd.includes('help') || cmd === 'what can you do') {
 this._speak(
 'Navigation: say home, dashboard, patients, medications, appointments, messages, settings. ' +
 'Actions: say save, cancel, go back, scroll down, scroll up, refresh. ' +
 'To click a button say click followed by its name. ' +
 'To type say type followed by your text. ' +
 'Say stop listening to turn off voice control.'
 );
 return true;
 }

 // Not matched
 this._onCommandListeners.forEach(cb => cb({ command: cmd, matched: false }));
 return false;
 }

 /** Find a clickable element by its visible text/aria-label */
 _findElementByLabel(label) {
 const lower = label.toLowerCase();
 const candidates = document.querySelectorAll(
 'button, a, [role="button"], [role="link"], [role="tab"], [role="menuitem"]'
 );
 for (const el of candidates) {
 const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase().trim();
 if (text === lower || text.includes(lower)) return el;
 }
 return null;
 }

 /** Find an input by its associated label text */
 _findInputByLabel(label) {
 const lower = label.toLowerCase();
 const labels = document.querySelectorAll('label');
 for (const lbl of labels) {
 if ((lbl.textContent || '').toLowerCase().includes(lower)) {
 const forId = lbl.getAttribute('for');
 if (forId) return document.getElementById(forId);
 return lbl.querySelector('input, textarea, select');
 }
 }
 const inputs = document.querySelectorAll('input, textarea, select');
 for (const inp of inputs) {
 const ph = (inp.placeholder || inp.name || inp.id || '').toLowerCase();
 if (ph.includes(lower)) return inp;
 }
 return null;
 }

 _speak(text, opts = {}) {
 if (!this.synthesis) return;
 this.synthesis.cancel();
 const u = new SpeechSynthesisUtterance(text);
 u.rate = opts.rate ?? 1.0;
 u.pitch = opts.pitch ?? 1.0;
 u.volume = opts.volume ?? 0.9;
 u.lang = 'en-US';
 this.synthesis.speak(u);
 }

 speak(text, opts) { this._speak(text, opts); }

 announce(message) {
 const el = document.createElement('div');
 el.setAttribute('role', 'status');
 el.setAttribute('aria-live', 'polite');
 el.setAttribute('aria-atomic', 'true');
 el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
 el.textContent = message;
 document.body.appendChild(el);
 this._speak(message);
 setTimeout(() => el.remove(), 2000);
 }
}

const voiceControlService = new VoiceControlService();
export default voiceControlService;
