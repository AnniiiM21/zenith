# 🎯 Zenith Chrome Extension - Quick Start Guide

## ✅ Your extension is ready to test!

### 📦 Installation Steps:

1. **Open Chrome** and navigate to:

   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**:

   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**:

   - Click "Load unpacked" button
   - Navigate to your Zenith project folder
   - Select the `dist` folder and click "Select Folder"

4. **Success!** You should see the Zenith extension loaded with a purple "Z" icon

### 🚀 Testing the Extension:

#### Timer Features:

- Click the Zenith icon in your Chrome toolbar
- The popup opens with your familiar Zenith interface
- Select different timer presets (Pomodoro, Deep Work, etc.)
- Start a timer - it runs in the background even when popup is closed
- You'll get a notification when the timer completes

#### Browser Tracking Features:

- Go to the "Analytics" tab in the popup
- Click "▶️ Start" to begin browser tracking
- Open different websites, switch tabs, browse normally
- Watch the real-time stats update in the popup
- Click "⏹️ Stop" to generate a detailed session report
- View top sites, time spent, tab switches, and productivity score

### 🔍 Key Advantages Over Electron App:

✅ **Real Browser Data**: Actually tracks your browsing activity  
✅ **Always Running**: Background service worker keeps everything active  
✅ **Better Integration**: Seamless with your browser workflow  
✅ **Lightweight**: No separate app window needed  
✅ **Real Tracking**: Access to actual tabs, URLs, focus time

### 🐛 Troubleshooting:

- **Extension not loading?** Check the Chrome console for errors
- **Popup not opening?** Right-click the extension icon → "Inspect popup"
- **Tracking not working?** Check that permissions are granted
- **Timer notifications not showing?** Chrome might need notification permission

### 🛠️ Development:

To make changes and reload:

1. Edit the source files
2. Run: `npm run build-extension`
3. Go to `chrome://extensions/`
4. Click the refresh icon on your Zenith extension

### 📊 What's Tracked:

- **Active tabs**: Which tabs you have open
- **Time spent**: Estimates per website
- **Tab switches**: How often you switch between tabs
- **Site visits**: Which domains you visit
- **Session time**: Total tracking duration
- **Productivity score**: Based on site categories

This is much better than the Electron version because it has **real browser access** instead of simulated data! 🎉
