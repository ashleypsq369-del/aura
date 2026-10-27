/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from '../utils/toast';
import offlineStorage from '../utils/offlineStorage';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Define functions before useEffect
  const checkPending = async () => {
    try {
      const count = await offlineStorage.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to check pending count:', error);
    }
  };

  const syncPending = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setSyncStatus('syncing');
    
    try {
      const result = await offlineStorage.syncPendingAssessments();
      
      if (result.success) {
        setSyncStatus('success');
        toast.success(`✅ Synced ${result.synced} assessment(s)!`);
        await checkPending();
        
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus('error');
        toast.error(`Failed to sync ${result.failed} assessment(s)`);
        
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (error) {
      setSyncStatus('error');
      toast.error('Sync failed: ' + error.message);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  useEffect(() => {
    // Update online status
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Connection restored!', { duration: 3000 });
      syncPending();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('📴 You are offline. Assessments will be saved locally.', { 
        duration: 5000 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count on mount
    checkPending();

    // Poll for pending count every 30 seconds
    const interval = setInterval(checkPending, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't show if online and no pending items
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {/* Main Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative"
        >
          {/* Indicator Badge */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`
              flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border-2 
              transition-all cursor-pointer
              ${isOnline 
                ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                : 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'
              }
            `}
          >
            {isOnline ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5 animate-pulse" />
            )}
            
            <div className="text-left">
              <p className="text-sm font-bold">
                {isOnline ? 'Online' : 'Offline Mode'}
              </p>
              {pendingCount > 0 && (
                <p className="text-xs">
                  {pendingCount} pending assessment{pendingCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {pendingCount > 0 && (
              <div className="ml-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                {pendingCount}
              </div>
            )}
          </button>

          {/* Details Panel */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 w-80 bg-[#f0f6fa] rounded-lg shadow-xl border-2 border-slate-200 p-4"
              >
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  {isOnline ? '🌐 Online Status' : '📴 Offline Status'}
                </h3>

                {/* Connection Status */}
                <div className={`
                  flex items-center space-x-2 p-2 rounded-lg mb-3
                  ${isOnline ? 'bg-green-50' : 'bg-orange-50'}
                `}>
                  {isOnline ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Connected to server
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-800">
                        Working offline
                      </span>
                    </>
                  )}
                </div>

                {/* Pending Assessments */}
                {pendingCount > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>{pendingCount}</strong> assessment{pendingCount !== 1 ? 's' : ''} saved locally
                    </p>
                    <p className="text-xs text-slate-500">
                      {isOnline 
                        ? 'Click "Sync Now" to upload to server' 
                        : 'Will auto-sync when connection is restored'
                      }
                    </p>
                  </div>
                )}

                {/* Sync Button */}
                {isOnline && pendingCount > 0 && (
                  <button
                    onClick={syncPending}
                    disabled={syncStatus === 'syncing'}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {syncStatus === 'syncing' ? (
                      <>
                        <Upload className="w-4 h-4 animate-bounce" />
                        <span className="text-sm font-medium">Syncing...</span>
                      </>
                    ) : syncStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Synced!</span>
                      </>
                    ) : syncStatus === 'error' ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Failed</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">Sync Now</span>
                      </>
                    )}
                  </button>
                )}

                {/* Info */}
                {!isOnline && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 All assessments are being saved locally and will automatically sync when you're back online.
                    </p>
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={() => setShowDetails(false)}
                  className="mt-3 w-full text-xs text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
