import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from './components/ui/AnimatedButton';
import { AnimatedCard, GlassCard } from './components/ui/AnimatedCard';
import { TimerDisplay } from './components/ui/TimerDisplay';

interface SessionPreset {
  name: string;
  workMinutes: number;
  breakMinutes: number;
  emoji: string;
  color: string;
}

interface CompletedSession {
  id: string;
  preset: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

const SESSION_PRESETS: SessionPreset[] = [
  { name: 'Pomodoro', workMinutes: 25, breakMinutes: 5, emoji: '🍅', color: 'from-[#FF6B6B] to-[#FF8E8E]' },
  { name: 'Deep Work', workMinutes: 50, breakMinutes: 10, emoji: '🧠', color: 'from-[#667EEA] to-[#764BA2]' },
  { name: 'Quick Sprint', workMinutes: 15, breakMinutes: 3, emoji: '⚡', color: 'from-[#FFD93D] to-[#FF8F00]' },
  { name: 'Power Hour', workMinutes: 60, breakMinutes: 15, emoji: '💪', color: 'from-[#6BCF7F] to-[#4D9078]' }
];

const BREAK_SUGGESTIONS = [
  { category: 'Physical', activity: 'Take a 5-minute walk', emoji: '🚶', color: 'bg-[#667EEA]' },
  { category: 'Physical', activity: 'Do some stretches', emoji: '🤸', color: 'bg-[#6BCF7F]' },
  { category: 'Mental', activity: 'Practice deep breathing', emoji: '🧘', color: 'bg-[#764BA2]' },
  { category: 'Health', activity: 'Drink a glass of water', emoji: '💧', color: 'bg-[#4ECDC4]' },
  { category: 'Physical', activity: 'Look away from screen (20-20-20 rule)', emoji: '👁️', color: 'bg-[#667EEA]' },
  { category: 'Mental', activity: 'Quick meditation', emoji: '🧘‍♀️', color: 'bg-[#FF6B6B]' }
];

const App = () => {
  const [selectedPreset, setSelectedPreset] = useState<SessionPreset>(SESSION_PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [currentTab, setCurrentTab] = useState<'timer' | 'history' | 'settings'>('timer');
  const [customWorkMinutes, setCustomWorkMinutes] = useState(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5);
  const [isCustomTimer, setIsCustomTimer] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('zenith-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setCompletedSessions(parsed.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime)
      })));
    }
  }, []);

  // Save to localStorage when sessions change
  useEffect(() => {
    localStorage.setItem('zenith-sessions', JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (isWorkSession && sessionStartTime) {
      const newSession: CompletedSession = {
        id: Date.now().toString(),
        preset: isCustomTimer ? 'Custom Timer' : selectedPreset.name,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration: isCustomTimer ? customWorkMinutes * 60 : selectedPreset.workMinutes * 60
      };
      setCompletedSessions(prev => [newSession, ...prev]);
    }

    if (isWorkSession) {
      setIsWorkSession(false);
      setTimeLeft(isCustomTimer ? customBreakMinutes * 60 : selectedPreset.breakMinutes * 60);
    } else {
      setIsWorkSession(true);
      setTimeLeft(isCustomTimer ? customWorkMinutes * 60 : selectedPreset.workMinutes * 60);
    }
    
    setSessionStartTime(null);
    
    if (window.electronAPI) {
      window.electronAPI.showNotification(
        isWorkSession ? 'Break Time!' : 'Work Time!',
        isWorkSession 
          ? `Take a ${isCustomTimer ? customBreakMinutes : selectedPreset.breakMinutes} minute break` 
          : `Start your ${isCustomTimer ? customWorkMinutes : selectedPreset.workMinutes} minute work session`
      );
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsWorkSession(true);
    setTimeLeft(isCustomTimer ? customWorkMinutes * 60 : selectedPreset.workMinutes * 60);
    setSessionStartTime(null);
  };

  const selectPreset = (preset: SessionPreset) => {
    setSelectedPreset(preset);
    setIsWorkSession(true);
    setTimeLeft(preset.workMinutes * 60);
    setIsRunning(false);
    setSessionStartTime(null);
    setIsCustomTimer(false);
  };

  const setCustomTimer = () => {
    setIsCustomTimer(true);
    setIsWorkSession(true);
    setTimeLeft(customWorkMinutes * 60);
    setIsRunning(false);
    setSessionStartTime(null);
  };

  const getRandomBreakSuggestion = () => {
    return BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)];
  };

  const openTimerWidget = () => {
    if (window.electronAPI) {
      window.electronAPI.openTimerWidget({
        timeLeft,
        isRunning,
        sessionType: isWorkSession ? 'work' : 'break',
        presetName: selectedPreset.name
      });
    }
  };

  const todaysSessions = completedSessions.filter(session => {
    const today = new Date();
    const sessionDate = session.startTime;
    return sessionDate.toDateString() === today.toDateString();
  });

  const totalTimeToday = todaysSessions.reduce((total, session) => total + session.duration, 0);

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const currentBreakSuggestion = getRandomBreakSuggestion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* Background animated elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-[#667EEA] rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#764BA2] rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 p-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            className="flex items-center space-x-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-[#667EEA] to-[#764BA2] rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-3xl">⚡</span>
            </div>
            <div>
              <h1 
                className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent tracking-tight"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Zenith
              </h1>
              <p 
                className="text-white/70 text-lg font-medium tracking-wide"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Peak Productivity Timer & Focus Tracker
              </p>
            </div>
          </motion.div>
          
          <nav className="flex space-x-2">
            {(['timer', 'history', 'settings'] as const).map((tab, index) => (
              <motion.button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 tracking-wide shadow-lg ${
                  currentTab === tab
                    ? 'bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white shadow-xl'
                    : 'text-white/80 hover:bg-white/20 bg-white/10 border border-white/20'
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: currentTab === tab 
                    ? "0 20px 40px rgba(102, 126, 234, 0.4)" 
                    : "0 10px 25px rgba(255, 255, 255, 0.1)"
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pb-12">
        <AnimatePresence mode="wait">
          {currentTab === 'timer' && (
            <motion.div
              key="timer"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-10"
            >
              {/* Main Timer Section */}
              <div className="xl:col-span-2">
                <GlassCard className="text-center p-16 rounded-3xl">
                  <TimerDisplay
                    time={formatTime(timeLeft)}
                    isRunning={isRunning}
                    sessionType={isWorkSession ? 'work' : 'break'}
                    className="mb-12"
                  />
                  
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h2 className="text-3xl font-bold text-white mb-3 font-system tracking-tight">
                      {isCustomTimer ? '⚡ Custom Timer' : `${selectedPreset.emoji} ${selectedPreset.name}`}
                    </h2>
                    <p className="text-lg text-white/80 font-medium">
                      {isWorkSession ? 'Focus Session' : 'Break Time'}
                    </p>
                  </motion.div>

                  {/* Timer Control Buttons */}
                  <div className="flex justify-center items-center space-x-6 mb-8">
                    <motion.button
                      onClick={isRunning ? pauseTimer : startTimer}
                      className={`relative px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl ${
                        isRunning 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/30' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/30'
                      } hover:shadow-2xl hover:scale-105 active:scale-95`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{isRunning ? '⏸️' : '▶️'}</span>
                        <span className="font-bold tracking-wide">{isRunning ? 'Pause' : 'Start'}</span>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      onClick={resetTimer}
                      className="relative px-8 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🔄</span>
                        <span className="font-bold tracking-wide">Reset</span>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={openTimerWidget}
                      className="relative px-8 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">📌</span>
                        <span className="font-bold tracking-wide">Widget</span>
                      </div>
                    </motion.button>
                  </div>

                  {!isWorkSession && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-[#6BCF7F]/20 to-[#4ECDC4]/20 rounded-xl p-6 backdrop-blur-sm border border-[#6BCF7F]/30"
                    >
                      <h4 className="text-xl font-bold text-white mb-3">💡 Break Suggestion</h4>
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-3xl">{currentBreakSuggestion.emoji}</span>
                        <p className="text-lg text-[#B8BCC8]">{currentBreakSuggestion.activity}</p>
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Custom Timer */}
                <GlassCard className="p-8 rounded-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 
                      className="text-2xl font-bold text-white mb-6 flex items-center space-x-3"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      <span className="text-3xl">⚡</span>
                      <span>Custom Timer</span>
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label 
                          className="block text-base font-semibold text-white/90 mb-3 tracking-wide"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        >
                          Work Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={customWorkMinutes}
                          onChange={(e) => setCustomWorkMinutes(parseInt(e.target.value) || 25)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-[#667EEA] focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        />
                      </div>
                      <div>
                        <label 
                          className="block text-base font-semibold text-white/90 mb-3 tracking-wide"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        >
                          Break Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={customBreakMinutes}
                          onChange={(e) => setCustomBreakMinutes(parseInt(e.target.value) || 5)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-[#667EEA] focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        />
                      </div>
                      <motion.button
                        onClick={setCustomTimer}
                        className="w-full py-4 bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 tracking-wide"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(102, 126, 234, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Set Custom Timer
                      </motion.button>
                    </div>
                  </motion.div>
                </GlassCard>

                {/* Session Presets */}
                <GlassCard className="p-8 rounded-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 
                      className="text-2xl font-bold text-white mb-6 flex items-center space-x-3"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      <span className="text-3xl">⏰</span>
                      <span>Session Presets</span>
                    </h3>
                    <div className="space-y-4">
                      {SESSION_PRESETS.map((preset, index) => (
                        <motion.button
                          key={preset.name}
                          onClick={() => selectPreset(preset)}
                          className={`w-full p-5 rounded-xl text-left transition-all duration-300 border backdrop-blur-sm ${
                            selectedPreset.name === preset.name
                              ? 'bg-gradient-to-r ' + preset.color + ' text-white shadow-xl border-white/30'
                              : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30'
                          }`}
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl">{preset.emoji}</span>
                            <div>
                              <div className="font-bold text-lg tracking-wide">{preset.name}</div>
                              <div className="text-sm opacity-80 tracking-wide">
                                {preset.workMinutes}min work / {preset.breakMinutes}min break
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </GlassCard>

                {/* Today's Progress */}
                <GlassCard className="p-8 rounded-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 
                      className="text-2xl font-bold text-white mb-6 flex items-center space-x-3"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      <span className="text-3xl">📊</span>
                      <span>Today's Progress</span>
                    </h3>
                    <div className="text-center">
                      <motion.div
                        className="text-5xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent mb-4"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.5 }}
                      >
                        {Math.floor(totalTimeToday / 60)} min
                      </motion.div>
                      <div className="text-white/70 mb-6 text-lg tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {todaysSessions.length} sessions completed
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#667EEA] to-[#764BA2] shadow-lg"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((totalTimeToday / (4 * 60 * 60)) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                        />
                      </div>
                      <div className="text-sm text-white/60 mt-3 tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Goal: 4 hours</div>
                    </div>
                  </motion.div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {currentTab === 'history' && (
            <motion.div
              key="history"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <GlassCard className="p-8 rounded-2xl">
                <h2 
                  className="text-3xl font-bold text-white mb-8 flex items-center space-x-3"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  <span className="text-4xl">📈</span>
                  <span>Session History</span>
                </h2>
                {completedSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-white/70 text-xl tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      No sessions completed yet. Start your first session!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedSessions.slice(0, 20).map((session, index) => {
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6">📈 Session History</h2>
                {completedSessions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-xl text-[#B8BCC8]">No sessions completed yet.</p>
                    <p className="text-[#B8BCC8]">Start your first session to see your progress!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {completedSessions.slice(0, 20).map((session, index) => {
                      const preset = SESSION_PRESETS.find(p => p.name === session.preset);
                      return (
                        <motion.div
                          key={session.id}
                          className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{preset?.emoji}</span>
                              <div>
                                <div className="font-bold text-white">{session.preset}</div>
                                <div className="text-sm text-[#B8BCC8]">
                                  {session.startTime.toLocaleDateString()} at{' '}
                                  {session.startTime.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#6BCF7F] text-lg">
                                {Math.floor(session.duration / 60)} min
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {currentTab === 'settings' && (
            <motion.div
              key="settings"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <GlassCard className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">🏃 Break Suggestions</h3>
                <div className="space-y-3">
                  {BREAK_SUGGESTIONS.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{suggestion.emoji}</span>
                          <span className="text-white font-medium">{suggestion.activity}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${suggestion.color}`}>
                          {suggestion.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">💾 Data Management</h3>
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-[#B8BCC8] mb-4">
                      Clear all your session history. This action cannot be undone.
                    </p>
                    <AnimatedButton
                      onClick={() => {
                        if (confirm('Clear all session history?')) {
                          setCompletedSessions([]);
                          localStorage.removeItem('zenith-sessions');
                        }
                      }}
                      variant="danger"
                      className="w-full"
                    >
                      🗑️ Clear All Data
                    </AnimatedButton>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <h4 className="text-white font-bold mb-2">📊 Statistics</h4>
                    <div className="space-y-2 text-[#B8BCC8]">
                      <div>Total sessions: {completedSessions.length}</div>
                      <div>Total time: {Math.floor(completedSessions.reduce((total, session) => total + session.duration, 0) / 60)} minutes</div>
                      <div>Average session: {completedSessions.length > 0 ? Math.floor((completedSessions.reduce((total, session) => total + session.duration, 0) / completedSessions.length) / 60) : 0} minutes</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
