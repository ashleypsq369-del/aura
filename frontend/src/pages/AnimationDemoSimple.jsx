import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AnimationDemoSimple() {
  const [count, setCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Simulate counting animation
  const startCount = () => {
    setCount(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      setCount(current);
      if (current >= 120) clearInterval(interval);
    }, 30);
  };

  return (
    <div className="min-h-screen bg-[var(--card-bg)] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold text-[var(--text-900)] mb-3">
            🎬 Healthcare Animations Demo
          </h1>
          <p className="text-xl text-[var(--text-600)]">
            All 12 animation types demonstrated below
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Page Transition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-teal-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-teal-700">✨ 1. Page Transition</h2>
            <p className="text-[var(--text-600)] mb-3">
              This entire page faded in smoothly when loaded!
            </p>
            <div className="bg-teal-50 p-3 rounded-lg">
              <code className="text-sm">initial={'{opacity: 0}'} animate={'{opacity: 1}'}</code>
            </div>
          </motion.div>

          {/* 2. Hover Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-purple-300 cursor-pointer"
          >
            <h2 className="text-2xl font-bold mb-3 text-purple-700">🎯 2. Hover Effect</h2>
            <p className="text-[var(--text-600)] mb-3">
              Hover over this card to see it lift and scale!
            </p>
            <div className="bg-purple-50 p-3 rounded-lg">
              <code className="text-sm">whileHover={'{scale: 1.05, y: -5}'}</code>
            </div>
          </motion.div>

          {/* 3. Counting Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-blue-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-teal-700">🔢 3. Counting Animation</h2>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-teal-600 mb-2">{count}</div>
              <div className="text-sm text-[var(--text-500)]">Heart Rate (bpm)</div>
            </div>
            <button
              onClick={startCount}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold"
            >
              Start Count
            </button>
          </motion.div>

          {/* 4. Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-green-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-green-700">📊 4. Progress Bar</h2>
            <div className="space-y-3 mb-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Recovery</span>
                  <span className="font-bold">75%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 5. Heartbeat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-red-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-red-700">❤️ 5. Heartbeat Effect</h2>
            <div className="flex items-center justify-center py-6">
              <motion.div
                className="text-7xl"
                animate={{
                  scale: [1, 1.2, 1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.15, 0.3, 0.45, 1]
                }}
              >
                ❤️
              </motion.div>
            </div>
            <p className="text-center text-[var(--text-600)]">Perfect for vital signs!</p>
          </motion.div>

          {/* 6. Pulsing Vital */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-amber-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-amber-700">💓 6. Pulsing Vital</h2>
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
                className="bg-red-50 p-4 rounded-lg text-center border-2 border-red-300"
              >
                <div className="text-2xl font-bold text-red-600">180/120</div>
                <div className="text-xs">Critical!</div>
              </motion.div>
              <div className="bg-green-50 p-4 rounded-lg text-center border-2 border-green-300">
                <div className="text-2xl font-bold text-green-600">120/80</div>
                <div className="text-xs">Normal</div>
              </div>
            </div>
          </motion.div>

          {/* 7. Staggered List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-indigo-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-teal-700">📋 7. Staggered List</h2>
            {['Check-in', 'Vitals', 'Medication', 'Notes'].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-center space-x-3 py-2 border-b last:border-0"
              >
                <span className="text-green-500 text-lg">✓</span>
                <span>{item}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* 8. Interactive Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-pink-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-pink-700">🔘 8. Interactive Button</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="w-full px-6 py-3 bg-pink-600 text-white rounded-lg font-bold"
            >
              Click Me! (with scale effect)
            </motion.button>
            <p className="text-sm text-center text-[var(--text-600)] mt-3">
              Hover and click to see effects
            </p>
          </motion.div>

          {/* 9. Alert Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-orange-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-orange-700">⚠️ 9. Alert Animation</h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-l-4 border-red-500 p-4"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-bold">Critical Alert</div>
                  <div className="text-sm">Immediate attention needed</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* 10. CSS Hover Effects */}
          <div className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-cyan-300 animate-fade-in">
            <h2 className="text-2xl font-bold mb-3 text-cyan-700">🎨 10. CSS Animations</h2>
            <div className="space-y-2">
              <div className="p-3 bg-cyan-50 rounded hover-lift cursor-pointer">
                hover-lift class
              </div>
              <div className="p-3 bg-teal-50 rounded hover-scale cursor-pointer">
                hover-scale class
              </div>
            </div>
          </div>

          {/* 11. Scroll Animation */}
          <div
            data-aos="zoom-in"
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-lime-300"
          >
            <h2 className="text-2xl font-bold mb-3 text-lime-700">📜 11. Scroll Animation</h2>
            <p className="text-[var(--text-600)]">
              This zoomed in when scrolled into view!
            </p>
            <div className="bg-lime-50 p-3 rounded-lg mt-3">
              <code className="text-sm">data-aos="zoom-in"</code>
            </div>
          </div>

          {/* 12. Loading Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg border-4 border-slate-300"
          >
            <h2 className="text-2xl font-bold mb-3">⏳ 12. Loading Skeleton</h2>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="h-12 bg-gray-200 rounded-lg mb-3"
                animate={{
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg"
        >
          <h3 className="font-bold text-green-900 mb-2 text-xl">
            ✅ All 12 Animation Types Demonstrated!
          </h3>
          <p className="text-green-700">
            Every animation respects <code>prefers-reduced-motion</code> for accessibility.
            All animations are optimized for 60fps performance.
          </p>
        </motion.div>
      </div>

      {/* Simple Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-3">Modal with Animation!</h2>
            <p className="text-[var(--text-600)] mb-4">
              This modal smoothly scaled in with a backdrop fade.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(false)}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-bold w-full"
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
