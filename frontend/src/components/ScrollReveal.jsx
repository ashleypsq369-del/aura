/**
 * ScrollReveal.jsx
 * Wraps children with a smooth fade-in-up animation when scrolled into view.
 * Controlled by Settings → Features → Smooth Scroll Reveal.
 * Uses react-intersection-observer under the hood.
 * Respects prefers-reduced-motion.
 *
 * Usage:
 *   <ScrollReveal>
 *     <MyCard />
 *   </ScrollReveal>
 *
 *   <ScrollReveal delay={200} direction="left">
 *     <StatCard />
 *   </ScrollReveal>
 */
import { useInView } from 'react-intersection-observer';
import { useAppSettings } from '../context/AppSettingsContext';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',   // 'up' | 'down' | 'left' | 'right' | 'none'
  distance = 18,
  duration = 400,
  className = '',
  threshold = 0.12,
}) {
  const { featureSettings } = useAppSettings();
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  const disabled = !featureSettings.smoothScrollReveal || prefersReduced();

  const translateMap = {
    up:    `translateY(${distance}px)`,
    down:  `translateY(-${distance}px)`,
    left:  `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    none:  'none',
  };

  const style = disabled
    ? {}
    : {
        opacity:    inView ? 1 : 0,
        transform:  inView ? 'none' : translateMap[direction] || translateMap.up,
        transition: `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
        willChange: 'opacity, transform',
      };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
