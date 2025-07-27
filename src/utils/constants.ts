import { SessionPreset, BreakSuggestion } from '../types';

export const DEFAULT_PRESETS: SessionPreset[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro Classic',
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    color: '#ef4444'
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    focusDuration: 50,
    breakDuration: 10,
    longBreakDuration: 30,
    sessionsUntilLongBreak: 3,
    color: '#3b82f6'
  },
  {
    id: 'sprint',
    name: 'Quick Sprint',
    focusDuration: 15,
    breakDuration: 3,
    longBreakDuration: 10,
    sessionsUntilLongBreak: 6,
    color: '#10b981'
  },
  {
    id: 'ultra-focus',
    name: 'Ultra Focus',
    focusDuration: 90,
    breakDuration: 20,
    longBreakDuration: 45,
    sessionsUntilLongBreak: 2,
    color: '#8b5cf6'
  }
];

export const BREAK_SUGGESTIONS: BreakSuggestion[] = [
  {
    id: 'walk',
    title: 'Take a Walk',
    description: 'Step outside or walk around your space for fresh air and movement',
    duration: 5,
    category: 'physical',
    icon: '🚶'
  },
  {
    id: 'stretch',
    title: 'Stretch & Move',
    description: 'Do some simple stretches to relieve tension and improve circulation',
    duration: 5,
    category: 'physical',
    icon: '🧘'
  },
  {
    id: 'hydrate',
    title: 'Hydrate & Snack',
    description: 'Drink water and have a healthy snack to refuel your body',
    duration: 3,
    category: 'physical',
    icon: '💧'
  },
  {
    id: 'breathe',
    title: 'Deep Breathing',
    description: 'Practice deep breathing exercises to reduce stress and refocus',
    duration: 3,
    category: 'mental',
    icon: '🫁'
  },
  {
    id: 'meditate',
    title: 'Quick Meditation',
    description: 'Try a brief mindfulness or meditation session',
    duration: 10,
    category: 'mental',
    icon: '🧘‍♀️'
  },
  {
    id: 'chat',
    title: 'Social Check-in',
    description: 'Connect with a friend, family member, or colleague',
    duration: 5,
    category: 'social',
    icon: '💬'
  },
  {
    id: 'music',
    title: 'Listen to Music',
    description: 'Enjoy a favorite song or discover something new',
    duration: 5,
    category: 'creative',
    icon: '🎵'
  },
  {
    id: 'journal',
    title: 'Quick Journal',
    description: 'Write down thoughts, progress, or gratitude',
    duration: 5,
    category: 'mental',
    icon: '📝'
  }
];

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getStoredSessions = (): any[] => {
  try {
    const stored = localStorage.getItem('studyfocus_sessions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const storeSession = (session: any): void => {
  try {
    const sessions = getStoredSessions();
    sessions.push(session);
    localStorage.setItem('studyfocus_sessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Error storing session:', error);
  }
};

export const getStoredSettings = (): any => {
  try {
    const stored = localStorage.getItem('studyfocus_settings');
    return stored ? JSON.parse(stored) : {
      theme: 'system',
      soundEnabled: true,
      notificationsEnabled: true,
      autoStartBreaks: false,
      autoStartNextSession: false,
      widgetPosition: { x: 100, y: 100 }
    };
  } catch {
    return {
      theme: 'system',
      soundEnabled: true,
      notificationsEnabled: true,
      autoStartBreaks: false,
      autoStartNextSession: false,
      widgetPosition: { x: 100, y: 100 }
    };
  }
};

export const storeSettings = (settings: any): void => {
  try {
    localStorage.setItem('studyfocus_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error storing settings:', error);
  }
};
