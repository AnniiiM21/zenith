import React from 'react';
import { TimerState } from '../types';
import { DEFAULT_PRESETS } from '../utils/constants';

interface SessionPresetsProps {
  timerState: TimerState;
  setTimerState: React.Dispatch<React.SetStateAction<TimerState>>;
}

const SessionPresets: React.FC<SessionPresetsProps> = ({
  timerState,
  setTimerState
}) => {
  const selectPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    setTimerState(prev => ({
      ...prev,
      currentPreset: preset,
      timeRemaining: preset.focusDuration * 60,
      isRunning: false,
      isPaused: false,
      currentSession: null
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Session Presets
      </h3>
      
      <div className="space-y-3">
        {DEFAULT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => selectPreset(preset)}
            disabled={timerState.isRunning || timerState.isPaused}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              timerState.currentPreset.id === preset.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            } ${
              timerState.isRunning || timerState.isPaused
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {preset.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {preset.focusDuration}min focus • {preset.breakDuration}min break
                </div>
              </div>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: preset.color }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Current Preset Details */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Current: {timerState.currentPreset.name}
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-gray-500 dark:text-gray-400">Focus</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {timerState.currentPreset.focusDuration}min
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-gray-500 dark:text-gray-400">Break</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {timerState.currentPreset.breakDuration}min
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-gray-500 dark:text-gray-400">Long Break</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {timerState.currentPreset.longBreakDuration}min
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-gray-500 dark:text-gray-400">Cycle</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {timerState.currentPreset.sessionsUntilLongBreak} sessions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPresets;
