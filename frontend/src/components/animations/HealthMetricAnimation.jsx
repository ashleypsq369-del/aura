import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';

/**
 * Animated Health Metric Display
 * Smooth number counting animation for health metrics
 */
export function AnimatedNumber({ value, duration = 1, decimals = 0, suffix = '' }) {

  const spring = useSpring({
    from: { number: 0 },
    to: { number: value },
    config: { duration: duration * 1000 }
  });

  return (
    <animated.span>
      {spring.number.to(n => n.toFixed(decimals))}
      {suffix}
    </animated.span>
  );
}

/**
 * Pulse Animation for Critical Vitals
 */
export function PulsingVital({ children, isPulse = false, className = '' }) {
  return (
    <motion.div
      className={className}
      animate={isPulse ? {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: isPulse ? Infinity : 0,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Progress Bar with Animation
 */
export function AnimatedProgressBar({ percentage, color = 'bg-teal-600', height = 'h-2' }) {
  return (
    <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden`}>
      <motion.div
        className={`${height} ${color} rounded-full`}
        initial={{ width: '0%' }}
        animate={{ width: `${percentage}%` }}
        transition={{
          duration: 1,
          ease: 'easeOut'
        }}
      />
    </div>
  );
}

/**
 * Heartbeat Icon Animation
 */
export function HeartbeatIcon({ className = '', color = 'text-red-600' }) {
  return (
    <motion.div
      className={`${className} ${color}`}
      animate={{
        scale: [1, 1.2, 1, 1.2, 1],
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
  );
}

/**
 * Loading Skeleton for Health Data
 */
export function HealthDataSkeleton({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          className="h-16 bg-gray-200 rounded-lg"
          animate={{
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
}

export default {
  AnimatedNumber,
  PulsingVital,
  AnimatedProgressBar,
  HeartbeatIcon,
  HealthDataSkeleton
};
