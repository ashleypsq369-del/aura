/**
 * NProgressBar.jsx
 * Shows a teal top-loading bar on every route change.
 * Controlled by Settings → Features → Page Progress Bar.
 * Uses nprogress under the hood.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import { useAppSettings } from '../context/AppSettingsContext';

// Configure once
NProgress.configure({
  minimum: 0.12,
  easing: 'ease',
  speed: 280,
  showSpinner: false,
  trickleSpeed: 120,
});

export default function NProgressBar() {
  const location = useLocation();
  const { featureSettings } = useAppSettings();

  useEffect(() => {
    if (!featureSettings.pageProgressBar) return;
    NProgress.start();
    // Small delay so the bar is visible even on fast loads
    const t = setTimeout(() => NProgress.done(), 350);
    return () => { clearTimeout(t); NProgress.done(); };
  }, [location.pathname, featureSettings.pageProgressBar]);

  return null; // purely side-effectful
}
