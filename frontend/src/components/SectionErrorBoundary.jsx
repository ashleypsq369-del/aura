/**
 * SectionErrorBoundary.jsx
 * Wraps individual page sections so one broken component
 * doesn't crash the entire page - critical for HIPAA/healthcare HCI.
 * Controlled by Settings → Features → Error Boundaries.
 *
 * Usage:
 *   <SectionErrorBoundary name="Vital Signs">
 *     <VitalSignsChart />
 *   </SectionErrorBoundary>
 */
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppSettings } from '../context/AppSettingsContext';

function SectionFallback({ error, resetErrorBoundary, name }) {
  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 flex items-start gap-3">
      <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-800 text-sm">
          {name ? `${name} failed to load` : 'This section failed to load'}
        </p>
        <p className="text-xs text-amber-700 mt-0.5 font-mono truncate">
          {error?.message || 'Unknown error'}
        </p>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition flex-shrink-0"
        data-tip="Retry loading this section"
      >
        <RefreshCw size={12} />Retry
      </button>
    </div>
  );
}

export default function SectionErrorBoundary({ children, name, fallback }) {
  const { featureSettings } = useAppSettings();

  if (!featureSettings.errorBoundaries) return children;

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) =>
        fallback || (
          <SectionFallback
            error={error}
            resetErrorBoundary={resetErrorBoundary}
            name={name}
          />
        )
      }
      onError={(error, info) => {
        // Log to console in dev; could send to monitoring service
        console.error(`[SectionError:${name || 'unknown'}]`, error, info);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
