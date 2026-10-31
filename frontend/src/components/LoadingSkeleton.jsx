/**
 * LoadingSkeleton — reusable shimmer skeletons for every data surface
 * Uses CSS vars so it works in both light and dark mode automatically.
 *
 * Exports:
 *   Skeleton          — single block with shimmer
 *   SkeletonCard      — card with header + lines
 *   SkeletonList      — N rows of avatar + text
 *   SkeletonTable     — table with N rows
 *   SkeletonStats     — row of stat tiles
 *   SkeletonPage      — full page loading state
 */
import { motion } from 'framer-motion';

const shimmer = {
  initial:  { opacity: 0.5 },
  animate:  { opacity: 1   },
  transition: { duration: 0.9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
};

/* ── Base shimmer block ──────────────────────────────────────── */
export function Skeleton({ className = '', style = {} }) {
  return (
    <motion.div
      {...shimmer}
      className={`rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, var(--card-border) 25%, color-mix(in srgb,var(--card-border) 60%,var(--card-bg)) 50%, var(--card-border) 75%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

/* ── Card skeleton ───────────────────────────────────────────── */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: 14, border: '1px solid var(--card-border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Skeleton style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 13, width: '60%', marginBottom: 6 }} />
          <Skeleton style={{ height: 10, width: '40%' }} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} style={{ height: 11, width: i === lines - 1 ? '70%' : '100%' }} />
      ))}
    </div>
  );
}

/* ── List skeleton (avatar + text rows) ─────────────────────── */
export function SkeletonList({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
          <Skeleton style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ height: 12, width: '50%', marginBottom: 6 }} />
            <Skeleton style={{ height: 10, width: '30%' }} />
          </div>
          <Skeleton style={{ height: 28, width: 72, borderRadius: 8, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

/* ── Table skeleton ──────────────────────────────────────────── */
export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div style={{ border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, padding: '12px 16px', background: 'color-mix(in srgb,var(--card-bg) 50%,var(--page-bg))' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} style={{ height: 10, width: '70%' }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, padding: '12px 16px', borderTop: '1px solid var(--card-border)', background: r % 2 === 0 ? 'var(--card-bg)' : 'transparent' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} style={{ height: 11, width: c === 0 ? '80%' : '60%' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Stat tiles skeleton ─────────────────────────────────────── */
export function SkeletonStats({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count},1fr)`, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--card-border)', padding: '14px 16px' }}>
          <Skeleton style={{ height: 10, width: '50%', marginBottom: 10 }} />
          <Skeleton style={{ height: 24, width: '40%', marginBottom: 6 }} />
          <Skeleton style={{ height: 9, width: '60%' }} />
        </div>
      ))}
    </div>
  );
}

/* ── Full page loading spinner with message ──────────────────── */
export function SkeletonPage({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--card-border)', borderTopColor: '#0d9488' }}
      />
      <p style={{ fontSize: 13, color: 'var(--text-500)', fontWeight: 600 }}>{message}</p>
    </div>
  );
}

/* ── Grid of skeleton cards ──────────────────────────────────── */
export function SkeletonGrid({ count = 6, cols = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(260px,1fr))`, gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}

export default Skeleton;

/* ── Legacy aliases for existing imports ──────────────────────── */
export const ListSkeleton = ({ items = 5 }) => <SkeletonList rows={items} />;
export const PageSkeleton = ({ message }) => <SkeletonPage message={message} />;
export const CardSkeleton = ({ lines }) => <SkeletonCard lines={lines} />;
export const TableSkeleton = ({ rows, cols }) => <SkeletonTable rows={rows} cols={cols} />;
