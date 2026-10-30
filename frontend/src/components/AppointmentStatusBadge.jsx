/**
 * AppointmentStatusBadge
 * Visual 6-step stepper showing the enhanced appointment flow.
 * Feature 2: Enhanced Appointment Status Flow
 */
import { CheckCircle, Clock, Truck, Activity, FileText, Star } from 'lucide-react';

const STEPS = [
  { key: 'scheduled',      label: 'Scheduled',     icon: Clock },
  { key: 'nurse_assigned', label: 'Nurse Assigned', icon: Star },
  { key: 'en_route',       label: 'En Route',       icon: Truck },
  { key: 'visit_active',   label: 'Visit Active',   icon: Activity },
  { key: 'report_ready',   label: 'Report Ready',   icon: FileText },
  { key: 'completed',      label: 'Completed',      icon: CheckCircle },
];

// cancelled / no_show are shown as a simple badge
const TERMINAL_STATUSES = {
  cancelled:    { label: 'Cancelled',    color: '#ef4444' },
  no_show:      { label: 'No Show',      color: '#f97316' },
};

export default function AppointmentStatusBadge({ status = 'scheduled', compact = false }) {
  if (TERMINAL_STATUSES[status]) {
    const { label, color } = TERMINAL_STATUSES[status];
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: `${color}18`, color }}
      >
        {label}
      </span>
    );
  }

  const currentIdx = STEPS.findIndex(s => s.key === status);
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;

  if (compact) {
    // Pill badge only
    const step = STEPS[safeIdx];
    const Icon = step.icon;
    const isComplete = status === 'completed';
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: isComplete ? '#0d948818' : '#0891b218',
          color: isComplete ? '#0d9488' : '#0891b2',
        }}
      >
        <Icon size={11} strokeWidth={2.5} />
        {step.label}
      </span>
    );
  }

  // Full stepper
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = idx < safeIdx;
        const isCurrent = idx === safeIdx;
        const isLast = idx === STEPS.length - 1;

        const dotColor = isDone
          ? '#0d9488'
          : isCurrent
            ? '#0891b2'
            : '#cbd5e1';
        const textColor = isDone || isCurrent ? '#0f172a' : '#94a3b8';

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                style={{ background: dotColor }}
              >
                <Icon size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <span
                className="mt-1 text-[11px] font-medium text-center leading-tight whitespace-nowrap"
                style={{ color: textColor }}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className="flex-1 h-0.5 mt-[-10px] transition-all"
                style={{ background: isDone ? '#0d9488' : '#e2e8f0', minWidth: 6 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
