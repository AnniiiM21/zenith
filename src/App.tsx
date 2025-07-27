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
  const [showCustomTimerModal, setShowCustomTimerModal] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

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
    setShowCustomTimerModal(true);
  };

  const confirmCustomTimer = () => {
    setIsCustomTimer(true);
    setIsWorkSession(true);
    setTimeLeft(customWorkMinutes * 60);
    setIsRunning(false);
    setSessionStartTime(null);
    setShowCustomTimerModal(false);
  };

  const cancelCustomTimer = () => {
    setShowCustomTimerModal(false);
    // Reset to previous values if needed
  };

  const toggleTimerWidget = () => {
    if (isWidgetOpen) {
      // Close widget
      if (window.electronAPI?.hideTimerWidget) {
        window.electronAPI.hideTimerWidget();
      }
      setIsWidgetOpen(false);
    } else {
      // Open widget
      if (window.electronAPI) {
        window.electronAPI.openTimerWidget({
          timeLeft,
          isRunning,
          sessionType: isWorkSession ? 'work' : 'break',
          presetName: selectedPreset.name
        });
      }
      setIsWidgetOpen(true);
    }
  };

  const getRandomBreakSuggestion = () => {
    return BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)];
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

      {/* Enhanced Header */}
      <motion.header
        className="relative z-10 p-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            className="flex items-center space-x-6"
          >
            <div>
              <h1 
                className="text-5xl font-bold text-white mb-1 tracking-tight"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  textShadow: '0 0 30px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.6)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Zenith
              </h1>
              <p 
                className="text-xl font-semibold tracking-wide"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  textShadow: '0 0 30px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.6)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Peak Productivity Timer & Focus Tracker
              </p>
            </div>
          </motion.div>
          
          <div className="flex items-center space-x-6">
            <nav className="flex space-x-3">
              {(['timer', 'history', 'settings'] as const).map((tab, index) => (
                <motion.button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 tracking-wide shadow-lg ${
                    currentTab === tab
                      ? 'bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white shadow-[0_0_30px_rgba(102,126,234,0.5)]'
                      : 'text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    textShadow: currentTab === tab ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.6)'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: currentTab === tab 
                      ? "0 0 40px rgba(102, 126, 234, 0.6), 0 8px 16px rgba(0,0,0,0.3)" 
                      : "0 8px 25px rgba(102, 126, 234, 0.4), 0 4px 8px rgba(0,0,0,0.2)"
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
            
            {/* Widget button - moved to top right */}
            <motion.button
              onClick={toggleTimerWidget}
              className={`group relative p-4 rounded-full ${
                isWidgetOpen 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                  : 'bg-gradient-to-r from-[#667EEA] to-[#764BA2] hover:from-purple-600 hover:via-purple-700 hover:to-purple-800'
              } shadow-[0_8px_32px_rgba(0,0,0,0.3)] shadow-[0_0_40px_rgba(102,126,234,0.5)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] transition-all duration-300 mt-4`}
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 0 60px rgba(102,126,234,0.6), 0 12px 48px rgba(0,0,0,0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="text-3xl"
                animate={{
                  rotate: isWidgetOpen ? [0, 180] : [0, 360],
                }}
                transition={{
                  duration: isWidgetOpen ? 0.3 : 3,
                  repeat: isWidgetOpen ? 0 : Infinity,
                  ease: isWidgetOpen ? "easeInOut" : "linear",
                }}
              >
                {isWidgetOpen ? '✕' : '⏱️'}
              </motion.div>
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />
            </motion.button>
          </div>
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
                <GlassCard className="text-center p-12 rounded-3xl shadow-[0_0_80px_rgba(102,126,234,0.2)]">
                  {/* Enhanced Timer Display */}
                  <TimerDisplay
                    time={formatTime(timeLeft)}
                    isRunning={isRunning}
                    sessionType={isWorkSession ? 'work' : 'break'}
                    className="mb-16"
                  />
                  
                  {/* Session Info with better typography */}
                  <motion.div
                    className="mb-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h2 
                      className="text-4xl font-bold text-white mb-4 tracking-tight"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)'
                      }}
                    >
                      {isCustomTimer ? '⚡ Custom Timer' : `${selectedPreset.emoji} ${selectedPreset.name}`}
                    </h2>
                    <p 
                      className="text-xl text-white/90 font-semibold tracking-wide"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 15px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)'
                      }}
                    >
                      {isWorkSession ? 'Focus Session' : 'Break Time'}
                    </p>
                  </motion.div>

                  {/* Enhanced Timer Control Buttons - Updated layout */}
                  <div className="flex flex-col items-center space-y-8 mb-10">
                    {/* Main action buttons row */}
                    <div className="flex justify-center items-center space-x-6">
                      {/* Start/Pause button */}
                      <motion.button
                        onClick={isRunning ? pauseTimer : startTimer}
                        className={`group relative px-12 py-6 rounded-full font-bold text-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${
                          isRunning 
                            ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
                            : 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 shadow-[0_0_40px_rgba(34,197,94,0.5)]'
                        } hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)]`}
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                        }}
                        whileHover={{ 
                          scale: 1.1,
                          boxShadow: isRunning 
                            ? "0 0 60px rgba(239,68,68,0.6), 0 12px 48px rgba(0,0,0,0.4)" 
                            : "0 0 60px rgba(34,197,94,0.6), 0 12px 48px rgba(0,0,0,0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span 
                          className="font-bold tracking-wide text-white drop-shadow-lg"
                          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
                        >
                          {isRunning ? 'Pause' : 'Start'}
                        </span>
                        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />
                      </motion.button>
                      
                      {/* Reset button - same size as start */}
                      <motion.button
                        onClick={resetTimer}
                        className="group relative px-12 py-6 rounded-full font-bold text-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] transition-all duration-300"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                        }}
                        whileHover={{ 
                          scale: 1.1,
                          boxShadow: "0 0 60px rgba(59,130,246,0.6), 0 12px 48px rgba(0,0,0,0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span 
                          className="font-bold tracking-wide text-white drop-shadow-lg"
                          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
                        >
                          Reset
                        </span>
                        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />
                      </motion.button>
                    </div>

                    {/* Custom timer button - moved below main buttons */}
                    <motion.button
                      onClick={setCustomTimer}
                      className="group relative px-10 py-4 bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white rounded-2xl font-bold text-lg shadow-[0_8px_32px_rgba(102,126,234,0.4)] hover:shadow-[0_12px_48px_rgba(102,126,234,0.5)] transition-all duration-300 tracking-wide"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 60px rgba(102, 126, 234, 0.6), 0 12px 48px rgba(0,0,0,0.3)" 
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Set Custom Timer
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />
                    </motion.button>
                  </div>

                  {!isWorkSession && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-[#6BCF7F]/20 to-[#4ECDC4]/20 rounded-2xl p-8 backdrop-blur-lg shadow-[0_0_40px_rgba(108,207,127,0.3)]"
                    >
                      <h4 
                        className="text-2xl font-bold text-white mb-5 flex items-center justify-center space-x-3"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)'
                        }}
                      >
                        <span className="text-3xl drop-shadow-lg">💡</span>
                        <span>Break Suggestion</span>
                      </h4>
                      <div className="flex items-center justify-center space-x-4">
                        <span className="text-5xl drop-shadow-lg">{currentBreakSuggestion.emoji}</span>
                        <p 
                          className="text-xl text-white font-semibold tracking-wide"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                            textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                          }}
                        >
                          {currentBreakSuggestion.activity}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              </div>

              {/* Enhanced Sidebar */}
              <div className="space-y-10">
                {/* Enhanced Session Presets */}
                <GlassCard className="p-10 rounded-3xl shadow-[0_0_60px_rgba(102,126,234,0.2)]">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 
                      className="text-3xl font-bold text-white mb-8 flex items-center space-x-4"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)'
                      }}
                    >
                      <span className="text-4xl drop-shadow-lg">⏰</span>
                      <span>Session Presets</span>
                    </h3>
                    <div className="space-y-5">
                      {SESSION_PRESETS.map((preset, index) => (
                        <motion.button
                          key={preset.name}
                          onClick={() => selectPreset(preset)}
                          className={`w-full p-6 rounded-2xl text-left transition-all duration-300 backdrop-blur-lg shadow-lg ${
                            selectedPreset.name === preset.name
                              ? 'bg-gradient-to-r ' + preset.color + ' text-white shadow-[0_0_30px_rgba(102,126,234,0.5)] scale-105'
                              : 'bg-white/15 text-white'
                          }`}
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                          }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center space-x-5">
                            <span className="text-4xl drop-shadow-lg">{preset.emoji}</span>
                            <div>
                              <div 
                                className="font-bold text-xl tracking-wide mb-1"
                                style={{ 
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                                  textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text'
                                }}
                              >
                                {preset.name}
                              </div>
                              <div 
                                className="text-base tracking-wide font-semibold text-white"
                                style={{ 
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                                  textShadow: '0 0 15px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)'
                                }}
                              >
                                {preset.workMinutes}min work / {preset.breakMinutes}min break
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </GlassCard>

                {/* Enhanced Today's Progress */}
                <GlassCard className="p-10 rounded-3xl shadow-[0_0_60px_rgba(102,126,234,0.2)]">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 
                      className="text-3xl font-bold text-white mb-8 flex items-center space-x-4"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      <span className="text-4xl drop-shadow-lg">📊</span>
                      <span>Today's Progress</span>
                    </h3>
                    <div className="text-center space-y-6">
                      <motion.div
                        className="text-6xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent mb-4"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          textShadow: '0 0 30px rgba(102,126,234,0.5)'
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.5 }}
                      >
                        {Math.floor(totalTimeToday / 60)} min
                      </motion.div>
                      <div 
                        className="text-white mb-8 text-xl tracking-wide font-semibold" 
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {todaysSessions.length} sessions completed
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-5 overflow-hidden backdrop-blur-sm shadow-inner">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#667EEA] to-[#764BA2] shadow-[0_0_20px_rgba(102,126,234,0.6)] relative"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((totalTimeToday / (4 * 60 * 60)) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full" />
                        </motion.div>
                      </div>
                      <div 
                        className="text-base text-white mt-4 tracking-wide font-medium" 
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        Goal: 4 hours
                      </div>
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
              <GlassCard className="p-12 rounded-3xl shadow-[0_0_80px_rgba(102,126,234,0.2)]">
                <h2 
                  className="text-4xl font-bold text-white mb-10 flex items-center space-x-4"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  <span className="text-5xl drop-shadow-lg">📈</span>
                  <span>Session History</span>
                </h2>
                {completedSessions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">⏳</div>
                    <p 
                      className="text-white text-2xl tracking-wide font-semibold"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      No sessions completed yet. Start your first session!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {completedSessions.slice(0, 20).map((session, index) => {
                      const preset = SESSION_PRESETS.find(p => p.name === session.preset);
                      return (
                        <motion.div
                          key={session.id}
                          className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all duration-300"
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <span className="text-4xl drop-shadow-lg">{preset?.emoji}</span>
                              <div>
                                <div 
                                  className="font-bold text-white text-lg tracking-wide"
                                  style={{ 
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                                    textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                  }}
                                >
                                  {session.preset}
                                </div>
                                <div 
                                  className="text-white/80 font-medium tracking-wide"
                                  style={{ 
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                                    textShadow: '0 0 15px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)'
                                  }}
                                >
                                  {session.startTime.toLocaleDateString()} at{' '}
                                  {session.startTime.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div 
                                className="font-bold text-[#6BCF7F] text-2xl drop-shadow-lg"
                                style={{ 
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                                  textShadow: '0 0 10px rgba(108,207,127,0.5), 0 2px 4px rgba(0,0,0,0.4)'
                                }}
                              >
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
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              <GlassCard className="p-10 rounded-3xl shadow-[0_0_60px_rgba(102,126,234,0.2)]">
                <h3 
                  className="text-3xl font-bold text-white mb-8 flex items-center space-x-4"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  <span className="text-4xl drop-shadow-lg">🏃</span>
                  <span>Break Suggestions</span>
                </h3>
                <div className="space-y-4">
                  {BREAK_SUGGESTIONS.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-3xl drop-shadow-lg">{suggestion.emoji}</span>
                          <span 
                            className="text-white font-semibold text-lg tracking-wide"
                            style={{ 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                              textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                              background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}
                          >
                            {suggestion.activity}
                          </span>
                        </div>
                        <span 
                          className={`px-4 py-2 rounded-full text-sm font-bold text-white ${suggestion.color} shadow-lg`}
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                            textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                          }}
                        >
                          {suggestion.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-10 rounded-3xl shadow-[0_0_60px_rgba(102,126,234,0.2)]">
                <h3 
                  className="text-3xl font-bold text-white mb-8 flex items-center space-x-4"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  <span className="text-4xl drop-shadow-lg">💾</span>
                  <span>Data Management</span>
                </h3>
                <div className="space-y-6">
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
                    <p 
                      className="text-white mb-6 text-lg tracking-wide font-semibold"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      Clear all your session history. This action cannot be undone.
                    </p>
                    <motion.button
                      onClick={() => {
                        if (confirm('Clear all session history?')) {
                          setCompletedSessions([]);
                          localStorage.removeItem('zenith-sessions');
                        }
                      }}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-bold text-lg shadow-[0_8px_32px_rgba(239,68,68,0.4)] hover:shadow-[0_12px_48px_rgba(239,68,68,0.5)] transition-all duration-300 tracking-wide hover:scale-105"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 60px rgba(239,68,68,0.6), 0 12px 48px rgba(0,0,0,0.3)" 
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Clear All History
                    </motion.button>
                  </div>
                  
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
                    <h4 
                      className="text-white font-bold mb-4 flex items-center space-x-3 text-xl"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                      }}
                    >
                      <span className="text-2xl drop-shadow-lg">📊</span>
                      <span>Statistics</span>
                    </h4>
                    <div 
                      className="space-y-3 text-white/90 text-lg font-medium"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                      }}
                    >
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

      {/* Custom Timer Modal */}
      <AnimatePresence>
        {showCustomTimerModal && (
          <>
            {/* Modal backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelCustomTimer}
            />
            
            {/* Modal content */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div 
                className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-3xl p-8 max-w-md w-full shadow-[0_0_80px_rgba(102,126,234,0.3)] backdrop-blur-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 
                  className="text-3xl font-bold mb-8 text-center flex items-center justify-center space-x-4"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    textShadow: '0 0 30px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.6)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  <span className="text-4xl">⚡</span>
                  <span>Custom Timer</span>
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label 
                      className="block text-lg font-bold mb-4 tracking-wide"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 30px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.6)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      Focus Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customWorkMinutes}
                      onChange={(e) => setCustomWorkMinutes(parseInt(e.target.value) || 25)}
                      className="w-full px-6 py-4 bg-white/15 rounded-2xl text-white placeholder-white/60 focus:ring-4 focus:ring-[#667EEA]/50 backdrop-blur-lg transition-all duration-300 text-lg font-semibold shadow-inner"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                      }}
                      placeholder="Enter focus time..."
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-lg font-bold mb-4 tracking-wide"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                        textShadow: '0 0 30px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.6)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      Break Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={customBreakMinutes}
                      onChange={(e) => setCustomBreakMinutes(parseInt(e.target.value) || 5)}
                      className="w-full px-6 py-4 bg-white/15 rounded-2xl text-white placeholder-white/60 focus:ring-4 focus:ring-[#667EEA]/50 backdrop-blur-lg transition-all duration-300 text-lg font-semibold shadow-inner"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
                      }}
                      placeholder="Enter break time..."
                    />
                  </div>
                </div>
                
                {/* Modal buttons */}
                <div className="flex space-x-4 mt-8">
                  <motion.button
                    onClick={cancelCustomTimer}
                    className="flex-1 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-bold text-lg shadow-[0_8px_32px_rgba(239,68,68,0.4)] hover:shadow-[0_12px_48px_rgba(239,68,68,0.5)] transition-all duration-300 tracking-wide"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: "0 0 60px rgba(239,68,68,0.6), 0 12px 48px rgba(0,0,0,0.3)" 
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    onClick={confirmCustomTimer}
                    className="flex-1 py-4 bg-gradient-to-r from-[#667EEA] to-[#764BA2] hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-[0_8px_32px_rgba(102,126,234,0.4)] hover:shadow-[0_12px_48px_rgba(102,126,234,0.5)] transition-all duration-300 tracking-wide"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: "0 0 60px rgba(102, 126, 234, 0.6), 0 12px 48px rgba(0,0,0,0.3)" 
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Confirm
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
