// Chrome Extension Background Service Worker
// Handles timer logic, data persistence, and browser activity tracking

class ZenithBackground {
  constructor() {
    this.isTracking = false;
    this.currentSession = null;
    this.trackingData = {
      startTime: null,
      sites: new Map(),
      tabSwitches: 0,
      activeTab: null
    };
    
    this.setupEventListeners();
    this.setupAlarms();
  }

  setupEventListeners() {
    // Tab change tracking
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    // Tab update tracking (URL changes)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && this.isTracking) {
        this.trackSiteVisit(tab.url, tab.title);
      }
    });

    // Window focus changes
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        this.handleWindowFocus();
      }
    });

    // Extension icon click
    chrome.action.onClicked.addListener(() => {
      this.openPopup();
    });

    // Messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Alarm handling for timer
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });
  }

  setupAlarms() {
    // Clear any existing alarms
    chrome.alarms.clearAll();
  }

  async handleTabChange(tabId) {
    if (!this.isTracking) return;

    try {
      const tab = await chrome.tabs.get(tabId);
      this.trackingData.tabSwitches++;
      this.trackSiteVisit(tab.url, tab.title);
      this.trackingData.activeTab = {
        id: tabId,
        url: tab.url,
        title: tab.title
      };
    } catch (error) {
      console.log('Tab tracking error:', error);
    }
  }

  handleWindowFocus() {
    if (!this.isTracking) return;
    // Track window focus changes for productivity analysis
  }

  trackSiteVisit(url, title) {
    if (!url || !this.isTracking) return;

    try {
      const domain = new URL(url).hostname;
      const now = Date.now();
      
      if (!this.trackingData.sites.has(domain)) {
        this.trackingData.sites.set(domain, {
          domain,
          title: title || domain,
          timeSpent: 0,
          visits: 0,
          lastVisit: now
        });
      }

      const siteData = this.trackingData.sites.get(domain);
      siteData.visits++;
      siteData.lastVisit = now;
      
      // Update badge with site count
      this.updateBadge();
    } catch (error) {
      console.log('Site tracking error:', error);
    }
  }

  async updateBadge() {
    if (this.isTracking) {
      const siteCount = this.trackingData.sites.size.toString();
      await chrome.action.setBadgeText({ text: siteCount });
      await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  }

  async startTracking() {
    this.isTracking = true;
    this.trackingData = {
      startTime: Date.now(),
      sites: new Map(),
      tabSwitches: 0,
      activeTab: null
    };

    // Get current active tab
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.trackSiteVisit(tab.url, tab.title);
        this.trackingData.activeTab = {
          id: tab.id,
          url: tab.url,
          title: tab.title
        };
      }
    } catch (error) {
      console.log('Initial tab tracking error:', error);
    }

    this.updateBadge();
    console.log('✅ Zenith tracking started');
  }

  async stopTracking() {
    this.isTracking = false;
    
    // Generate final report
    const report = this.generateTrackingReport();
    
    // Save to storage
    await this.saveTrackingReport(report);
    
    this.updateBadge();
    console.log('🛑 Zenith tracking stopped');
    
    return report;
  }

  generateTrackingReport() {
    const now = Date.now();
    const totalTime = this.trackingData.startTime ? now - this.trackingData.startTime : 0;
    
    // Convert sites Map to array and calculate time spent
    const sites = Array.from(this.trackingData.sites.values()).map(site => ({
      ...site,
      timeSpent: this.calculateTimeSpent(site),
      percentage: 0 // Will calculate after sorting
    }));

    // Sort by time spent
    sites.sort((a, b) => b.timeSpent - a.timeSpent);

    // Calculate percentages
    sites.forEach(site => {
      site.percentage = totalTime > 0 ? (site.timeSpent / totalTime) * 100 : 0;
    });

    return {
      sessionId: `session_${Date.now()}`,
      startTime: this.trackingData.startTime,
      endTime: now,
      totalTime,
      totalTimeFormatted: this.formatTime(totalTime),
      sitesVisited: sites.length,
      tabSwitches: this.trackingData.tabSwitches,
      topSites: sites.slice(0, 10),
      activeTab: this.trackingData.activeTab,
      productivity: this.calculateProductivityScore(sites)
    };
  }

  calculateTimeSpent(site) {
    // Estimate time spent based on visits and activity
    // This is a simplified calculation - in a real extension you'd track focus time
    return site.visits * 60000; // Assume 1 minute per visit for demo
  }

  calculateProductivityScore(sites) {
    // Simple productivity scoring based on site categories
    const productiveSites = ['github.com', 'stackoverflow.com', 'docs.google.com', 'notion.so'];
    const distractingSites = ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com'];
    
    let productiveTime = 0;
    let distractingTime = 0;
    
    sites.forEach(site => {
      if (productiveSites.some(prod => site.domain.includes(prod))) {
        productiveTime += site.timeSpent;
      } else if (distractingSites.some(dist => site.domain.includes(dist))) {
        distractingTime += site.timeSpent;
      }
    });
    
    const totalTime = productiveTime + distractingTime;
    return totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
  }

  async saveTrackingReport(report) {
    try {
      const { trackingReports = [] } = await chrome.storage.local.get(['trackingReports']);
      trackingReports.unshift(report); // Add to beginning
      
      // Keep only last 50 reports
      if (trackingReports.length > 50) {
        trackingReports.splice(50);
      }
      
      await chrome.storage.local.set({ trackingReports });
    } catch (error) {
      console.error('Error saving tracking report:', error);
    }
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'startTracking':
          await this.startTracking();
          sendResponse({ success: true, tracking: true });
          break;
          
        case 'stopTracking':
          const report = await this.stopTracking();
          sendResponse({ success: true, tracking: false, report });
          break;
          
        case 'getTrackingStatus':
          const status = await this.getTrackingStatus();
          sendResponse(status);
          break;
          
        case 'getTrackingReports':
          const { trackingReports = [] } = await chrome.storage.local.get(['trackingReports']);
          sendResponse({ reports: trackingReports });
          break;
          
        case 'startTimer':
          await this.startTimer(request.duration, request.sessionType);
          sendResponse({ success: true });
          break;
          
        case 'stopTimer':
          await this.stopTimer();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ error: error.message });
    }
  }

  async getTrackingStatus() {
    const currentData = this.isTracking ? {
      isTracking: true,
      startTime: this.trackingData.startTime,
      sitesVisited: this.trackingData.sites.size,
      tabSwitches: this.trackingData.tabSwitches,
      currentSite: this.trackingData.activeTab?.title || 'Unknown',
      totalTime: this.formatTime(Date.now() - this.trackingData.startTime)
    } : {
      isTracking: false
    };

    return currentData;
  }

  async startTimer(duration, sessionType = 'work') {
    // Create alarm for timer
    await chrome.alarms.create('zenithTimer', {
      delayInMinutes: duration
    });
    
    // Store timer info
    await chrome.storage.local.set({
      timerActive: true,
      timerStart: Date.now(),
      timerDuration: duration * 60 * 1000,
      sessionType
    });
    
    // Update badge to show timer
    await chrome.action.setBadgeText({ text: '⏱️' });
    await chrome.action.setBadgeBackgroundColor({ color: '#667EEA' });
  }

  async stopTimer() {
    await chrome.alarms.clear('zenithTimer');
    await chrome.storage.local.remove(['timerActive', 'timerStart', 'timerDuration', 'sessionType']);
    this.updateBadge();
  }

  async handleAlarm(alarm) {
    if (alarm.name === 'zenithTimer') {
      // Timer completed - show notification
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Zenith Timer Complete!',
        message: 'Your focus session is complete. Time for a break!'
      });
      
      // Clear timer storage
      await this.stopTimer();
    }
  }

  openPopup() {
    // The popup will open automatically when action is clicked
    // This method can be used for additional logic if needed
  }
}

// Initialize the background service
const zenithBackground = new ZenithBackground();

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('Zenith extension started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Zenith extension installed');
});
