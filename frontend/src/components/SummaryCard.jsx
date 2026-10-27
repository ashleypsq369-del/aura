import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/**
 * SummaryCard - Interactive card for drill-down navigation
 * Shows summary info and navigates to detail page on click
 * 
 * @param {Component} icon - Lucide icon component
 * @param {string} title - Card title
 * @param {string} summary - Brief summary text (1-2 lines)
 * @param {string} status - Status indicator (normal|warning|critical)
 * @param {Function} onClick - Navigation handler
 * @param {string} badge - Optional badge text
 * @param {string} badgeColor - Badge color class
 */
export default function SummaryCard({ 
  icon: Icon, 
  title, 
  summary, 
  status = 'normal',
  onClick,
  badge,
  badgeColor = 'bg-blue-100 text-teal-700 border-blue-300'
}) {
  const statusColors = {
    normal: 'border-slate-200 hover:border-teal-400',
    warning: 'border-amber-300 hover:border-amber-500',
    critical: 'border-red-300 hover:border-red-500',
    success: 'border-green-300 hover:border-green-500'
  };

  const iconColors = {
    normal: 'text-teal-600 bg-teal-50',
    warning: 'text-amber-600 bg-amber-50',
    critical: 'text-red-600 bg-red-50',
    success: 'text-green-600 bg-green-50'
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-slate-50 rounded-2xl p-6 border-3 ${statusColors[status]} hover:shadow-xl transition-all cursor-pointer group`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className={`p-2.5 rounded-xl ${iconColors[status]} border-2 border-slate-200`}>
              <Icon className="w-6 h-6" strokeWidth={2.5} />
            </div>
          )}
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        </div>
        
        {badge && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      
      {/* Summary Text */}
      <p className="text-gray-600 mb-4 text-sm leading-relaxed min-h-[2.5rem]">
        {summary}
      </p>
      
      {/* View Details Button */}
      <div className="flex items-center space-x-2 text-teal-600 font-bold text-sm group-hover:text-teal-700">
        <span>View Details</span>
        <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}
