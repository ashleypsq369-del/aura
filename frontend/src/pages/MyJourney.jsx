import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Calendar, Loader2, MapPin,
  Activity, Pill, AlertTriangle, Stethoscope, Star,
  UserPlus, TrendingUp, FileText
} from 'lucide-react';
import apiClient from '../api/client';
import PageHeader from '../components/PageHeader';

const EVENT_TYPES = [
  { value: 'all', label: 'All Events', icon: Clock },
  { value: 'admission', label: 'Admissions', icon: UserPlus },
  { value: 'pathway_change', label: 'Care Changes', icon: TrendingUp },
  { value: 'high_alert', label: 'Critical Alerts', icon: AlertTriangle },
  { value: 'medication_change', label: 'Medications', icon: Pill },
  { value: 'appointment', label: 'Appointments', icon: Calendar },
  { value: 'assessment', label: 'Assessments', icon: Stethoscope },
  { value: 'milestone', label: 'Milestones', icon: Star },
];

export default function MyJourney() {
  const navigate = useNavigate();
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, 30days, 90days

  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => {
      const response = await apiClient.get('/api/bereavement/my-patient');
      return response.data;
    },
  });

  const patientId = patientData?.patient_id ?? patientData?.patient?.id ?? null;

  const { data: journeyData, isLoading } = useQuery({
    queryKey: ['journey', patientId, selectedEventType],
    queryFn: async () => {
      const response = await apiClient.get(`/api/journey/patients/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
    refetchInterval: 30000,
  });

  // Extract events from the journey data (API returns array directly)
  const events = Array.isArray(journeyData) ? journeyData : [];

  // Filter by event type
  const filteredByType = selectedEventType === 'all' 
    ? events 
    : events.filter(event => event.event_type === selectedEventType);

  // Filter by date range
  const filteredEvents = filteredByType.filter(event => {
    if (dateRange === 'all') return true;
    
    const eventDate = new Date(event.created_at);
    const now = new Date();
    const daysAgo = dateRange === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
    
    return eventDate >= cutoffDate;
  });

  // Group events by date
  const groupedEvents = (filteredEvents || []).reduce((groups, event) => {
    const date = new Date(event.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  if (!patientId && !patientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border border-slate-200 p-8 max-w-sm text-center">
          <MapPin className="w-10 h-10 mx-auto mb-3 text-teal-400 opacity-60" />
          <h2 className="text-sm font-bold text-slate-900 mb-2">No Patient Linked</h2>
          <p className="text-xs text-slate-500">Your care journey timeline will appear here once your account is linked to a patient record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-0">
{/* Modern Header with image */}
        <PageHeader
          image="/resources/african/african-family-care.jpg"
          title="My Journey"
          subtitle="Your care journey timeline with key events and milestones"
          icon={MapPin}
        />

        {/* Filters */}
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((type, i) => {
              const Icon = type.icon;
              const grads = [
                'linear-gradient(135deg,#0d9488,#0891b2)',
                'linear-gradient(135deg,#1d4ed8,#0891b2)',
                'linear-gradient(135deg,#7c3aed,#4338ca)',
                'linear-gradient(135deg,#e11d48,#dc2626)',
                'linear-gradient(135deg,#be123c,#e11d48)',
                'linear-gradient(135deg,#1d4ed8,#0891b2)',
                'linear-gradient(135deg,#7c3aed,#4338ca)',
                'linear-gradient(135deg,#d97706,#ea580c)',
              ];
              const active = selectedEventType === type.value;
              return (
                <button key={type.value} onClick={() => setSelectedEventType(type.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active ? 'text-white border-transparent shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                  style={active ? { background: grads[i % grads.length] } : {}}
                >
                  <Icon size={12} /> {type.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all',     label: 'All Time'      },
              { value: '30days',  label: 'Last 30 days'  },
              { value: '90days',  label: 'Last 90 days'  },
            ].map(r => (
              <button key={r.value} onClick={() => setDateRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  dateRange === r.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No events found</h3>
            <p className="text-xs text-slate-400">
              {selectedEventType !== 'all'
                ? 'No events of this type in the selected period'
                : 'Your journey timeline will appear here as events are recorded'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-teal-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 ">{date}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Events */}
                <div className="relative pl-6 space-y-3">
                  {/* Timeline line - gradient */}
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 rounded-full"
                    style={{ background: 'linear-gradient(to bottom, #0d9488, #7c3aed, #e11d48)' }} />

                  {dateEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} isLast={index === dateEvents.length - 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredEvents.length > 0 && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedEventType('all')}
              className="stat-card-blue rounded-xl border border-slate-200 px-4 py-3 hover:shadow-sm transition-all text-left w-full cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500  mb-1">Total Events</p>
                  <p className="text-2xl font-bold text-slate-800 tabular-nums">{filteredEvents.length}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Activity size={18} className="text-teal-600" />
                </div>
              </div>
            </motion.button>

            <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              onClick={() => setSelectedEventType('pathway_change')}
              className="stat-card-amber rounded-xl border border-slate-200 px-4 py-3 hover:shadow-sm transition-all text-left w-full cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500  mb-1">Milestones</p>
                  <p className="text-2xl font-bold text-slate-800 tabular-nums">
                    {filteredEvents.filter(e => e.is_milestone).length}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star size={18} className="text-amber-500" />
                </div>
              </div>
            </motion.button>

            <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              onClick={() => navigate('/alerts')}
              className="stat-card-rose rounded-xl border border-slate-200 px-4 py-3 hover:shadow-sm transition-all text-left w-full cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500  mb-1">Critical Alerts</p>
                  <p className="text-2xl font-bold text-slate-800 tabular-nums">
                    {filteredEvents.filter(e => e.event_type === 'high_alert').length}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
              </div>
            </motion.button>

            <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              onClick={() => navigate('/appointments')}
              className="stat-card-emerald rounded-xl border border-slate-200 px-4 py-3 hover:shadow-sm transition-all text-left w-full cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500  mb-1">Appointments</p>
                  <p className="text-2xl font-bold text-slate-800 tabular-nums">
                    {filteredEvents.filter(e => e.event_type === 'appointment').length}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <Calendar size={18} className="text-green-600" />
                </div>
              </div>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event }) {
  const getEventIcon = (type) => {
    const map = {
      admission:          { icon: UserPlus,   bg: '#dbeafe', color: '#1d4ed8' },
      pathway_change:     { icon: TrendingUp, bg: '#ede9fe', color: '#7c3aed' },
      high_alert:         { icon: AlertTriangle, bg: '#fee2e2', color: '#e11d48' },
      medication_change:  { icon: Pill,       bg: '#ffe4e6', color: '#be123c' },
      appointment:        { icon: Calendar,   bg: '#dbeafe', color: '#1d4ed8' },
      assessment:         { icon: Stethoscope,bg: '#f0fdfa', color: '#0d9488' },
      milestone:          { icon: Star,       bg: '#fef3c7', color: '#d97706' },
    };
    return map[type] || { icon: Clock, bg: '#f1f5f9', color: '#64748b' };
  };

  const eventTypeGrad = (type) => ({
    admission:         'border-l-blue-500',
    pathway_change:    'border-l-violet-500',
    high_alert:        'border-l-red-500',
    medication_change: 'border-l-rose-500',
    appointment:       'border-l-blue-400',
    assessment:        'border-l-teal-500',
    milestone:         'border-l-amber-400',
  })[type] || 'border-l-slate-400';

  const { icon: Icon, bg, color } = getEventIcon(event.event_type);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      <div className={`absolute -left-[33px] w-5 h-5 rounded-full border-4 border-white shadow-lg z-10`}
        style={{ backgroundColor: event.is_milestone ? '#f59e0b' : color }} />

      <div className={`bg-[#f0f6fa] rounded-lg border border-slate-200 border-l-4 hover:shadow-sm transition-all ${
        event.is_milestone ? 'border-l-amber-400' : eventTypeGrad(event.event_type)
      } p-3`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bg, color }}>
            <Icon size={15} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-slate-900 leading-tight truncate">{event.event_title}</h3>
              {event.is_milestone && <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Clock size={10} /> {formatTime(event.created_at)}
              </span>
              <span className="chip-teal">
                {event.event_type.replace('_', ' ')}
              </span>
            </div>
            {event.event_detail && (
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{event.event_detail}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
