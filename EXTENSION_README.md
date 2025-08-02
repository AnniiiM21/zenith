# Zenith Chrome Extension

## Building the Extension

1. **Build the extension files:**

   ```bash
   npm run build-extension
   ```

2. **For development (with file watching):**
   ```bash
   npm run dev-extension
   ```

## Loading the Extension in Chrome

1. **Open Chrome and go to:**

   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode:**

   - Toggle the "Developer mode" switch in the top right

3. **Load the extension:**

   - Click "Load unpacked"
   - Select the `dist` folder from your Zenith project

4. **The extension should now appear in your Chrome toolbar!**

## Using the Extension

### Timer Features:

- Click the Zenith icon in the toolbar to open the popup
- Select from preset timers (Pomodoro, Deep Work, etc.)
- Start/pause/reset timers
- Timer runs in background even when popup is closed

### Browser Tracking Features:

- Click "Start Tracking" in the Analytics tab
- Extension will monitor your browsing activity in real-time
- Track time spent on different websites
- Get detailed session reports when you stop tracking
- View productivity scores and top visited sites

### Key Advantages over Electron:

✅ **Real browser access** - Actually tracks your browsing activity
✅ **Always running** - Background service worker keeps timers active
✅ **No installation** - Just load into Chrome, no separate app
✅ **Better integration** - Works seamlessly with your browser workflow
✅ **Lightweight** - No separate window, uses popup interface
✅ **Real data** - Access to actual tabs, URLs, and browsing patterns

## Features

- **Session Presets:** Pomodoro (25min), Deep Work (45min), Quick Focus (15min), Long Session (90min)
- **Real-time Tracking:** Monitor active tabs, time spent on sites, tab switches
- **Analytics:** Detailed session reports with productivity scoring
- **Background Operation:** Timers and tracking continue even when popup is closed
- **Notifications:** Get notified when timer sessions complete

## Development

The extension consists of:

- `popup.js` - React popup interface (simplified version of your original app)
- `background.js` - Service worker for timer logic and data tracking
- `content.js` - Content script for page-level activity tracking
- `manifest.json` - Extension configuration

## Debugging

- Use Chrome DevTools for popup debugging
- Check `chrome://extensions/` for error messages
- View background script logs in the extension's "Service worker" inspector
- Content script logs appear in each page's console

## Next Steps

Once you test the basic functionality, we can:

1. Add more advanced analytics features
2. Implement data export/import
3. Add custom notification sounds
4. Create a settings panel for customization
5. Add productivity insights and recommendations
