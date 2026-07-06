/**
 * Resource Download Manager UI
 * Interface for downloading and managing offline educational resources
 */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Check, X, FileText, Video, Music, Book,
  Trash2, HardDrive, Wifi, WifiOff, ChevronDown, ChevronUp
} from 'lucide-react';
import TouchButton, { TouchIconButton } from './TouchButton';
import ResourceDownloadManager, { 
  ghanaEducationalResources, 
  downloadPresets 
} from '../utils/resourceDownloader';
import { haptic, playSound } from '../utils/touchSupport';

export default function ResourceDownloadManagerUI({ isOpen, onClose }) {
  const [downloader] = useState(() => new ResourceDownloadManager());
  const [downloaded, setDownloaded] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [storageInfo, setStorageInfo] = useState({ bytes: 0, formatted: '0 Bytes', count: 0 });
  const [selectedPreset, setSelectedPreset] = useState('essential');
  const [expandedCategory, setExpandedCategory] = useState(null);

  const loadDownloadedResources = useCallback(async () => {
    const resources = await downloader.getAllResources();
    setDownloaded(resources);
  }, [downloader]);

  const loadStorageInfo = useCallback(async () => {
    const info = await downloader.getStorageSize();
    setStorageInfo(info);
  }, [downloader]);

  useEffect(() => {
    if (isOpen) {
      loadDownloadedResources();
      loadStorageInfo();
    }
  }, [isOpen, loadDownloadedResources, loadStorageInfo]);

  const handleDownloadPreset = async (preset) => {
    setDownloading(true);
    haptic.medium();
    playSound.notification();

    const resources = downloadPresets[preset];
    
    const result = await downloader.downloadMultiple(resources, (progressInfo) => {
      setProgress(progressInfo);
    });

    setDownloading(false);
    setProgress(null);
    
    if (result.completed > 0) {
      haptic.success();
      playSound.success();
    }

    await loadDownloadedResources();
    await loadStorageInfo();
  };

  const handleDeleteResource = async (id) => {
    haptic.medium();
    await downloader.deleteResource(id);
    await loadDownloadedResources();
    await loadStorageInfo();
    playSound.click();
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all downloaded resources? This cannot be undone.')) {
      return;
    }

    haptic.strong();
    await downloader.clearAll();
    await loadDownloadedResources();
    await loadStorageInfo();
    playSound.click();
  };

  const getIconForFormat = (format) => {
    switch(format) {
      case 'pdf': return FileText;
      case 'mp4': return Video;
      case 'mp3': return Music;
      default: return Book;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      palliative_care_basics: 'bg-blue-100 text-blue-700',
      pain_management: 'bg-red-100 text-red-700',
      symptom_management: 'bg-green-100 text-green-700',
      family_support: 'bg-purple-100 text-purple-700',
      spiritual_care: 'bg-yellow-100 text-yellow-700',
      training_videos: 'bg-pink-100 text-pink-700',
      patient_resources: 'bg-cyan-100 text-cyan-700',
      quick_reference: 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const groupByCategory = (resources) => {
    return resources.reduce((groups, resource) => {
      const category = resource.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(resource);
      return groups;
    }, {});
  };

  const categoryLabels = {
    palliative_care_basics: 'Palliative Care Basics',
    pain_management: 'Pain Management',
    symptom_management: 'Symptom Management',
    family_support: 'Family Support',
    spiritual_care: 'Spiritual Care',
    training_videos: 'Training Videos',
    patient_resources: 'Patient Resources',
    quick_reference: 'Quick Reference'
  };

  const groupedResources = groupByCategory(ghanaEducationalResources);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-teal-200"
        >
          {/* Header */}
          <div className="p-6 border-b-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-teal-900 flex items-center space-x-3">
                <Download className="w-8 h-8" />
                <span>Offline Resources</span>
              </h2>
              <TouchIconButton
                icon={X}
                onClick={onClose}
                variant="ghost"
                size="medium"
                ariaLabel="Close"
              />
            </div>
            <p className="text-teal-700 text-sm">
              Download educational materials for offline access
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Storage Info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-bold text-gray-900">Storage Used</p>
                    <p className="text-sm text-gray-600">
                      {storageInfo.formatted} - {storageInfo.count} items
                    </p>
                  </div>
                </div>
                {storageInfo.count > 0 && (
                  <TouchButton
                    onClick={handleClearAll}
                    variant="danger"
                    size="small"
                    hapticFeedback="warning"
                  >
                    <div className="flex items-center space-x-2">
                      <Trash2 size={16} />
                      <span>Clear All</span>
                    </div>
                  </TouchButton>
                )}
              </div>
            </div>

            {/* Download Presets */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Download Packs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(downloadPresets).map((presetKey) => {
                  const preset = downloadPresets[presetKey];
                  const totalSize = preset.reduce((sum, r) => sum + (r.size || 0), 0);
                  
                  return (
                    <button
                      key={presetKey}
                      onClick={() => handleDownloadPreset(presetKey)}
                      disabled={downloading}
                      className={`
                        p-5 rounded-xl border-2 text-left
                        transition-all duration-150 touch-manipulation
                        ${downloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-50 hover:border-teal-400 active:scale-98'}
                        ${selectedPreset === presetKey ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'}
                      `}
                      onTouchStart={() => {
                        if (!downloading) {
                          haptic.light();
                          setSelectedPreset(presetKey);
                        }
                      }}
                    >
                      <h4 className="font-bold text-lg text-gray-900 capitalize mb-1">
                        {presetKey.replace('_', ' ')} Pack
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {preset.length} resources - {downloader.formatBytes(totalSize)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ~{downloader.estimateDownloadTime(totalSize)} at 1 Mbps
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Download Progress */}
            {downloading && progress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-lg text-gray-900">Downloading...</p>
                    <p className="text-sm text-gray-600">{progress.current}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-teal-600">{progress.percentage}%</p>
                    <p className="text-xs text-gray-500">
                      {progress.completed} / {progress.total}
                    </p>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Available Resources by Category */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Browse All Resources</h3>
              <div className="space-y-3">
                {Object.entries(groupedResources).map(([category, resources]) => {
                  const Icon = getIconForFormat(resources[0]?.format || 'pdf');
                  const isExpanded = expandedCategory === category;
                  
                  return (
                    <div key={category} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category)}
                        className="w-full p-4 bg-white hover:bg-gray-50 flex items-center justify-between touch-manipulation"
                        onTouchStart={() => haptic.light()}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                            <Icon size={20} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">
                              {categoryLabels[category] || category}
                            </p>
                            <p className="text-xs text-gray-500">
                              {resources.length} resources
                            </p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-gray-50 space-y-2">
                              {resources.map((resource) => {
                                const isDownloaded = downloaded.some(d => d.id === resource.id);
                                
                                return (
                                  <div
                                    key={resource.id}
                                    className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between"
                                  >
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {resource.title}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {downloader.formatBytes(resource.size)}
                                      </p>
                                    </div>
                                    {isDownloaded ? (
                                      <div className="flex items-center space-x-2">
                                        <Check size={20} className="text-green-600" />
                                        <TouchIconButton
                                          icon={Trash2}
                                          onClick={() => handleDeleteResource(resource.id)}
                                          variant="ghost"
                                          size="small"
                                          ariaLabel="Delete"
                                        />
                                      </div>
                                    ) : (
                                      <TouchIconButton
                                        icon={Download}
                                        onClick={() => downloader.downloadResource(resource).then(() => {
                                          loadDownloadedResources();
                                          loadStorageInfo();
                                        })}
                                        variant="primary"
                                        size="small"
                                        ariaLabel="Download"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t-2 border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {navigator.onLine ? (
                  <>
                    <Wifi size={16} className="text-green-600" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-red-600" />
                    <span>Offline</span>
                  </>
                )}
              </div>
              <TouchButton
                onClick={onClose}
                variant="primary"
                size="medium"
              >
                Done
              </TouchButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

