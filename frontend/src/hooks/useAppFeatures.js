/**
 * useAppFeatures.js
 * Central feature-flag hook - reads from AppSettingsContext.
 * All optional features are off-by-default and controlled from Settings.
 */
import { useAppSettings } from '../context/AppSettingsContext';

export function useAppFeatures() {
  const { featureSettings } = useAppSettings();
  return featureSettings;
}
