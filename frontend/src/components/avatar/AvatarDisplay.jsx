/**
 * AvatarDisplay — profile photo with 3-tier fallback
 * 1. Real uploaded photo from /uploads/profiles/
 * 2. DiceBear role+gender cartoon (auto-generated)
 * 3. Initials circle
 *
 * Listens to a custom 'avatar:updated' window event so the photo
 * shows immediately after upload without waiting for cache invalidation.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

const API_BASE = import.meta.env.VITE_API_URL?.trim() || '';

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

export default function AvatarDisplay({ size = 36, className = '', onClick, showRing = false, userId = null }) {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  // overrideUrl: set immediately on upload via window event, bypasses cache
  const [overrideUrl, setOverrideUrl]   = useState(null);
  const [imgErr, setImgErr]             = useState(false);
  const [dicebearErr, setDicebearErr]   = useState(false);

  // Listen for 'avatar:updated' event fired by Profile.jsx right after upload
  useEffect(() => {
    const handler = (e) => {
      setOverrideUrl(e.detail.url);   // e.g. /uploads/profiles/uuid.jpg
      setImgErr(false);               // clear any previous load error
      setDicebearErr(false);
    };
    window.addEventListener('avatar:updated', handler);
    return () => window.removeEventListener('avatar:updated', handler);
  }, []);

  // Background query — populates on load / after page refresh
  const { data: profile } = useQuery({
    queryKey:  ['profile-avatar', targetId],
    queryFn:   () => apiClient.get('/api/profile').then(r => r.data),
    enabled:   !!targetId && !userId,
    staleTime: 30 * 1000,   // 30s — short but not 0 (avoids thrashing)
    retry:     false,
  });

  // Prefer overrideUrl (just uploaded), then DB value from query
  const dbUrl     = profile?.avatar_url || profile?.profile?.avatar_url || null;
  const avatarUrl = overrideUrl || dbUrl;
  const gender    = profile?.gender    || user?.gender;
  const role      = profile?.role      || user?.role;
  const name      = profile?.full_name || user?.full_name;

  // Reset imgErr when URL changes
  useEffect(() => { setImgErr(false); }, [avatarUrl]);

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

  // 1. Real photo
  if (avatarUrl && !imgErr) {
    const base = avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}`;
    // Cache-bust: use last 8 chars of UUID filename — stable across renders, changes per upload
    const bust = avatarUrl.split('/').pop()?.replace(/\.[^.]+$/, '').slice(-8) || '1';
    return (
      <div style={wrap} className={className} onClick={onClick}>
        <img src={`${base}?v=${bust}`} alt={name || 'Profile photo'}
          onError={() => setImgErr(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
      </div>
    );
  }

  // 2. DiceBear cartoon
  if (!dicebearErr) {
    return (
      <div style={wrap} className={className} onClick={onClick}>
        <img src={dicebearUrl(role, gender)} alt={name || 'Avatar'}
          onError={() => setDicebearErr(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
      </div>
    );
  }

  // 3. Initials
  return (
    <div style={{ ...wrap, overflow:'visible' }} className={className} onClick={onClick}>
      <InitialsBubble name={name} size={size} role={role}/>
    </div>
  );
}

export { dicebearUrl };
