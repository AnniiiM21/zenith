export interface TimerWidgetData {
  timeLeft: number;
  isRunning: boolean;
  sessionType: 'work' | 'break';
  presetName: string;
}

export interface ElectronAPI {
  showNotification: (title: string, body: string) => void;
  openTimerWidget: (data: TimerWidgetData) => void;
  onTimerUpdate: (callback: (data: TimerWidgetData) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
