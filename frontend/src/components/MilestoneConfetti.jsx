/**
 * MilestoneConfetti.jsx
 * Trigger celebration confetti on care milestones.
 * Respects prefers-reduced-motion and the feature flag.
 *
 * Usage:
 *   import { fireMilestone } from './MilestoneConfetti';
 *   fireMilestone();               // gentle burst
 *   fireMilestone('stars');        // stars variant
 *   fireMilestone('hearts');       // hearts (palliative care)
 */
import confetti from 'canvas-confetti';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Read feature flag directly from localStorage to avoid hook dependency */
const confettiEnabled = () => {
  try {
    const s = JSON.parse(localStorage.getItem('feature_settings') || '{}');
    return s.confettiOnMilestone !== false; // default true
  } catch { return true; }
};

export function fireMilestone(variant = 'burst') {
  if (prefersReducedMotion() || !confettiEnabled()) return;

  if (variant === 'hearts') {
    // Gentle hearts - appropriate for palliative/care contexts
    const heart = confetti.shapeFromText({ text: '💙', scalar: 2 });
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
      shapes: [heart],
      scalar: 2,
      gravity: 0.6,
      ticks: 180,
    });
    return;
  }

  if (variant === 'stars') {
    const star = confetti.shapeFromText({ text: '⭐', scalar: 1.5 });
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.55 },
      shapes: [star],
      scalar: 1.5,
      gravity: 0.7,
      ticks: 200,
    });
    return;
  }

  // Default - subtle professional burst (teal/cyan palette)
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.65 },
    colors: ['#0d9488', '#0891b2', '#06b6d4', '#14b8a6', '#ffffff'],
    ticks: 200,
    gravity: 0.8,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}

/** React component wrapper for declarative use */
export default function MilestoneConfetti({ trigger, variant = 'burst' }) {
  if (trigger) fireMilestone(variant);
  return null;
}
