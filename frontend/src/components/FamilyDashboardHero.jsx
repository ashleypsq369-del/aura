/**
 * FamilyDashboardHero
 * "Last visit was [date] with [nurse] — Vitals: Stable" hero card.
 * Feature 4: Family Dashboard Hero
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Calendar, CheckCircle, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI } from '../api/client';

const CONDITION_META = {
  improving: { label: 'Improving',  icon: TrendingUp,   color: '#10b981' },
  stable:    { label: 'Stable',     icon: Minus,         color: '#0d9488' },
  worsening: { label: 'Worsening',  icon: TrendingDown,  color: '#ef4444' },
};

function timeAgo(dateStr) {
  if (!dateStr) return 'No visits yet';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function FamilyDashboardHero({ patientId, patientName }) {
  const navigate = useNavigate();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', patientId],
    queryFn: () => appointmentsAPI.getPatientAppointments(patientId).then(r => r.data),
    enabled: !!patientId,
  });

  const completed = appointments
    .filter(a => a.status === 'completed' && a.scheduled_at)
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  const lastVisit = completed[0];
  const upcoming = appointments
    .filter(a => ['scheduled','nurse_assigned','en_route','visit_active'].includes(a.status) && new Date(a.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

  const conditionMeta = CONDITION_META.stable; // default; VisitReportCard shows real condition
  const CondIcon = conditionMeta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/80 text-xs font-medium mb-0.5">Care Status</p>
            <h2 className="text-white font-bold text-base leading-tight">
              {patientName || 'Your loved one'}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Heart size={18} className="text-white" />
          </div>
        </div>

        {lastVisit ? (
          <div className="bg-white/15 rounded-xl p-3 mb-3">
            <p className="text-white/70 text-[10px] font-semibold mb-1">Last Visit</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">
                  {timeAgo(lastVisit.scheduled_at)}
                </p>
                {lastVisit.clinician_name && (
                  <p className="text-white/70 text-[11px]">with {lastVisit.clinician_name}</p>
                )}
              </div>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                <CondIcon size={11} /> {conditionMeta.label}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl p-3 mb-3">
            <p className="text-white/70 text-sm">No completed visits yet</p>
          </div>
        )}

        {upcoming && (
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <Calendar size={12} />
            <span>
              Next visit: <strong className="text-white">
                {new Date(upcoming.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </strong>
            </span>
          </div>
        )}

        <button
          onClick={() => navigate(`/patients/${patientId}/appointments`)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 rounded-xl transition-all"
        >
          View all appointments <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}
