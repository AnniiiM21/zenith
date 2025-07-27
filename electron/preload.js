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
});
