import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from './ui/AnimatedButton';
import { GlassCard } from './ui/AnimatedCard';

interface BrowserStats {
  date: string;
  totalTime: number;
  totalTimeFormatted: string;
  sitesArray: Array<{
    domain: string;
    timeSpent: number;
    timeSpentFormatted: string;
    visits: number;
    category: 'productive' | 'neutral' | 'distracting';
    lastVisit: Date;
  }>;
  videosArray: Array<{
    title: string;
    timeSpent: number;
    timeSpentFormatted: string;
    watches: number;
  }>;
  productivityFormatted: {
    productive: string;
    neutral: string;
    distracting: string;
  };
  currentSession: any;
}

interface BrowserActivityProps {
  isVisible: boolean;
  onClose: () => void;
}

export const BrowserActivity: React.FC<BrowserActivityProps> = ({ isVisible, onClose }) => {
  const [stats, setStats] = useState<BrowserStats | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'youtube'>('overview');
  const [liveData, setLiveData] = useState<any>(null);
  const [sessionReport, setSessionReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadStats();
      checkTrackingStatus();
      
      // Set up interval to refresh stats every 2 seconds for live tracking
      const interval = setInterval(() => {
        if (isTracking) {
          loadStats();
          loadLiveData();
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isVisible, isTracking]);

  const loadStats = async () => {
    try {
      if ((window.electronAPI as any)?.getBrowserStats) {
        const browserStats = await (window.electronAPI as any).getBrowserStats();
        setStats(browserStats);
      }
    } catch (error) {
      console.error('Error loading browser stats:', error);
    }
  };

  const loadLiveData = async () => {
    try {
      if ((window.electronAPI as any)?.getBrowserTrackingStatus) {
        const status = await (window.electronAPI as any).getBrowserTrackingStatus();
        setLiveData(status);
      }
    } catch (error) {
      console.error('Error loading live data:', error);
    }
  };

  const checkTrackingStatus = async () => {
    try {
      if ((window.electronAPI as any)?.getBrowserTrackingStatus) {
        const status = await (window.electronAPI as any).getBrowserTrackingStatus();
        setIsTracking(status.isTracking);
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };

  const toggleTracking = async () => {
    setLoading(true);
    try {
      if (isTracking) {
        // Stop tracking and generate session report
        const finalStats = await (window.electronAPI as any)?.getBrowserStats();
        setSessionReport(finalStats);
        setShowReport(true);
        
        await (window.electronAPI as any)?.stopBrowserTracking();
        setIsTracking(false);
      } else {
        // Start tracking
        await (window.electronAPI as any)?.startBrowserTracking();
        setIsTracking(true);
        setShowReport(false);
        setSessionReport(null);
      }
      await loadStats();
    } catch (error) {
      console.error('Error toggling tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopTrackingAndShowReport = async () => {
    setLoading(true);
    try {
      // Get final stats before stopping
      const finalStats = await (window.electronAPI as any)?.getBrowserStats();
      setSessionReport(finalStats);
      
      await (window.electronAPI as any)?.stopBrowserTracking();
      setIsTracking(false);
      setShowReport(true);
      await loadStats();
    } catch (error) {
      console.error('Error stopping tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearStats = async () => {
    try {
      await (window.electronAPI as any)?.clearBrowserStats();
      await loadStats();
    } catch (error) {
      console.error('Error clearing stats:', error);
    }
  };

  const testTracking = async () => {
    try {
      console.log('🧪 Testing browser tracking PowerShell...');
      await (window.electronAPI as any)?.testBrowserTracking();
      console.log('✅ Test command sent - check Electron console for results');
    } catch (error) {
      console.error('Error testing tracking:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productive': return 'text-green-400';
      case 'distracting': return 'text-red-400';
      case 'neutral': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productive': return '💼';
      case 'distracting': return '🎮';
      case 'neutral': return '📝';
      default: return '🌐';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              🌐 Browser Activity Analytics
            </h2>
            <div className="flex items-center gap-3">
              {!isTracking ? (
                <AnimatedButton
                  onClick={toggleTracking}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 shadow-lg"
                >
                  {loading ? '⏳ Starting...' : '▶️ Start Live Tracking'}
                </AnimatedButton>
              ) : (
                <div className="flex items-center gap-3">
                  <AnimatedButton
                    onClick={stopTrackingAndShowReport}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 shadow-lg"
                  >
                    {loading ? '⏳ Stopping...' : '⏹️ Stop & Show Report'}
                  </AnimatedButton>
                </div>
              )}
              <AnimatedButton
                onClick={testTracking}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium border border-blue-500/30"
              >
                🧪 Test
              </AnimatedButton>
              <AnimatedButton
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20"
              >
                ✕
              </AnimatedButton>
            </div>
          </div>

          {/* Tracking Status */}
          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border shadow-lg ${
              isTracking 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
            }`}>
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="font-medium">
                {isTracking ? 'Live Tracking Active' : 'Tracking Stopped'}
              </span>
            </div>
            
            {/* Live Session Info */}
            {isTracking && liveData?.currentSession && (
              <div className="mt-3 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🌐</div>
                  <div>
                    <div className="text-white font-medium">
                      Currently tracking: {liveData.currentSession.domain || liveData.currentSession.title}
                    </div>
                    <div className="text-white/60 text-sm">
                      Browser: {liveData.currentSession.processName || 'Unknown'} • 
                      Started: {new Date(liveData.currentSession.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Session Report Modal */}
            {showReport && sessionReport && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">📊 Session Report</h3>
                  <AnimatedButton
                    onClick={() => setShowReport(false)}
                    className="px-3 py-1 text-sm bg-white/10 text-white hover:bg-white/20 rounded-lg"
                  >
                    ✕
                  </AnimatedButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{sessionReport.totalTimeFormatted}</div>
                    <div className="text-white/70 text-sm">Total Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{sessionReport.sitesArray?.length || 0}</div>
                    <div className="text-white/70 text-sm">Websites Visited</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{sessionReport.videosArray?.length || 0}</div>
                    <div className="text-white/70 text-sm">YouTube Videos</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'sites', label: '🌐 Websites', icon: '🌐' },
              { id: 'youtube', label: '🎥 YouTube', icon: '🎥' }
            ].map(tab => (
              <AnimatedButton
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg transition-all border ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10'
                }`}
              >
                {tab.label}
              </AnimatedButton>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[50vh]">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {stats ? (
                  <>
                    {/* Total Time */}
                    <GlassCard className="p-4 border border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-2 drop-shadow-md">📈 Today's Activity</h3>
                      <div className="text-3xl font-bold text-white drop-shadow-lg">
                        {stats.totalTimeFormatted}
                      </div>
                      <div className="text-sm text-white/80">Total browsing time</div>
                    </GlassCard>

                    {/* Productivity Breakdown */}
                    <GlassCard className="p-4 border border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-3 drop-shadow-md">🎯 Productivity Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            💼 <span className="text-green-400 font-medium">Productive</span>
                          </span>
                          <span className="font-mono text-white">{stats.productivityFormatted.productive}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            📝 <span className="text-blue-400 font-medium">Neutral</span>
                          </span>
                          <span className="font-mono text-white">{stats.productivityFormatted.neutral}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            🎮 <span className="text-red-400 font-medium">Distracting</span>
                          </span>
                          <span className="font-mono text-white">{stats.productivityFormatted.distracting}</span>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Top Sites Preview */}
                    <GlassCard className="p-4 border border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-3 drop-shadow-md">🌐 Top Websites</h3>
                      <div className="space-y-2">
                        {stats.sitesArray.slice(0, 3).map((site, index) => (
                          <div key={site.domain} className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {getCategoryIcon(site.category)}
                              <span className="truncate max-w-xs text-white">{site.domain}</span>
                            </span>
                            <span className="font-mono text-sm text-white">{site.timeSpentFormatted}</span>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </>
                ) : (
                  <div className="text-center py-8 text-white/80">
                    {isTracking ? 'Collecting data...' : 'Start tracking to see analytics'}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sites' && (
              <div className="space-y-3">
                {stats?.sitesArray && stats.sitesArray.length > 0 ? (
                  stats.sitesArray.map((site, index) => (
                    <GlassCard key={site.domain} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryIcon(site.category)}</span>
                          <div>
                            <div className="font-medium text-white">{site.domain}</div>
                            <div className="text-sm text-white/60">
                              {site.visits} visit{site.visits !== 1 ? 's' : ''} • {site.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg text-white">{site.timeSpentFormatted}</div>
                          <div className={`text-sm ${getCategoryColor(site.category)}`}>
                            {site.category}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    No website data available
                  </div>
                )}
              </div>
            )}

            {activeTab === 'youtube' && (
              <div className="space-y-3">
                {stats?.videosArray && stats.videosArray.length > 0 ? (
                  stats.videosArray.map((video, index) => (
                    <GlassCard key={video.title} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🎥</span>
                          <div className="flex-1">
                            <div className="font-medium text-white line-clamp-2">{video.title}</div>
                            <div className="text-sm text-white/60">
                              Watched {video.watches} time{video.watches !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg text-white">{video.timeSpentFormatted}</div>
                          <div className="text-sm text-red-400">YouTube</div>
                        </div>
                      </div>
                    </GlassCard>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    No YouTube activity detected
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="text-sm text-white/60">
              Data for {stats?.date || 'today'}
            </div>
            <AnimatedButton
              onClick={clearStats}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              🗑️ Clear Data
            </AnimatedButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
