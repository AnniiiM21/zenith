const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showTimerWidget: () => ipcRenderer.invoke('show-timer-widget'),
  hideTimerWidget: () => ipcRenderer.invoke('hide-timer-widget'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeMainWindow: () => ipcRenderer.invoke('minimize-main-window'),
  closeMainWindow: () => ipcRenderer.invoke('close-main-window'),
  storeSessionData: (sessionData) => ipcRenderer.invoke('store-session-data', sessionData),
  getSessionData: () => ipcRenderer.invoke('get-session-data'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  openTimerWidget: (data) => ipcRenderer.invoke('open-timer-widget', data),
  
  // Browser Activity Tracking APIs
  startBrowserTracking: () => ipcRenderer.invoke('start-browser-tracking'),
  stopBrowserTracking: () => ipcRenderer.invoke('stop-browser-tracking'),
  getBrowserStats: () => ipcRenderer.invoke('get-browser-stats'),
  clearBrowserStats: () => ipcRenderer.invoke('clear-browser-stats'),
  getBrowserTrackingStatus: () => ipcRenderer.invoke('get-browser-tracking-status'),
  testBrowserTracking: () => ipcRenderer.invoke('test-browser-tracking'),
});
