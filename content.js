// Content script for Zenith Chrome Extension
// Runs on all web pages to collect browsing data

class ZenithContentScript {
  constructor() {
    this.isActive = false;
    this.currentDomain = window.location.hostname;
    this.startTime = Date.now();
    this.focusTime = 0;
    this.lastFocusTime = Date.now();
    
    this.init();
  }

  init() {
    // Listen for visibility changes (tab switching, window focus)
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Listen for focus/blur events
    window.addEventListener('focus', () => {
      this.handleFocus();
    });

    window.addEventListener('blur', () => {
      this.handleBlur();
    });

    // Track scrolling activity (engagement indicator)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackActivity('scroll');
      }, 100);
    });

    // Track click activity
    document.addEventListener('click', () => {
      this.trackActivity('click');
    });

    // Track keyboard activity
    document.addEventListener('keydown', () => {
      this.trackActivity('keydown');
    });

    // Start tracking when content script loads
    this.startTracking();
  }

  startTracking() {
    this.isActive = true;
    this.startTime = Date.now();
    this.lastFocusTime = Date.now();
    
    // Send initial page data to background
    this.sendPageData();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.handleBlur();
    } else {
      this.handleFocus();
    }
  }

  handleFocus() {
    if (this.isActive) {
      this.lastFocusTime = Date.now();
      this.sendActivityUpdate('focus');
    }
  }

  handleBlur() {
    if (this.isActive && this.lastFocusTime) {
      const focusedTime = Date.now() - this.lastFocusTime;
      this.focusTime += focusedTime;
      this.sendActivityUpdate('blur', { focusedTime });
    }
  }

  trackActivity(type) {
    if (this.isActive) {
      this.sendActivityUpdate('activity', { type, timestamp: Date.now() });
    }
  }

  sendPageData() {
    const pageData = {
      url: window.location.href,
      domain: this.currentDomain,
      title: document.title,
      timestamp: Date.now(),
      type: 'page_visit'
    };

    // Send to background script
    chrome.runtime.sendMessage({
      action: 'trackPageVisit',
      data: pageData
    }).catch(error => {
      // Extension might not be active, ignore error
      console.log('Zenith tracking not active');
    });
  }

  sendActivityUpdate(activityType, data = {}) {
    const activityData = {
      url: window.location.href,
      domain: this.currentDomain,
      title: document.title,
      activityType,
      timestamp: Date.now(),
      focusTime: this.focusTime,
      ...data
    };

    chrome.runtime.sendMessage({
      action: 'trackActivity',
      data: activityData
    }).catch(error => {
      // Extension might not be active, ignore error
    });
  }

  // Method to be called when tracking stops
  stopTracking() {
    this.handleBlur(); // Record final focus time
    this.isActive = false;
    
    const finalData = {
      domain: this.currentDomain,
      url: window.location.href,
      title: document.title,
      totalTime: Date.now() - this.startTime,
      focusTime: this.focusTime,
      type: 'session_end'
    };

    chrome.runtime.sendMessage({
      action: 'trackSessionEnd',
      data: finalData
    }).catch(error => {
      // Extension might not be active, ignore error
    });
  }
}

// Initialize content script
const zenithContent = new ZenithContentScript();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stopTracking') {
    zenithContent.stopTracking();
    sendResponse({ success: true });
  }
});

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
  zenithContent.stopTracking();
});
