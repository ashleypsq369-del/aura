import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * SHAP Waterfall Chart Component
 * Shows how features contribute cumulatively to the final prediction
 * Gap Analysis Priority 1: AI Explain/SHAP Integration
 */
export default function SHAPWaterfallChart({ 
  shapFeatures, 
  baseValue = 0.5, 
  finalPrediction 
}) {
  if (!shapFeatures || shapFeatures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No SHAP values available</p>
      </div>
    );
  }

  // Take top 6 features for waterfall
  const topFeatures = shapFeatures.slice(0, 6);
  
  // Calculate cumulative contributions
  let cumulativeValue = baseValue;
  const steps = [
    {
      label: 'Base Risk',
      value: baseValue,
      cumulative: baseValue,
      isBase: true
    }
  ];

  topFeatures.forEach((feature) => {
    cumulativeValue += feature.shap_value;
    steps.push({
      label: feature.feature_name,
      value: feature.shap_value,
      cumulative: cumulativeValue,
      display: feature.display_value || feature.feature_value,
      isPositive: feature.shap_value > 0
    });
  });

  // Add final prediction
  steps.push({
    label: 'Final Prediction',
    value: 0,
    cumulative: finalPrediction || cumulativeValue,
    isFinal: true
  });

  const minValue = Math.min(...steps.map(s => s.cumulative), 0);
  const maxValue = Math.max(...steps.map(s => s.cumulative), 1);
  const range = maxValue - minValue;

  const getYPosition = (value) => {
    return ((maxValue - value) / range) * 100;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Risk Contribution Waterfall</h3>
      
      {/* Waterfall visualization */}
      <div className="relative h-96 bg-gradient-to-b from-gray-50 to-white rounded-lg border-2 border-gray-200 p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{(maxValue * 100).toFixed(0)}%</span>
          <span>{((maxValue + minValue) / 2 * 100).toFixed(0)}%</span>
          <span>{(minValue * 100).toFixed(0)}%</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => (
            <div
              key={pct}
              className="absolute w-full border-t border-gray-200 border-dashed"
              style={{ top: `${pct}%` }}
            />
          ))}

          {/* Waterfall bars */}
          <div className="flex items-end justify-between h-full">
            {steps.map((step, idx) => {
              const prevCumulative = idx > 0 ? steps[idx - 1].cumulative : baseValue;
              const yStart = getYPosition(Math.max(prevCumulative, step.cumulative));
              const yEnd = getYPosition(Math.min(prevCumulative, step.cumulative));
              const barHeight = Math.abs(yEnd - yStart);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full relative">
                  {/* Connector arrow */}
                  {idx > 0 && idx < steps.length - 1 && (
                    <div 
                      className="absolute left-0 w-full flex items-center justify-center text-gray-400"
                      style={{ 
                        top: `${getYPosition(prevCumulative)}%`,
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <ArrowRight size={16} className="opacity-30" />
                    </div>
                  )}

                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className={`w-16 rounded-t-lg ${
                      step.isBase 
                        ? 'bg-gray-400 border-2 border-gray-500' 
                        : step.isFinal
                        ? 'bg-purple-600 border-2 border-purple-700'
                        : step.isPositive
                        ? 'bg-red-500 border-2 border-red-600'
                        : 'bg-green-500 border-2 border-green-600'
                    } shadow-lg`}
                    style={{ 
                      position: 'absolute',
                      bottom: 0,
                      top: `${yStart}%`,
                    }}
                  />

                  {/* Value label */}
                  <div 
                    className="absolute text-xs font-bold whitespace-nowrap"
                    style={{ 
                      top: `${yStart - 4}%`,
                      transform: 'translateY(-100%)'
                    }}
                  >
                    <span className={
                      step.isBase 
                        ? 'text-gray-700' 
                        : step.isFinal
                        ? 'text-purple-700'
                        : step.isPositive
                        ? 'text-red-700'
                        : 'text-green-700'
                    }>
                      {(step.cumulative * 100).toFixed(0)}%
                    </span>
                    {!step.isBase && !step.isFinal && (
                      <span className="ml-1 text-gray-500">
                        ({step.value > 0 ? '+' : ''}{(step.value * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>

                  {/* Feature label */}
                  <div className="absolute bottom-0 transform translate-y-full mt-2 text-center">
                    <p className="text-xs font-semibold text-gray-700 mt-1 max-w-20 break-words">
                      {step.label}
                    </p>
                    {step.display && (
                      <p className="text-xs text-gray-500">{step.display}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">How to read:</span> Starting from the base risk 
          ({(baseValue * 100).toFixed(0)}%), each feature either increases (↑ red) or 
          decreases (↓ green) the risk. The final prediction is {(finalPrediction * 100).toFixed(0)}%.
        </p>
      </div>
    </div>
  );
}
