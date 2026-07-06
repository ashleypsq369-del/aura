import { motion } from 'framer-motion';

export default function EmptyState({ 
  icon = '📭', 
  title = 'No data found', 
  description = 'There are no items to display at the moment.', 
  action 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="text-7xl mb-6">{icon}</div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
        {title}
      </h3>
      <p className="text-gray-600 mb-8 max-w-md text-center leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          data-tip={action.label}
          className="px-6 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 active:scale-[0.97] shadow-md hover:shadow-lg transition-[transform,box-shadow]"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyPatients({ onAddClick }) {
  return (
    <EmptyState
      icon="👥"
      title="No patients yet"
      description="Get started by adding your first patient to the system. Their information will appear here."
      action={onAddClick ? {
        label: 'Add Patient',
        onClick: onAddClick
      } : undefined}
    />
  );
}

export function EmptyResources({ onBrowseClick }) {
  return (
    <EmptyState
      icon="📚"
      title="No resources found"
      description="We couldn't find any resources matching your criteria. Try adjusting your filters or browse all available resources."
      action={onBrowseClick ? {
        label: 'Browse All Resources',
        onClick: onBrowseClick
      } : undefined}
    />
  );
}

export function EmptyAlerts() {
  return (
    <EmptyState
      icon="✅"
      title="All clear!"
      description="There are no pending alerts at the moment. Your patients are stable and within normal ranges."
    />
  );
}

export function EmptyAppointments({ onScheduleClick }) {
  return (
    <EmptyState
      icon="📅"
      title="No appointments scheduled"
      description="There are no upcoming appointments. Schedule a new appointment to get started."
      action={onScheduleClick ? {
        label: 'Schedule Appointment',
        onClick: onScheduleClick
      } : undefined}
    />
  );
}

export function EmptyCommunity() {
  return (
    <EmptyState
      icon="💬"
      title="No posts yet"
      description="Be the first to share your thoughts and experiences with the community. Your story matters."
      action={{
        label: 'Create First Post',
        onClick: () => {}
      }}
    />
  );
}

export function EmptySearch({ query }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords or check your spelling.`}
    />
  );
}
