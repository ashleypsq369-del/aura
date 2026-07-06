/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { prefersReducedMotion, getSpringConfig } from '../utils/animations';

/**
 * Hook to detect and respect user's motion preferences
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

/**
 * Hook to get safe animation duration
 */
export function useAnimationDuration(normalDuration = 300) {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? 0 : normalDuration;
}

/**
 * Hook to get safe spring config
 */
export function useSpringConfig() {
  return getSpringConfig();
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [element, threshold]);

  return [setElement, isVisible];
}

/**
 * Hook for counting animation
 */
export function useCountAnimation(end, duration = 1000, decimals = 0) {
  const [count, setCount] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setCount(end);
      return;
    }

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * end * Math.pow(10, decimals)) / Math.pow(10, decimals));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, decimals, reducedMotion]);

  return count;
}

/**
 * Hook for sequential animations
 */
export function useSequentialAnimation(count, delay = 100) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setActiveIndex(count - 1);
      return;
    }

    let timeouts = [];

    for (let i = 0; i < count; i++) {
      timeouts.push(
        setTimeout(() => {
          setActiveIndex(i);
        }, i * delay)
      );
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [count, delay, reducedMotion]);

  return activeIndex;
}

export default {
  useReducedMotion,
  useAnimationDuration,
  useSpringConfig,
  useScrollAnimation,
  useCountAnimation,
  useSequentialAnimation
};
