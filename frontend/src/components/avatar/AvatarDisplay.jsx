/**
 * AvatarDisplay.jsx - Compact avatar shown throughout the app
 * Reads saved avatar from localStorage, falls back to initials circle
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AvatarRenderer from './AvatarRenderer';
import { ROLE_PRESETS } from './avatarParts';
import { useAuth } from '../../context/AuthContext';

export default function AvatarDisplay({
  size = 36,
  className = '',
  onClick,
  showRing = false,
}) {
  const { user } = useAuth();
  const [avatarConfig, setAvatarConfig] = useState(null);

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem('user_avatar');
        if (saved) {
          setAvatarConfig(JSON.parse(saved));
        } else {
          // Default preset for role
          const preset = ROLE_PRESETS[user?.role] || ROLE_PRESETS.patient;
          setAvatarConfig({ ...preset, role: user?.role || 'patient' });
        }
      } catch {
        const preset = ROLE_PRESETS[user?.role] || ROLE_PRESETS.patient;
        setAvatarConfig({ ...preset, role: user?.role || 'patient' });
      }
    };

    load();
    // Listen for avatar updates from the builder
    window.addEventListener('avatar_updated', load);
    return () => window.removeEventListener('avatar_updated', load);
  }, [user?.role]);

  const initials = user?.full_name
    ?.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('') || 'U';

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`relative flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={onClick ? 'Edit avatar' : undefined}
    >
      {showRing && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #0d9488, #7c3aed)',
            padding: 2,
          }}
        />
      )}
      <div
        className={`${showRing ? 'absolute inset-[2px]' : 'w-full h-full'} rounded-full overflow-hidden bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center`}
        style={{ width: showRing ? undefined : size, height: showRing ? undefined : size }}
      >
        {avatarConfig ? (
          <AvatarRenderer config={avatarConfig} size={size * 1.3} />
        ) : (
          <span
            className="font-bold text-teal-700"
            style={{ fontSize: size * 0.38 }}
          >
            {initials}
          </span>
        )}
      </div>
    </motion.div>
  );
}
