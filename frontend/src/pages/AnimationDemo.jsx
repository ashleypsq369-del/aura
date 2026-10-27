import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  pageTransition, 
  fadeIn, 
  slideUp, 
  scaleIn, 
  alertAnimation,
} from '../utils/animations';
import AnimatedCard from '../components/animations/AnimatedCard';
import AnimatedButton from '../components/animations/AnimatedButton';
import AnimatedList, { AnimatedListItem } from '../components/animations/AnimatedList';
import { 
  AnimatedNumber, 
  PulsingVital, 
  AnimatedProgressBar,
  HeartbeatIcon,
  HealthDataSkeleton 
} from '../components/animations/HealthMetricAnimation';
import AnimatedModal, { ModalHeader, ModalBody, ModalFooter } from '../components/animations/AnimatedModal';

export default function AnimationDemo() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <motion.div 
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gray-50 p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          variants={fadeIn}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ž¬ Healthcare Animations Demo
          </h1>
          <p className="text-gray-600">
            Professional, accessible, and calming animations for healthcare applications
          </p>
        </motion.div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. Page Transition (You're seeing it now!) */}
          <motion.div
            variants={slideUp}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-teal-300"
          >
            <h2 className="text-xl font-bold mb-3 text-teal-700">¨ Page Transition</h2>
            <p className="text-gray-600 mb-3">
              This entire page faded in and slid up smoothly when loaded!
            </p>
            <div className="bg-teal-50 p-3 rounded-lg">
              <code className="text-sm">variants={'{pageTransition}'}</code>
            </div>
          </motion.div>

          {/* 2. Hover Cards */}
          <AnimatedCard
            hover={true}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-purple-300 cursor-pointer"
          >
            <h2 className="text-xl font-bold mb-3 text-purple-700">Ž¯ Hover Effect</h2>
            <p className="text-gray-600 mb-3">
              Hover over this card to see it lift and scale!
            </p>
            <div className="bg-purple-50 p-3 rounded-lg">
              <code className="text-sm">{'<AnimatedCard hover={true}>'}</code>
            </div>
          </AnimatedCard>

          {/* 3. Animated Numbers (Health Metrics) */}
          <motion.div
            variants={scaleIn}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-blue-300"
          >
            <h2 className="text-xl font-bold mb-3 text-teal-700">¢ Counting Animation</h2>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">
                  <AnimatedNumber value={120} suffix=" bpm" />
                </div>
                <div className="text-xs text-gray-500">Heart Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  <AnimatedNumber value={98} suffix="%" />
                </div>
                <div className="text-xs text-gray-500">O Sat</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  <AnimatedNumber value={36.5} decimals={1} suffix="C" />
                </div>
                <div className="text-xs text-gray-500">Temp</div>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <code className="text-sm">{'<AnimatedNumber value={120} />'}</code>
            </div>
          </motion.div>

          {/* 4. Progress Bars */}
          <motion.div
            variants={scaleIn}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-green-300"
          >
            <h2 className="text-xl font-bold mb-3 text-green-700">Š Progress Animation</h2>
            <div className="space-y-4 mb-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Recovery Progress</span>
                  <span className="font-bold">75%</span>
                </div>
                <AnimatedProgressBar percentage={75} color="bg-green-600" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Medication Adherence</span>
                  <span className="font-bold">90%</span>
                </div>
                <AnimatedProgressBar percentage={90} color="bg-teal-600" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Care Plan Completion</span>
                  <span className="font-bold">60%</span>
                </div>
                <AnimatedProgressBar percentage={60} color="bg-teal-600" />
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <code className="text-sm">{'<AnimatedProgressBar percentage={75} />'}</code>
            </div>
          </motion.div>

          {/* 5. Heartbeat Animation */}
          <motion.div
            variants={slideUp}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-red-300"
          >
            <h2 className="text-xl font-bold mb-3 text-red-700">{'\u2764\uFE0F'} Heartbeat Effect</h2>
            <div className="flex items-center justify-center py-6">
              <HeartbeatIcon className="text-6xl" />
            </div>
            <p className="text-gray-600 text-center mb-3">
              Perfect for vital signs indicators
            </p>
            <div className="bg-red-50 p-3 rounded-lg">
              <code className="text-sm">{'<HeartbeatIcon />'}</code>
            </div>
          </motion.div>

          {/* 6. Pulsing Vitals */}
          <motion.div
            variants={slideUp}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-amber-300"
          >
            <h2 className="text-xl font-bold mb-3 text-amber-700"> Pulsing Vital Signs</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <PulsingVital isPulse={true} className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">180/120</div>
                <div className="text-xs text-gray-600">BP - Critical!</div>
              </PulsingVital>
              <PulsingVital isPulse={false} className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">120/80</div>
                <div className="text-xs text-gray-600">BP - Normal</div>
              </PulsingVital>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <code className="text-sm">{'<PulsingVital isPulse={true} />'}</code>
            </div>
          </motion.div>

          {/* 7. Staggered List */}
          <motion.div
            variants={slideUp}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-indigo-300"
          >
            <h2 className="text-xl font-bold mb-3 text-indigo-700"> Staggered List</h2>
            <AnimatedList>
              {['Patient Check-in', 'Vital Signs Recorded', 'Medication Administered', 'Doctors Notes Added'].map((item, i) => (
                <AnimatedListItem 
                  key={i}
                  className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-green-500 text-lg">"</span>
                  <span className="text-gray-700">{item}</span>
                </AnimatedListItem>
              ))}
            </AnimatedList>
            <div className="bg-indigo-50 p-3 rounded-lg mt-3">
              <code className="text-sm">{'<AnimatedList> + <AnimatedListItem />'}</code>
            </div>
          </motion.div>

          {/* 8. Interactive Buttons */}
          <motion.div
            variants={scaleIn}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-pink-300"
          >
            <h2 className="text-xl font-bold mb-3 text-pink-700">˜ Interactive Buttons</h2>
            <div className="space-y-3 mb-3">
              <AnimatedButton
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg font-bold"
                onClick={() => setShowModal(true)}
              >
                Open Modal
              </AnimatedButton>
              <AnimatedButton
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-bold"
                loading={loading}
                onClick={handleLoadingDemo}
              >
                Loading Demo
              </AnimatedButton>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Hover and click to see scale effects!
            </p>
            <div className="bg-pink-50 p-3 rounded-lg mt-3">
              <code className="text-sm">{'<AnimatedButton loading={true} />'}</code>
            </div>
          </motion.div>

          {/* 9. Alert Animation */}
          <motion.div
            variants={alertAnimation}
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-orange-300"
          >
            <h2 className="text-xl font-bold mb-3 text-orange-700">⚠ï¸ Alert Animation</h2>
            <motion.div
              variants={alertAnimation}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-3"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚠ï¸</span>
                <div>
                  <div className="font-bold text-red-900">Critical Alert</div>
                  <div className="text-sm text-red-700">Patient requires immediate attention</div>
                </div>
              </div>
            </motion.div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <code className="text-sm">variants={'{alertAnimation}'}</code>
            </div>
          </motion.div>

          {/* 10. CSS Animations */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-3 border-cyan-300 animate-fade-in">
            <h2 className="text-xl font-bold mb-3 text-cyan-700">Ž¨ CSS Animations</h2>
            <div className="space-y-3 mb-3">
              <div className="p-3 bg-cyan-50 rounded-lg hover-lift cursor-pointer">
                hover-lift: Lifts on hover
              </div>
              <div className="p-3 bg-teal-50 rounded-lg hover-scale cursor-pointer">
                hover-scale: Scales on hover
              </div>
              <div className="p-3 bg-blue-50 rounded-lg hover-glow cursor-pointer">
                hover-glow: Glows on hover
              </div>
            </div>
            <div className="bg-cyan-50 p-3 rounded-lg">
              <code className="text-sm">className="hover-lift"</code>
            </div>
          </div>

          {/* 11. Scroll Animations (AOS) */}
          <div 
            data-aos="zoom-in"
            className="bg-white rounded-xl p-6 shadow-lg border-3 border-lime-300"
          >
            <h2 className="text-xl font-bold mb-3 text-lime-700">Scroll Animation</h2>
            <p className="text-gray-600 mb-3">
              This card animated in when scrolled into view!
            </p>
            <div className="bg-lime-50 p-3 rounded-lg">
              <code className="text-sm">data-aos="zoom-in"</code>
            </div>
          </div>

          {/* 12. Loading Skeleton */}
          <motion.div
            variants={slideUp}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
          >
            <h2 className="text-xl font-bold mb-3 text-slate-700"> Loading Skeleton</h2>
            <HealthDataSkeleton rows={3} />
            <div className="bg-slate-50 p-3 rounded-lg mt-3">
              <code className="text-sm">{'<HealthDataSkeleton rows={3} />'}</code>
            </div>
          </motion.div>
        </div>

        {/* Accessibility Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg"
        >
          <div className="flex items-start space-x-3">
            <span className="text-2xl"></span>
            <div>
              <h3 className="font-bold text-green-900 mb-1">Accessibility Built-In</h3>
              <p className="text-green-700 text-sm">
                All animations automatically respect <code>prefers-reduced-motion</code>. 
                Users who prefer reduced motion will see instant transitions instead of animations.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Demo */}
      <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader title="Animated Modal" onClose={() => setShowModal(false)} />
        <ModalBody>
          <p className="text-gray-600 mb-4">
            This modal smoothly slides up with a backdrop fade!
          </p>
          <div className="bg-teal-50 p-4 rounded-lg">
            <code className="text-sm">{'<AnimatedModal isOpen={true}>'}</code>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
          <AnimatedButton
            className="px-4 py-2 bg-teal-600 text-white rounded-lg"
            onClick={() => setShowModal(false)}
          >
            Got it!
          </AnimatedButton>
        </ModalFooter>
      </AnimatedModal>
    </motion.div>
  );
}

