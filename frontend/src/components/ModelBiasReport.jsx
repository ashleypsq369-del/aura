/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, AlertTriangle, CheckCircle, TrendingUp, Users, Filter } from 'lucide-react';
import { ethicsAPI } from '../api/client';

/**
 * Model Bias Report
 * 
 * Priority 4: Biomedical Ethics
 * Addresses Tilala et al. (2024) - Justice principle (fairness)
 * 
 * Features:
 * - Demographic fairness analysis
 * - Risk score distribution by age, gender, region, diagnosis
 * - Identifies disparities in model predictions
 * - Admin-only access
 * - Actionable insights for model improvement
 */

export default function ModelBiasReport() {
  const [biasData, setBiasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('age');
  const [threshold, setThreshold] = useState(0.15); // 15% disparity threshold

  const fetchBiasReport = async () => {
    setLoading(true);
    try {
      const response = await ethicsAPI.getBiasReport();
      setBiasData(response.data);
    } catch (error) {
      console.error('Failed to fetch bias report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiasReport();
  }, []);

  const categories = [
    { value: 'age', label: 'Age Group', icon: Users },
    { value: 'gender', label: 'Gender', icon: Users },
    { value: 'region', label: 'Region', icon: Filter },
    { value: 'diagnosis', label: 'Diagnosis', icon: BarChart3 }
  ];

  const getCategoryData = () => {
    if (!biasData || !biasData.by_category) return null;
    return biasData.by_category[selectedCategory] || null;
  };

  const getDisparityStatus = (disparity) => {
    if (Math.abs(disparity) > threshold) {
      return { color: 'red', label: 'High Disparity', icon: AlertTriangle };
    } else if (Math.abs(disparity) > threshold / 2) {
      return { color: 'amber', label: 'Moderate Disparity', icon: TrendingUp };
    } else {
      return { color: 'green', label: 'Fair', icon: CheckCircle };
    }
  };

  const categoryData = getCategoryData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Analyzing Model Fairness...</p>
        </div>
      </div>
    );
  }

  if (!biasData) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
        <p className="text-red-800 font-semibold">Failed to load bias report data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={32} strokeWidth={2.5} />
          <div>
            <h2 className="text-2xl font-bold">Model Bias & Fairness Report</h2>
            <p className="text-purple-100 text-sm">Ensuring equitable AI predictions across demographics</p>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-slate-300 rounded-xl p-4">
          <p className="text-xs text-slate-600 font-semibold mb-1">Total Predictions</p>
          <p className="text-3xl font-bold text-slate-900">{biasData.overall.total_predictions || 0}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-xl p-4">
          <p className="text-xs text-slate-600 font-semibold mb-1">Average Risk Score</p>
          <p className="text-3xl font-bold text-slate-900">{(biasData.overall.mean_risk_score || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-xl p-4">
          <p className="text-xs text-slate-600 font-semibold mb-1">Std Deviation</p>
          <p className="text-3xl font-bold text-slate-900">{(biasData.overall.std_risk_score || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-xl p-4">
          <p className="text-xs text-slate-600 font-semibold mb-1">High Risk Count</p>
          <p className="text-3xl font-bold text-red-600">{biasData.overall.high_risk_count || 0}</p>
        </div>
      </div>

      {/* Category Selector */}
      <div className="bg-white border-2 border-slate-300 rounded-xl p-4">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Filter size={20} />
          Analyze By Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`p-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-500'
                    : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:border-purple-400'
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Disparity Threshold Selector */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
        <h3 className="font-bold text-amber-900 mb-2 text-sm flex items-center gap-2">
          <AlertTriangle size={18} />
          Disparity Alert Threshold
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.05"
            max="0.30"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="font-bold text-amber-900 text-lg">{(threshold * 100).toFixed(0)}%</span>
        </div>
        <p className="text-xs text-amber-700 mt-2">
          Groups with risk score differences &gt; {(threshold * 100).toFixed(0)}% will be flagged
        </p>
      </div>

      {/* Category Breakdown */}
      {categoryData && (
        <div className="bg-white border-2 border-slate-300 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-4">
            {categories.find((c) => c.value === selectedCategory)?.label} Analysis
          </h3>

          <div className="space-y-4">
            {Object.entries(categoryData).map(([group, data]) => {
              const disparity = data.disparity_from_mean || 0;
              const status = getDisparityStatus(disparity);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={group}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border-2 rounded-lg p-4 ${
                    status.color === 'red'
                      ? 'bg-red-50 border-red-400'
                      : status.color === 'amber'
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-green-50 border-green-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-base mb-1">{group}</h4>
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          size={16}
                          className={
                            status.color === 'red'
                              ? 'text-red-600'
                              : status.color === 'amber'
                              ? 'text-amber-600'
                              : 'text-green-600'
                          }
                        />
                        <span
                          className={`text-xs font-bold ${
                            status.color === 'red'
                              ? 'text-red-700'
                              : status.color === 'amber'
                              ? 'text-amber-700'
                              : 'text-green-700'
                          }`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{data.mean_risk_score.toFixed(2)}</p>
                      <p className="text-xs text-slate-600">Avg Risk Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-slate-600 font-semibold">Sample Size</p>
                      <p className="font-bold text-slate-900">{data.count}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">Std Dev</p>
                      <p className="font-bold text-slate-900">{data.std_risk_score.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">Disparity</p>
                      <p
                        className={`font-bold ${
                          Math.abs(disparity) > threshold
                            ? 'text-red-600'
                            : Math.abs(disparity) > threshold / 2
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}
                      >
                        {disparity > 0 ? '+' : ''}
                        {(disparity * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status.color === 'red'
                            ? 'bg-red-500'
                            : status.color === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(data.mean_risk_score * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 text-lg mb-3 flex items-center gap-2">
          <TrendingUp size={22} />
          Recommendations for Fairness
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">-</span>
            <span>
              <strong>High disparity groups</strong> may indicate model bias or genuine clinical differences.
              Investigate with clinical experts.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">-</span>
            <span>
              <strong>Small sample sizes</strong> (&lt;20) may cause unreliable statistics. Collect more data for these
              groups.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">-</span>
            <span>
              <strong>Re-train model</strong> with balanced sampling if persistent disparities are found across
              demographics.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">-</span>
            <span>
              <strong>Clinical validation</strong> required before attributing disparities to model bias vs. real-world
              health differences.
            </span>
          </li>
        </ul>
      </div>

      {/* Academic Citation */}
      <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-4 text-xs">
        <p className="text-slate-700">
          <strong>Citation:</strong> Til

ala et al. (2024) - Biomedical Ethics: Justice Principle. Fair and equitable
          distribution of AI benefits and risks across all patient demographics.
        </p>
      </div>
    </div>
  );
}
