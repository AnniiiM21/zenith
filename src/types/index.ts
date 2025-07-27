export interface SessionData {
  id: string;
  type: 'focus' | 'break';
  preset: SessionPreset;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completed: boolean;
  interrupted: boolean;
}

export interface SessionPreset {
  id: string;
  name: string;
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  color: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartNextSession: boolean;
  widgetPosition: { x: number; y: number };
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number; // in seconds
  currentSession: SessionData | null;
  sessionCount: number;
  currentPreset: SessionPreset;
}

export interface BreakSuggestion {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: 'physical' | 'mental' | 'social' | 'creative';
  icon?: string;
}

declare global {
  interface Window {
    electronAPI: {
      showTimerWidget: () => Promise<void>;
      hideTimerWidget: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      minimizeMainWindow: () => Promise<void>;
      closeMainWindow: () => Promise<void>;
      storeSessionData: (sessionData: SessionData) => Promise<boolean>;
      getSessionData: () => Promise<SessionData[] | null>;
      showNotification: (title: string, body: string) => void;
      openTimerWidget: (data: {
        timeLeft: number;
        isRunning: boolean;
        sessionType: 'work' | 'break';
        presetName: string;
      }) => void;
    };
  }
}
