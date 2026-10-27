/**
 * CaregiverTrustProfile
 * NMC badge, Ghana Card verified badge, star rating, specialisations.
 * Feature 3: Caregiver Trust Profile
 */
import { useQuery } from '@tanstack/react-query';
import { Shield, Award, Star, Users, MapPin, Stethoscope } from 'lucide-react';
import { trustProfileAPI } from '../api/client';

function StarRating({ value, total }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.5}
          className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-600'}
        />
      ))}
      {value != null && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1">
          {value.toFixed(1)}
        </span>
      )}
      {total > 0 && (
        <span className="text-[11px] text-slate-400">({total})</span>
      )}
    </div>
  );
}

function Badge({ icon: Icon, label, color = '#0d9488' }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}15`, color }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export default function CaregiverTrustProfile({ userId, inline = false }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['trust-profile', userId],
    queryFn: () => trustProfileAPI.get(userId).then(r => r.data),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3" />
      </div>
    );
  }

  if (!profile) return null;

  if (inline) {
    // Compact row for cards / lists
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {profile.nmc_pin && (
          <Badge icon={Award} label={`NMC: ${profile.nmc_pin}`} color="#0d9488" />
        )}
        {profile.ghana_card_verified && (
          <Badge icon={Shield} label="Ghana Card" color="#0891b2" />
        )}
        {profile.average_rating != null && (
          <StarRating value={profile.average_rating} total={profile.total_reviews} />
        )}
      </div>
    );
  }

  // Full card
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#e8fafa] dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"
        style={{ background: 'linear-gradient(to right, #0d948808, transparent)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm">
            {profile.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
              {profile.full_name}
            </p>
            {profile.professional_title && (
              <p className="text-[11px] text-teal-600 dark:text-teal-400">{profile.professional_title}</p>
            )}
          </div>
          {profile.is_professional && (
            <Badge icon={Shield} label="Verified" color="#0d9488" />
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Verification badges */}
        <div className="flex flex-wrap gap-2">
          {profile.nmc_pin && (
            <Badge icon={Award} label={`NMC PIN: ${profile.nmc_pin}`} color="#0d9488" />
          )}
          {profile.ghana_card_verified && (
            <Badge icon={Shield} label="Ghana Card Verified" color="#0891b2" />
          )}
        </div>

        {/* Rating */}
        {profile.average_rating != null ? (
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Service Rating</p>
            <StarRating value={profile.average_rating} total={profile.total_reviews} />
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">No reviews yet</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          {profile.specialisation && (
            <span className="flex items-center gap-1">
              <Stethoscope size={11} /> {profile.specialisation}
            </span>
          )}
          {profile.region && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {profile.region}
            </span>
          )}
          {profile.active_patients > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} /> {profile.active_patients} active patient{profile.active_patients !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
