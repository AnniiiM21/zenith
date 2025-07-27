import React, { useState, useEffect, useCallback } from 'react';
import { TimerState, SessionData } from '../types';
import { formatTime, generateSessionId, storeSession } from '../utils/constants';

interface TimerDisplayProps {
  timerState: TimerState;
  setTimerState: React.Dispatch<React.SetStateAction<TimerState>>;
  onBreakTime: () => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerState,
  setTimerState,
  onBreakTime
}) => {
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const newIntervalId = setInterval(() => {
      setTimerState(prev => {
        if (prev.timeRemaining <= 1) {
          // Timer finished
          if (prev.currentSession) {
            const completedSession = {
              ...prev.currentSession,
              endTime: new Date(),
              completed: true
            };
            storeSession(completedSession);
          }

          // Trigger break suggestions if this was a focus session
          if (prev.currentSession?.type === 'focus') {
            onBreakTime();
          }

          return {
            ...prev,
            isRunning: false,
            timeRemaining: 0,
            currentSession: null
          };
        }

        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
      });
    }, 1000);

    setIntervalId(newIntervalId);
  }, [setTimerState, onBreakTime, intervalId]);

  const pauseTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }));
  }, [intervalId, setTimerState]);

  const stopTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    setTimerState(prev => {
      if (prev.currentSession) {
        const stoppedSession = {
          ...prev.currentSession,
          endTime: new Date(),
          completed: false,
          interrupted: true
        };
        storeSession(stoppedSession);
      }

      return {
        ...prev,
        isRunning: false,
        isPaused: false,
        timeRemaining: prev.currentPreset.focusDuration * 60,
        currentSession: null
      };
    });
  }, [intervalId, setTimerState]);

  const startSession = useCallback((type: 'focus' | 'break') => {
    const duration = type === 'focus' 
      ? timerState.currentPreset.focusDuration 
      : timerState.currentPreset.breakDuration;

    const newSession: SessionData = {
      id: generateSessionId(),
      type,
      preset: timerState.currentPreset,
      startTime: new Date(),
      duration: duration * 60,
      completed: false,
      interrupted: false
    };

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      timeRemaining: duration * 60,
      currentSession: newSession,
      sessionCount: type === 'focus' ? prev.sessionCount + 1 : prev.sessionCount
    }));

    startTimer();
  }, [timerState.currentPreset, setTimerState, startTimer]);

  const resumeTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
    startTimer();
  }, [setTimerState, startTimer]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const progress = timerState.currentSession 
    ? ((timerState.currentSession.duration - timerState.timeRemaining) / timerState.currentSession.duration) * 100
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <div className="text-center">
        {/* Session Type Indicator */}
        {timerState.currentSession && (
          <div className="mb-6">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              timerState.currentSession.type === 'focus'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {timerState.currentSession.type === 'focus' ? '🎯 Focus Session' : '☕ Break Time'}
            </span>
          </div>
        )}

        {/* Timer Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className={`transition-all duration-1000 ease-linear ${
                timerState.currentSession?.type === 'focus'
                  ? 'text-blue-500'
                  : 'text-green-500'
              }`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {formatTime(timerState.timeRemaining)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {timerState.currentPreset.name}
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!timerState.isRunning && !timerState.isPaused && (
            <>
              <button
                onClick={() => startSession('focus')}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>▶️</span>
                <span>Start Focus</span>
              </button>
              <button
                onClick={() => startSession('break')}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>☕</span>
                <span>Start Break</span>
              </button>
            </>
          )}

          {timerState.isRunning && (
            <button
              onClick={pauseTimer}
              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <span>⏸️</span>
              <span>Pause</span>
            </button>
          )}

          {timerState.isPaused && (
            <button
              onClick={resumeTimer}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <span>▶️</span>
              <span>Resume</span>
            </button>
          )}

          {(timerState.isRunning || timerState.isPaused) && (
            <button
              onClick={stopTimer}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <span>⏹️</span>
              <span>Stop</span>
            </button>
          )}
        </div>

        {/* Session Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {timerState.sessionCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Sessions Today
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(progress)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
