export interface TimerWidgetData {
  timeLeft: number;
  isRunning: boolean;
  sessionType: 'work' | 'break';
  presetName: string;
}

export interface ElectronAPI {
  showTimerWidget: () => Promise<void>;
  hideTimerWidget: () => Promise<void>;
  getAppVersion: () => Promise<string>;
  minimizeMainWindow: () => Promise<void>;
  closeMainWindow: () => Promise<void>;
  storeSessionData: (sessionData: any) => Promise<void>;
  getSessionData: () => Promise<any>;
  showNotification: (title: string, body: string) => Promise<void>;
  openTimerWidget: (data: TimerWidgetData) => void;
  
  // Browser Activity Tracking APIs
  startBrowserTracking: () => Promise<{ success: boolean; message: string }>;
  stopBrowserTracking: () => Promise<{ success: boolean; message: string }>;
  getBrowserStats: () => Promise<any>;
  clearBrowserStats: () => Promise<{ success: boolean; message: string }>;
  getBrowserTrackingStatus: () => Promise<{ isTracking: boolean; currentSession: any }>;
  testBrowserTracking: () => Promise<{ success: boolean; message: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
