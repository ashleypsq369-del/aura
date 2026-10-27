import { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  X, Settings, Volume2, Eye, Keyboard, Hand, Brain,
  ZoomIn, Moon, Headphones, AlignLeft, BookOpen, Type,
} from 'lucide-react';
import ModalShell from './ui/ModalShell';

const FONT_SIZES = ['small', 'medium', 'large', 'xlarge', 'xxlarge'];
const FONT_SIZE_LABELS = { small: 'S', medium: 'M', large: 'L', xlarge: 'XL', xxlarge: 'XXL' };

// Reusable toggle row for the modal
function ToggleRow({ id, label, desc, value, onChange }) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
      <div className="flex-1">
        <label htmlFor={id} className="font-medium text-slate-900">{label}</label>
        {desc && <p className="text-sm text-gray-600 mt-1">{desc}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 flex-shrink-0 ${
          value ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-6 w-6 transform rounded-full bg-[#e8fafa] transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function AccessibilityPanel() {
  const { settings, updateSetting, resetSettings, enableAssistedMode, disableAssistedMode } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const fontSizes = [
    { value: 'small',   label: 'Small (14px)',      description: 'Compact text' },
    { value: 'medium',  label: 'Medium (16px)',     description: 'Default size' },
    { value: 'large',   label: 'Large (18px)',      description: 'Comfortable reading' },
    { value: 'xlarge',  label: 'Extra Large (20px)', description: 'Large text' },
    { value: 'xxlarge', label: 'XXL (24px)',        description: 'Maximum size' },
  ];

  const increaseFontSize = () => {
    const idx = FONT_SIZES.indexOf(settings.fontSize);
    if (idx < FONT_SIZES.length - 1) updateSetting('fontSize', FONT_SIZES[idx + 1]);
  };

  const decreaseFontSize = () => {
    const idx = FONT_SIZES.indexOf(settings.fontSize);
    if (idx > 0) updateSetting('fontSize', FONT_SIZES[idx - 1]);
  };

  const fontSizeLabel = FONT_SIZE_LABELS[settings.fontSize] || 'M';

  return (
    <>
      {/* ── Quick Bar (always visible) ── */}
      <div
        className="fixed bottom-20 right-4 z-38 flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm rounded-2xl px-2 py-1.5 shadow-xl border border-white/10"
        role="toolbar"
        aria-label="Quick accessibility controls"
      >
        {/* Decrease font */}
        <button
          onClick={decreaseFontSize}
          title="Decrease text size (Alt+-)"
          aria-label="Decrease text size"
          disabled={settings.fontSize === 'small'}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
        >
          A-
        </button>

        {/* Current size label */}
        <span className="text-white/60 text-[10px] font-bold uppercase w-5 text-center select-none">
          {fontSizeLabel}
        </span>

        {/* Increase font */}
        <button
          onClick={increaseFontSize}
          title="Increase text size (Alt++)"
          aria-label="Increase text size"
          disabled={settings.fontSize === 'xxlarge'}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
        >
          A+
        </button>

        <div className="w-px h-4 bg-white/20" />

        {/* High contrast toggle */}
        <button
          onClick={() => updateSetting('highContrast', !settings.highContrast)}
          title="Toggle high contrast"
          aria-label={settings.highContrast ? 'Disable high contrast' : 'Enable high contrast'}
          aria-pressed={settings.highContrast}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${settings.highContrast ? 'bg-white/25 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Moon size={13} />
        </button>

        {/* Reading guide toggle */}
        <button
          onClick={() => updateSetting('readingGuide', !settings.readingGuide)}
          title="Toggle reading guide"
          aria-label={settings.readingGuide ? 'Disable reading guide' : 'Enable reading guide'}
          aria-pressed={settings.readingGuide}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${settings.readingGuide ? 'bg-white/25 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <BookOpen size={13} />
        </button>

        {/* Voice control indicator */}
        {settings.voiceControl && (
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Voice control active" aria-label="Voice control is active" />
        )}

        {/* Open full modal */}
        <button
          onClick={() => setIsOpen(true)}
          title="More accessibility settings"
          aria-label="Open full accessibility settings"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Settings size={13} />
        </button>
      </div>

      {/* ── Full Accessibility Modal ── */}
      <ModalShell
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessibility Settings"
        icon={Settings}
        accent="teal"
        size="lg"
      >
        <div className="space-y-6">

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
                    </p>
                  </div>
                </div>
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
                  <span className={`inline-block h-8 w-8 transform rounded-full bg-[#e8fafa] shadow-md transition-transform ${
                    settings.assistedMode ? 'translate-x-9' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </section>

          {/* Vision & Display */}
          <section aria-labelledby="vision-settings">
            <h3 id="vision-settings" className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" aria-hidden="true" />
              Vision & Display
            </h3>
            <div className="space-y-4">
              <ToggleRow id="high-contrast" label="High Contrast Mode" desc="Increases contrast for better visibility"
                value={settings.highContrast} onChange={() => updateSetting('highContrast', !settings.highContrast)} />

              {/* Visual Impairments */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <label className="font-medium text-slate-900 flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5" aria-hidden="true" />
                  Visual Impairments
                </label>
                <select
                  value={settings.colorBlindMode || 'none'}
                  onChange={e => updateSetting('colorBlindMode', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-[#e8fafa] text-gray-700 focus:outline-none focus:border-teal-500"
                  aria-label="Visual impairment filter"
                >
                  <option value="none">No Filter — Normal Vision</option>
                  <option value="protanopia">Protanopia — Red-Blind</option>
                  <option value="deuteranopia">Deuteranopia — Green-Blind</option>
                  <option value="tritanopia">Tritanopia — Blue-Blind</option>
                  <option value="monochrome">Achromatopsia — Full Grayscale</option>
                  <option value="low_contrast">Low Contrast Boost — Enhance faint text</option>
                  <option value="photosensitive">Photosensitive — Reduced brightness & motion</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <label className="font-medium text-slate-900 flex items-center gap-2 mb-3">
                  <ZoomIn className="w-5 h-5" aria-hidden="true" />
                  Font Size
                </label>
                <div className="space-y-2">
                  {fontSizes.map((size) => (
                    <button key={size.value} onClick={() => updateSetting('fontSize', size.value)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        settings.fontSize === size.value
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                      role="radio" aria-checked={settings.fontSize === size.value}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{size.label}</div>
                          <div className="text-sm text-gray-600">{size.description}</div>
                        </div>
                        {settings.fontSize === size.value && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#e8fafa]" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <ToggleRow id="reduced-motion" label="Reduce Motion" desc="Minimizes animations and transitions"
                value={settings.reducedMotion} onChange={() => updateSetting('reducedMotion', !settings.reducedMotion)} />
            </div>
          </section>

          {/* Assistive Technology */}
          <section aria-labelledby="assistive-settings">
            <h3 id="assistive-settings" className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" aria-hidden="true" />
              Assistive Technology
            </h3>
            <div className="space-y-4">
              <ToggleRow id="screen-reader" label="Screen Reader Optimizations" desc="Enhanced descriptions for screen readers"
                value={settings.screenReaderMode} onChange={() => updateSetting('screenReaderMode', !settings.screenReaderMode)} />
              <ToggleRow id="voice-control" label="Voice Control" desc="Control the app with voice commands"
                value={settings.voiceControl} onChange={() => updateSetting('voiceControl', !settings.voiceControl)} />
            </div>
          </section>

          {/* Navigation */}
          <section aria-labelledby="navigation-settings">
            <h3 id="navigation-settings" className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />
              Navigation
            </h3>
            <div className="space-y-4">
              <ToggleRow id="keyboard-only" label="Keyboard Navigation Mode" desc="Enhanced keyboard shortcuts and focus indicators"
                value={settings.keyboardOnly} onChange={() => updateSetting('keyboardOnly', !settings.keyboardOnly)} />
              <ToggleRow id="large-touch" label="Large Touch Targets" desc="Bigger buttons for easier interaction"
                value={settings.largeTouch} onChange={() => updateSetting('largeTouch', !settings.largeTouch)} />
              <ToggleRow id="simplified-ui" label="Simplified Interface" desc="Cleaner layout with fewer distractions"
                value={settings.simplifiedUI} onChange={() => updateSetting('simplifiedUI', !settings.simplifiedUI)} />
            </div>
          </section>

          {/* Reading & Typography */}
          <section aria-labelledby="reading-settings">
            <h3 id="reading-settings" className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" aria-hidden="true" />
              Reading & Typography
            </h3>
            <div className="space-y-4">
              <ToggleRow id="focus-mode" label="Focus Mode" desc="Dims everything except the currently focused element"
                value={settings.focusMode} onChange={() => updateSetting('focusMode', !settings.focusMode)} />
              <ToggleRow id="reading-guide" label="Reading Guide" desc="Highlights the line under your cursor to guide reading"
                value={settings.readingGuide} onChange={() => updateSetting('readingGuide', !settings.readingGuide)} />
              <ToggleRow id="dyslexia-font" label="Dyslexia-Friendly Font" desc="Uses a rounded, spaced font to aid reading with dyslexia"
                value={settings.dyslexiaFont} onChange={() => updateSetting('dyslexiaFont', !settings.dyslexiaFont)} />

              {/* Text Spacing */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <label className="font-medium text-slate-900 flex items-center gap-2 mb-3">
                  <AlignLeft className="w-5 h-5" aria-hidden="true" />
                  Text Spacing
                </label>
                <div className="flex gap-2">
                  {[['normal','Normal'],['relaxed','Relaxed'],['wide','Wide']].map(([v, lbl]) => (
                    <button key={v} onClick={() => updateSetting('textSpacing', v)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        settings.textSpacing === v
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                      role="radio" aria-checked={settings.textSpacing === v}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section aria-labelledby="shortcuts-info" className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 id="shortcuts-info" className="text-md font-semibold text-slate-900 mb-3">Keyboard Shortcuts</h3>
            <ul className="space-y-1.5 text-sm text-gray-700">
              {[
                ['Alt + 1', 'Skip to main content'],
                ['Alt + 2', 'Go to navigation'],
                ['Alt + 3', 'Go to search'],
                ['Alt + H', 'Go to home/dashboard'],
                ['Alt + D', 'Go to dashboard'],
                ['Alt + N', 'Go to notifications'],
                ['Alt + C', 'Go to care settings'],
                ['Alt + S', 'Go to settings'],
                ['Alt + M', 'Go to messages'],
                ['Alt + P', 'Go to patients'],
                ['Alt + A', 'Go to alerts'],
                ['Alt + V', 'Toggle voice control'],
                ['Alt + F', 'Toggle focus mode'],
                ['Alt + +', 'Increase font size'],
                ['Alt + -', 'Decrease font size'],
                ['Esc', 'Close dialogs/modals'],
              ].map(([key, desc]) => (
                <li key={key}>
                  <kbd className="px-2 py-0.5 bg-[#e8fafa] rounded border border-gray-300 text-xs">{key}</kbd>
                  <span className="ml-2">{desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Reset */}
          <div className="pt-4 border-t-2 border-gray-200">
            <button
              onClick={() => { resetSettings(); setTimeout(() => setIsOpen(false), 500); }}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border-2 border-gray-300 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300"
            >
              Reset to Defaults
            </button>
          </div>

        </div>
      </ModalShell>
    </>
  );
}
