import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * SHAP Bar Chart Component
 * Visualizes feature importance from SHAP values
 * Gap Analysis Priority 1: AI Explain/SHAP Integration
 */
export default function SHAPBarChart({ shapFeatures, title = "Feature Importance" }) {
 if (!shapFeatures || shapFeatures.length === 0) {
 return (
 <div className="text-center py-8 text-gray-500">
 <p>No SHAP values available</p>
 </div>
 );
 }

 // Take top 8 features
 const topFeatures = shapFeatures.slice(0, 8);
 
 // Find max absolute value for scaling
 const maxAbsValue = Math.max(...topFeatures.map(f => Math.abs(f.shap_value)));

 return (
 <div className="space-y-3">
 <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
 
 <div className="space-y-2">
 {topFeatures.map((feature, idx) => {
 const isPositive = feature.shap_value > 0;
 const percentage = (Math.abs(feature.shap_value) / maxAbsValue) * 100;
 
 return (
 <motion.div
 key={idx}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: idx * 0.05 }}
 className="group"
 >
 {/* Feature name and value */}
 <div className="flex items-center justify-between mb-1">
 <div className="flex items-center space-x-2">
 <span className="text-sm font-semibold text-gray-700">
 {feature.feature_name}
 </span>
 <span className="text-xs text-gray-500">
 ({feature.display_value || feature.feature_value})
 </span>
 </div>
 <div className="flex items-center space-x-1">
 {isPositive ? (
 <TrendingUp size={14} className="text-red-600" />
 ) : (
 <TrendingDown size={14} className="text-green-600" />
 )}
 <span className={`text-xs font-bold ${
 isPositive ? 'text-red-600' : 'text-green-600'
 }`}>
 {isPositive ? '+' : ''}{(feature.pct ?? Math.abs(feature.shap_value) * 100).toFixed(1)}% of impact
 </span>
 </div>
 </div>

 {/* Bar */}
 <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${percentage}%` }}
 transition={{ delay: idx * 0.05 + 0.2, duration: 0.6 }}
 className={`absolute top-0 ${isPositive ? 'right-0' : 'left-0'} h-full ${
 isPositive 
 ? 'bg-gradient-to-l from-red-500 to-red-400' 
 : 'bg-gradient-to-r from-green-500 to-green-400'
 } rounded-full`}
 style={{
 transformOrigin: isPositive ? 'right' : 'left'
 }}
 />
 </div>

 {/* Impact description */}
 <p className="text-xs text-gray-600 mt-1 pl-2">
 {isPositive ? 'Increases' : 'Decreases'} risk - {(feature.pct ?? Math.abs(feature.shap_value) * 100).toFixed(1)}% of total impact
 </p>
 </motion.div>
 );
 })}
 </div>

 {/* Legend */}
 <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200">
 <div className="flex items-center space-x-2">
 <div className="w-4 h-4 bg-red-500 rounded"></div>
 <span className="text-xs text-gray-600">Increases Risk</span>
 </div>
 <div className="flex items-center space-x-2">
 <div className="w-4 h-4 bg-green-500 rounded"></div>
 <span className="text-xs text-gray-600">Decreases Risk</span>
 </div>
 </div>
 </div>
 );
}
