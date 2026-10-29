/**
 * AvatarDisplay — profile photo with real image support
 * Priority: 1) uploaded server photo  2) DiceBear role+gender avatar  3) initials
 *
 * Key fixes:
 * - staleTime: 0 so query always refetches after invalidation
 * - imgErr resets when avatarUrl changes (useEffect) so a new upload shows immediately
 * - gcTime: 0 so old cached data is discarded on invalidation
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

const API_BASE = import.meta.env.VITE_API_URL?.trim() || '';

// Deterministic role+gender avatar via DiceBear personas
function dicebearUrl(role, gender) {
  const seed = `aura-${role || 'user'}-${gender || 'neutral'}-v2`;
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1f4a5,ffdfbf&backgroundType=gradientLinear&radius=50`;
}

const ROLE_COLORS = {
  clinician: ['#0d9488','#0891b2'],
  caregiver: ['#059669','#0d9488'],
  patient:   ['#0891b2','#0369a1'],
  family:    ['#d97706','#ea580c'],
  admin:     ['#0d9488','#059669'],
  provider:  ['#7c3aed','#0d9488'],
};

function InitialsBubble({ name, size, role }) {
  const [c1, c2] = ROLE_COLORS[role] || ['#0d9488','#0891b2'];
  const initials = (name || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg,${c1},${c2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, flexShrink: 0,
      fontSize: Math.max(Math.floor(size * 0.36), 10),
    }}>
      {initials}
    </div>
  );
}

export default function AvatarDisplay({
  size = 36,
  className = '',
  onClick,
  showRing = false,
  userId = null,
}) {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const [imgErr, setImgErr]           = useState(false);
  const [dicebearErr, setDicebearErr] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile-avatar', targetId],
    queryFn:  () => apiClient.get('/api/profile').then(r => r.data),
    enabled:  !!targetId && !userId,
    staleTime: 0,          // always consider stale → refetch after invalidation
    gcTime:    0,          // don't cache between invalidations
    retry: false,
  });

  const avatarUrl = profile?.avatar_url || profile?.profile?.avatar_url || null;
  const gender    = profile?.gender     || user?.gender;
  const role      = profile?.role       || user?.role;
  const name      = profile?.full_name  || user?.full_name;

  // Reset imgErr whenever the URL changes (new upload) so the photo is retried
  useEffect(() => {
    setImgErr(false);
  }, [avatarUrl]);

  const ringStyle = showRing
    ? { boxShadow: '0 0 0 2px #0d9488, 0 0 0 4px rgba(13,148,136,0.18)' }
    : {};

  const wrap = {
    width: size, height: size, borderRadius: '50%',
    overflow: 'hidden', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    ...ringStyle,
  };

  // ── 1. Real uploaded photo ──
  if (avatarUrl && !imgErr) {
    // Add cache-busting param so browser doesn't serve the old 404'd image from cache
    const base = avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}`;
    const src  = `${base}?v=${Date.now()}`;
    return (
      <div style={wrap} className={className} onClick={onClick}>
        <img
          src={src}
          alt={name || 'Profile'}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  // ── 2. DiceBear role+gender avatar ──
  if (!dicebearErr) {
    return (
      <div style={wrap} className={className} onClick={onClick}>
        <img
          src={dicebearUrl(role, gender)}
          alt={name || 'Profile'}
          onError={() => setDicebearErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  // ── 3. Initials fallback ──
  return (
    <div style={{ ...wrap, overflow: 'visible' }} className={className} onClick={onClick}>
      <InitialsBubble name={name} size={size} role={role} />
    </div>
  );
}

export { dicebearUrl };
