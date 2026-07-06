import { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { X, Settings, Volume2, Eye, Keyboard, Hand, Brain, ZoomIn, Moon, Headphones } from 'lucide-react';

export default function AccessibilityPanel() {
  const { settings, updateSetting, resetSettings, enableAssistedMode, disableAssistedMode } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const fontSizes = [
    { value: 'small', label: 'Small (14px)', description: 'Compact text' },
    { value: 'medium', label: 'Medium (16px)', description: 'Default size' },
    { value: 'large', label: 'Large (18px)', description: 'Comfortable reading' },
    { value: 'xlarge', label: 'Extra Large (20px)', description: 'Large text' },
    { value: 'xxlarge', label: 'XXL (24px)', description: 'Maximum size' },
  ];

  return (
    <>
      {/* Floating Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/30"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Settings className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Accessibility Panel Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessibility-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" aria-hidden="true" />
                <h2 id="accessibility-title" className="text-lg font-bold text-slate-900">
                  Accessibility Settings
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close accessibility settings"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">

              {/* -- ASSISTED MODE HERO CARD -- */}
              <section aria-labelledby="assisted-mode-section">
                <div className={`rounded-2xl border-2 p-5 transition-all ${
                  settings.assistedMode
                    ? 'bg-purple-50 border-purple-400 shadow-md'
                    : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        settings.assistedMode ? 'bg-purple-600' : 'bg-purple-100'
                      }`}>
                        <Brain className={`w-7 h-7 ${settings.assistedMode ? 'text-white' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h3 id="assisted-mode-section" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          Assisted Mode
                          {settings.assistedMode && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">ON</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          Designed for patients with <strong>dementia</strong>, cognitive impairment, or motor difficulties.
                          Activates large text, big buttons, simplified layout and reduced visual noise all at once.
                        </p>
                      </div>
                    </div>
                    {/* Big toggle */}
                    <button
                      onClick={() => settings.assistedMode ? disableAssistedMode() : enableAssistedMode()}
                      className={`flex-shrink-0 relative inline-flex h-10 w-18 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                        settings.assistedMode ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                      style={{ width: '72px' }}
                      role="switch"
                      aria-checked={settings.assistedMode}
                      aria-label="Toggle assisted mode"
                    >
                      <span
                        className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform ${
                          settings.assistedMode ? 'translate-x-9' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {settings.assistedMode && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      {[
                        '✓ Extra large text (24px)',
                        '✓ Oversized buttons & inputs',
                        '✓ Simplified clean layout',
                        '✓ Reduced animations',
                        '✓ Voice announcement on toggle',
                        '✓ High-visibility focus rings',
                      ].map(f => (
                        <div key={f} className="flex items-center gap-1 text-purple-700 font-semibold">{f}</div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              <section aria-labelledby="vision-settings">
                <h3 id="vision-settings" className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" aria-hidden="true" />
                  Vision & Display
                </h3>
                
                <div className="space-y-4">
                  {/* High Contrast */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="high-contrast" className="font-medium text-slate-900 flex items-center gap-2">
                        <Moon className="w-5 h-5" aria-hidden="true" />
                        High Contrast Mode
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Increases contrast for better visibility
                      </p>
                    </div>
                    <button
                      id="high-contrast"
                      role="switch"
                      aria-checked={settings.highContrast}
                      onClick={() => updateSetting('highContrast', !settings.highContrast)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                        settings.highContrast ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.highContrast ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Font Size */}
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <label className="font-medium text-slate-900 flex items-center gap-2 mb-3">
                      <ZoomIn className="w-5 h-5" aria-hidden="true" />
                      Font Size
                    </label>
                    <div className="space-y-2">
                      {fontSizes.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => updateSetting('fontSize', size.value)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                            settings.fontSize === size.value
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                          role="radio"
                          aria-checked={settings.fontSize === size.value}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{size.label}</div>
                              <div className="text-sm text-gray-600">{size.description}</div>
                            </div>
                            {settings.fontSize === size.value && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reduced Motion */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="reduced-motion" className="font-medium text-slate-900">
                        Reduce Motion
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Minimizes animations and transitions
                      </p>
                    </div>
                    <button
                      id="reduced-motion"
                      role="switch"
                      aria-checked={settings.reducedMotion}
                      onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                        settings.reducedMotion ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.reducedMotion ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Assistive Technology Settings */}
              <section aria-labelledby="assistive-settings">
                <h3 id="assistive-settings" className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" aria-hidden="true" />
                  Assistive Technology
                </h3>
                
                <div className="space-y-4">
                  {/* Screen Reader Mode */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="screen-reader" className="font-medium text-slate-900 flex items-center gap-2">
                        <Volume2 className="w-5 h-5" aria-hidden="true" />
                        Screen Reader Optimizations
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Enhanced descriptions for screen readers
                      </p>
                    </div>
                    <button
                      id="screen-reader"
                      role="switch"
                      aria-checked={settings.screenReaderMode}
                      onClick={() => updateSetting('screenReaderMode', !settings.screenReaderMode)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                        settings.screenReaderMode ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.screenReaderMode ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Voice Control */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="voice-control" className="font-medium text-slate-900">
                        Voice Control
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Control the app with voice commands
                      </p>
                    </div>
                    <button
                      id="voice-control"
                      role="switch"
                      aria-checked={settings.voiceControl}
                      onClick={() => updateSetting('voiceControl', !settings.voiceControl)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                        settings.voiceControl ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.voiceControl ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Navigation Settings */}
              <section aria-labelledby="navigation-settings">
                <h3 id="navigation-settings" className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />
                  Navigation
                </h3>
                
                <div className="space-y-4">
                  {/* Keyboard Only Mode */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="keyboard-only" className="font-medium text-slate-900">
                        Keyboard Navigation Mode
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Enhanced keyboard shortcuts and focus indicators
                      </p>
                    </div>
                    <button
                      id="keyboard-only"
                      role="switch"
                      aria-checked={settings.keyboardOnly}
                      onClick={() => updateSetting('keyboardOnly', !settings.keyboardOnly)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                        settings.keyboardOnly ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.keyboardOnly ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Large Touch Targets */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="large-touch" className="font-medium text-slate-900 flex items-center gap-2">
                        <Hand className="w-5 h-5" aria-hidden="true" />
                        Large Touch Targets
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Bigger buttons for easier interaction
                      </p>
                    </div>
                    <button
                      id="large-touch"
                      role="switch"
                      aria-checked={settings.largeTouch}
                      onClick={() => updateSetting('largeTouch', !settings.largeTouch)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                        settings.largeTouch ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.largeTouch ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Simplified UI */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <label htmlFor="simplified-ui" className="font-medium text-slate-900 flex items-center gap-2">
                        <Brain className="w-5 h-5" aria-hidden="true" />
                        Simplified Interface
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Cleaner layout with fewer distractions
                      </p>
                    </div>
                    <button
                      id="simplified-ui"
                      role="switch"
                      aria-checked={settings.simplifiedUI}
                      onClick={() => updateSetting('simplifiedUI', !settings.simplifiedUI)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 ${
                        settings.simplifiedUI ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.simplifiedUI ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Keyboard Shortcuts Info */}
              <section aria-labelledby="shortcuts-info" className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 id="shortcuts-info" className="text-md font-semibold text-slate-900 mb-3">
                  Keyboard Shortcuts
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><kbd className="px-2 py-1 bg-white rounded border border-gray-300">Alt + 1</kbd> - Skip to main content</li>
                  <li><kbd className="px-2 py-1 bg-white rounded border border-gray-300">Alt + 2</kbd> - Go to navigation</li>
                  <li><kbd className="px-2 py-1 bg-white rounded border border-gray-300">Alt + 3</kbd> - Go to search</li>
                  <li><kbd className="px-2 py-1 bg-white rounded border border-gray-300">Alt + H</kbd> - Go to home/dashboard</li>
                  <li><kbd className="px-2 py-1 bg-white rounded border border-gray-300">Esc</kbd> - Close dialogs/modals</li>
                </ul>
              </section>

              {/* Reset Button */}
              <div className="pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    resetSettings();
                    setTimeout(() => setIsOpen(false), 500);
                  }}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border-2 border-gray-300 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

