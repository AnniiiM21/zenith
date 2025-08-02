const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const BrowserActivityTracker = require('./browserTracker');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let timerWidget = null;
let browserTracker = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false,
    icon: path.join(__dirname, '../assets/icon.png')
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (timerWidget) {
      timerWidget.close();
      timerWidget = null;
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function createTimerWidget() {
  if (timerWidget) {
    timerWidget.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  timerWidget = new BrowserWindow({
    width: 200,
    height: 200,
    x: width - 220,
    y: 20,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const widgetUrl = isDev 
    ? 'http://localhost:3002#/timer-widget' 
    : `file://${path.join(__dirname, '../dist/index.html#/timer-widget')}`;
  
  timerWidget.loadURL(widgetUrl);

  timerWidget.on('closed', () => {
    timerWidget = null;
  });

  // Make widget draggable
  timerWidget.setIgnoreMouseEvents(false);
}

function closeTimerWidget() {
  if (timerWidget) {
    timerWidget.close();
    timerWidget = null;
  }
}

app.whenReady().then(() => {
  createMainWindow();
  
  // Initialize browser activity tracker
  browserTracker = new BrowserActivityTracker();
  console.log('🎯 Browser Activity Tracker initialized');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// IPC handlers
ipcMain.handle('show-timer-widget', () => {
  createTimerWidget();
});

ipcMain.handle('hide-timer-widget', () => {
  closeTimerWidget();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('minimize-main-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('close-main-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Store data handlers
ipcMain.handle('store-session-data', async (event, sessionData) => {
  // For now, we'll use localStorage on the renderer side
  // In a production app, you might want to use electron-store or similar
  return true;
});

ipcMain.handle('get-session-data', async () => {
  // For now, we'll use localStorage on the renderer side
  return null;
});

// Notification handler
ipcMain.handle('show-notification', async (event, title, body) => {
  const { Notification } = require('electron');
  
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, '../assets/icon.png')
    });
    
    notification.show();
    return true;
  }
  return false;
});

// Timer widget with data handler
ipcMain.handle('open-timer-widget', async (event, data) => {
  createTimerWidget();
  
  // Send timer data to widget when it's ready
  if (timerWidget) {
    timerWidget.webContents.once('did-finish-load', () => {
      timerWidget.webContents.send('timer-data', data);
    });
  }
});

// Browser Activity Tracking handlers
ipcMain.handle('start-browser-tracking', async () => {
  if (browserTracker) {
    console.log('🎯 Starting browser tracking via IPC...');
    browserTracker.startTracking();
    return { success: true, message: 'Browser tracking started' };
  }
  console.error('❌ Browser tracker not initialized');
  return { success: false, message: 'Browser tracker not initialized' };
});

ipcMain.handle('stop-browser-tracking', async () => {
  if (browserTracker) {
    console.log('⏹️ Stopping browser tracking via IPC...');
    browserTracker.stopTracking();
    return { success: true, message: 'Browser tracking stopped' };
  }
  return { success: false, message: 'Browser tracker not initialized' };
});

ipcMain.handle('test-browser-tracking', async () => {
  if (browserTracker) {
    console.log('🧪 Testing browser tracking PowerShell...');
    browserTracker.testPowerShell();
    return { success: true, message: 'PowerShell test initiated' };
  }
  return { success: false, message: 'Browser tracker not initialized' };
});

ipcMain.handle('get-browser-stats', async () => {
  if (browserTracker) {
    return browserTracker.exportStats();
  }
  return null;
});

ipcMain.handle('clear-browser-stats', async () => {
  if (browserTracker) {
    browserTracker.clearStats();
    return { success: true, message: 'Browser stats cleared' };
  }
  return { success: false, message: 'Browser tracker not initialized' };
});

ipcMain.handle('get-browser-tracking-status', async () => {
  if (browserTracker) {
    return { 
      isTracking: browserTracker.isTracking,
      currentSession: browserTracker.currentSession 
    };
  }
  return { isTracking: false, currentSession: null };
});
