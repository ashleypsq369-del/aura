/**
 * Touch Demo Page
 * Demonstrates all touch screen features, haptic feedback, and downloads
 */

import { useState } from 'react';
import {
  Smartphone, Vibrate, Volume2, Download, Zap, Hand, CheckCircle,
  Plus, Settings
} from 'lucide-react';
import TouchButton, { TouchIconButton, TouchFAB, TouchCardButton } from '../components/TouchButton';
import ResourceDownloadManagerUI from '../components/ResourceDownloadManager';
import { haptic, playSound, TouchGestureDetector, touchPreferences } from '../utils/touchSupport';

export default function TouchDemo() {
  const [showDownloads, setShowDownloads] = useState(false);
  const [gestureLog, setGestureLog] = useState([]);
  const [hapticEnabled, setHapticEnabled] = useState(touchPreferences.hapticEnabled);
  const [soundEnabled, setSoundEnabled] = useState(touchPreferences.soundEnabled);

  const addGestureLog = (message) => {
    setGestureLog(prev => [...prev.slice(-4), { message, time: new Date().toLocaleTimeString() }]);
  };

  const toggleHaptic = () => {
    const newState = !hapticEnabled;
    touchPreferences.hapticEnabled = newState;
    setHapticEnabled(newState);
    if (newState) haptic.success();
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    touchPreferences.soundEnabled = newState;
    setSoundEnabled(newState);
    if (newState) playSound.success();
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-4xl mx-auto">
{/* Header */}
        <div className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-5 shadow-lg border-2 border-purple-400">
          <h1 className="text-lg font-bold text-white flex items-center space-x-3 mb-1">
            <Smartphone className="w-7 h-7" />
            <span>Touch Screen Demo</span>
          </h1>
          <p className="text-purple-50 text-lg">
            Test haptic feedback, sounds, and offline downloads
          </p>
        </div>

        {/* Settings Toggle */}
        <div className="mb-6 bg-[#e8fafa] rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Vibrate className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-bold text-gray-900">Haptic Feedback</p>
                  <p className="text-sm text-gray-600">Vibration on touch</p>
                </div>
              </div>
              <button
                onClick={toggleHaptic}
                className={`
                  w-16 h-8 rounded-full transition-all duration-200 relative
                  ${hapticEnabled ? 'bg-teal-500' : 'bg-gray-300'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-6 h-6 bg-[#e8fafa] rounded-full shadow-md transition-all
                    ${hapticEnabled ? 'right-1' : 'left-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-6 h-6 text-teal-600" />
                <div>
                  <p className="font-bold text-gray-900">Sound Effects</p>
                  <p className="text-sm text-gray-600">Audio feedback</p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`
                  w-16 h-8 rounded-full transition-all duration-200 relative
                  ${soundEnabled ? 'bg-teal-500' : 'bg-gray-300'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-6 h-6 bg-[#e8fafa] rounded-full shadow-md transition-all
                    ${soundEnabled ? 'right-1' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Haptic Feedback Demo */}
        <div className="mb-6 bg-[#e8fafa] rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Vibrate className="w-6 h-6 text-purple-600" />
            <span>Haptic Feedback Patterns</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <TouchButton
              onClick={() => haptic.light()}
              variant="secondary"
              size="medium"
              hapticFeedback="light"
            >
              Light
            </TouchButton>
            <TouchButton
              onClick={() => haptic.medium()}
              variant="secondary"
              size="medium"
              hapticFeedback="medium"
            >
              Medium
            </TouchButton>
            <TouchButton
              onClick={() => haptic.strong()}
              variant="secondary"
              size="medium"
              hapticFeedback="strong"
            >
              Strong
            </TouchButton>
            <TouchButton
              onClick={() => haptic.success()}
              variant="success"
              size="medium"
              hapticFeedback="success"
            >
              Success
            </TouchButton>
            <TouchButton
              onClick={() => haptic.error()}
              variant="danger"
              size="medium"
              hapticFeedback="strong"
            >
              Error
            </TouchButton>
            <TouchButton
              onClick={() => haptic.warning()}
              variant="warning"
              size="medium"
              hapticFeedback="medium"
            >
              Warning
            </TouchButton>
          </div>
        </div>

        {/* Sound Effects Demo */}
        <div className="mb-6 bg-[#e8fafa] rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Volume2 className="w-6 h-6 text-teal-600" />
            <span>Sound Effects</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <TouchButton
              onClick={() => playSound.tap()}
              variant="secondary"
              size="medium"
              soundFeedback={false}
            >
              Tap
            </TouchButton>
            <TouchButton
              onClick={() => playSound.click()}
              variant="secondary"
              size="medium"
              soundFeedback={false}
            >
              Click
            </TouchButton>
            <TouchButton
              onClick={() => playSound.success()}
              variant="success"
              size="medium"
              soundFeedback={false}
            >
              Success
            </TouchButton>
            <TouchButton
              onClick={() => playSound.error()}
              variant="danger"
              size="medium"
              soundFeedback={false}
            >
              Error
            </TouchButton>
            <TouchButton
              onClick={() => playSound.notification()}
              variant="warning"
              size="medium"
              soundFeedback={false}
            >
              Notify
            </TouchButton>
            <TouchButton
              onClick={() => playSound.select()}
              variant="secondary"
              size="medium"
              soundFeedback={false}
            >
              Select
            </TouchButton>
          </div>
        </div>

        {/* Button Sizes Demo */}
        <div className="mb-6 bg-[#e8fafa] rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Hand className="w-6 h-6 text-teal-600" />
            <span>Touch Target Sizes (WCAG 2.5.5)</span>
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <TouchButton variant="primary" size="small">
                Small (44px min)
              </TouchButton>
              <span className="text-sm text-gray-600">Minimum WCAG size</span>
            </div>
            <div className="flex items-center space-x-3">
              <TouchButton variant="primary" size="medium">
                Medium (48px)
              </TouchButton>
              <span className="text-sm text-gray-600">Recommended size</span>
            </div>
            <div className="flex items-center space-x-3">
              <TouchButton variant="primary" size="large">
                Large (56px)
              </TouchButton>
              <span className="text-sm text-gray-600">Easy to tap</span>
            </div>
            <div className="flex items-center space-x-3">
              <TouchButton variant="primary" size="xl">
                Extra Large (64px)
              </TouchButton>
              <span className="text-sm text-gray-600">Very easy to tap</span>
            </div>
          </div>
        </div>

        {/* Icon Buttons Demo */}
        <div className="mb-6 bg-[#e8fafa] rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Icon Buttons</h2>
          <div className="flex items-center space-x-3">
            <TouchIconButton
              icon={Settings}
              onClick={() => addGestureLog('Settings tapped')}
              variant="ghost"
              size="small"
              ariaLabel="Settings"
            />
            <TouchIconButton
              icon={Plus}
              onClick={() => addGestureLog('Plus tapped')}
              variant="primary"
              size="medium"
              ariaLabel="Add"
            />
            <TouchIconButton
              icon={CheckCircle}
              onClick={() => addGestureLog('Check tapped')}
              variant="secondary"
              size="large"
              ariaLabel="Confirm"
            />
          </div>
        </div>

        {/* Card Buttons Demo */}
        <div className="mb-6 bg-[#e8fafa] rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Touch-Optimized Cards</h2>
          <div className="space-y-3">
            <TouchCardButton
              title="Download Resources"
              description="Get educational materials for offline access"
              icon={Download}
              onClick={() => setShowDownloads(true)}
            />
            <TouchCardButton
              title="Enable Features"
              description="Haptic feedback and sound effects"
              icon={Zap}
              onClick={() => addGestureLog('Features card tapped')}
            />
          </div>
        </div>

        {/* Gesture Detection Demo */}
        <div className="mb-6 bg-[#e8fafa] rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Gesture Detection</h2>
          <div
            className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl p-8 mb-4 text-center border-2 border-teal-300"
            onTouchStart={(e) => {
              const element = e.currentTarget;
              const detector = new TouchGestureDetector(element, {
                onTap: () => addGestureLog('† Tap detected'),
                onSwipe: (direction) => addGestureLog(`‰ Swipe ${direction}`),
                onLongPress: () => addGestureLog('±ï¸ Long press detected')
              });
              
              // Cleanup on touch end
              element.addEventListener('touchend', () => detector.destroy(), { once: true });
            }}
          >
            <p className="text-xl font-bold text-teal-900 mb-2">Touch Me!</p>
            <p className="text-sm text-teal-700">Try tap, swipe, or long press</p>
          </div>

          {/* Gesture Log */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <p className="font-bold text-gray-900 mb-2">Gesture Log:</p>
            {gestureLog.length === 0 ? (
              <p className="text-sm text-gray-500">No gestures detected yet...</p>
            ) : (
              <div className="space-y-1">
                {gestureLog.map((log, index) => (
                  <div key={index} className="text-sm text-gray-700 flex items-center justify-between">
                    <span>{log.message}</span>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Offline Resources */}
        <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Download className="w-6 h-6 text-green-600" />
            <span>Offline Educational Resources</span>
          </h2>
          <p className="text-gray-700 mb-4">
            Download 10 educational resources for offline access. Includes palliative care guides,
            pain management, family support, and more.
          </p>
          <TouchButton
            onClick={() => setShowDownloads(true)}
            variant="success"
            size="large"
          >
            Open Download Manager
          </TouchButton>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>What's Implemented</span>
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>... Touch-optimized buttons (44px+ min)</li>
              <li>... Haptic feedback (8 patterns)</li>
              <li>... Sound effects (7 types)</li>
              <li>... Gesture detection (tap, swipe, long-press)</li>
              <li>... Offline resource downloads</li>
              <li>... IndexedDB storage</li>
              <li>... WCAG 2.5.5 compliant</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Mobile Optimized</span>
            </h3>
            <ul className="space-y-1 text-sm text-purple-800">
              <li>± Responsive design</li>
              <li>† Touch-first interactions</li>
              <li> Vibration feedback</li>
              <li>Š Audio feedback</li>
              <li>¥ Offline downloads</li>
              <li>‡¬‡­ Ghana context</li>
              <li> Fully accessible</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Action Button Demo */}
      <TouchFAB
        icon={Download}
        onClick={() => setShowDownloads(true)}
        position="bottom-right"
        ariaLabel="Download resources"
      />

      {/* Download Manager Modal */}
      <ResourceDownloadManagerUI
        isOpen={showDownloads}
        onClose={() => setShowDownloads(false)}
      />
    </div>
  );
}

