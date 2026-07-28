/**
 * useInstallPrompt.js
 * Captures the browser's beforeinstallprompt event so we can show
 * a custom "Install App" button instead of relying on the browser's
 * default install banner.
 */
import { useState, useEffect } from 'react';

export default function useInstallPrompt() {
  const [prompt,    setPrompt]    = useState(null);   // deferred install event
  const [installed, setInstalled] = useState(false);  // already installed as PWA

  useEffect(() => {
    // Check if already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();   // don't show the mini-infobar
      setPrompt(e);         // save it for our button
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setPrompt(null);
    }
    return outcome === 'accepted';
  };

  return { canInstall: !!prompt && !installed, installed, install };
}
