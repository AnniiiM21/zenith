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
      activeTab: null,
    };

    // Timer state management
    this.timerState = {
      isActive: false,
      startTime: null,
      duration: 0,
      sessionType: "work",
    };
    this.timerInterval = null;

    this.setupEventListeners();
    this.setupAlarms();
    this.restoreTimerState();
    this.restoreTrackingState();
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
        title: tab.title,
      };

      // Update persistent storage with tab switches count
      await chrome.storage.local.set({
        trackingTabSwitches: this.trackingData.tabSwitches,
      });
    } catch (error) {
      console.log("Tab tracking error:", error);
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
          lastVisit: now,
        });
      }

      const siteData = this.trackingData.sites.get(domain);
      siteData.visits++;
      siteData.lastVisit = now;

      // Update persistent storage with sites data
      this.updateTrackingStorage();

      // Update badge with site count
      this.updateBadge();
    } catch (error) {
      console.log("Site tracking error:", error);
    }
  }

  async updateBadge() {
    if (this.isTracking) {
      const siteCount = this.trackingData.sites.size.toString();
      await chrome.action.setBadgeText({ text: siteCount });
      await chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    } else {
      await chrome.action.setBadgeText({ text: "" });
    }
  }

  async startTracking() {
    this.isTracking = true;
    this.trackingData = {
      startTime: Date.now(),
      sites: new Map(),
      tabSwitches: 0,
      activeTab: null,
    };

    // Save tracking state to Chrome storage for persistence
    await chrome.storage.local.set({
      trackingActive: true,
      trackingStartTime: this.trackingData.startTime,
      trackingTabSwitches: 0,
      trackingSites: {}, // Will be updated as sites are visited
    });

    // Get current active tab
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        this.trackSiteVisit(tab.url, tab.title);
        this.trackingData.activeTab = {
          id: tab.id,
          url: tab.url,
          title: tab.title,
        };
      }
    } catch (error) {
      console.log("Initial tab tracking error:", error);
    }

    this.updateBadge();
    console.log(
      "✅ Zenith tracking started - will persist until manually stopped"
    );
  }

  async stopTracking() {
    this.isTracking = false;

    // Generate final report
    const report = this.generateTrackingReport();

    // Save to storage
    await this.saveTrackingReport(report);

    // Clear persistent tracking state
    await chrome.storage.local.remove([
      "trackingActive",
      "trackingStartTime",
      "trackingTabSwitches",
      "trackingSites",
    ]);

    this.updateBadge();
    console.log("🛑 Zenith tracking stopped - persistent state cleared");

    return report;
  }

  generateTrackingReport() {
    const now = Date.now();
    const totalTime = this.trackingData.startTime
      ? now - this.trackingData.startTime
      : 0;

    // Convert sites Map to array and calculate time spent
    const sites = Array.from(this.trackingData.sites.values()).map((site) => ({
      ...site,
      timeSpent: this.calculateTimeSpent(site),
      percentage: 0, // Will calculate after sorting
    }));

    // Sort by time spent
    sites.sort((a, b) => b.timeSpent - a.timeSpent);

    // Calculate percentages
    sites.forEach((site) => {
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
      productivity: this.calculateProductivityScore(sites),
    };
  }

  calculateTimeSpent(site) {
    // Estimate time spent based on visits and activity
    // This is a simplified calculation - in a real extension you'd track focus time
    return site.visits * 60000; // Assume 1 minute per visit for demo
  }

  calculateProductivityScore(sites) {
    // Simple productivity scoring based on site categories
    const productiveSites = [
      "github.com",
      "stackoverflow.com",
      "docs.google.com",
      "notion.so",
    ];
    const distractingSites = [
      "youtube.com",
      "facebook.com",
      "twitter.com",
      "instagram.com",
    ];

    let productiveTime = 0;
    let distractingTime = 0;

    sites.forEach((site) => {
      if (productiveSites.some((prod) => site.domain.includes(prod))) {
        productiveTime += site.timeSpent;
      } else if (distractingSites.some((dist) => site.domain.includes(dist))) {
        distractingTime += site.timeSpent;
      }
    });

    const totalTime = productiveTime + distractingTime;
    return totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
  }

  async saveTrackingReport(report) {
    try {
      const { trackingReports = [] } = await chrome.storage.local.get([
        "trackingReports",
      ]);
      trackingReports.unshift(report); // Add to beginning

      // Keep only last 50 reports
      if (trackingReports.length > 50) {
        trackingReports.splice(50);
      }

      await chrome.storage.local.set({ trackingReports });
    } catch (error) {
      console.error("Error saving tracking report:", error);
    }
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(
        seconds % 60
      ).padStart(2, "0")}`;
    } else {
      return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case "startTracking":
          await this.startTracking();
          sendResponse({ success: true, tracking: true });
          break;

        case "stopTracking":
          const report = await this.stopTracking();
          sendResponse({ success: true, tracking: false, report });
          break;

        case "getTrackingStatus":
          const status = await this.getTrackingStatus();
          sendResponse(status);
          break;

        case "getTrackingReports":
          const { trackingReports = [] } = await chrome.storage.local.get([
            "trackingReports",
          ]);
          sendResponse({ reports: trackingReports });
          break;

        case "startTimer":
          await this.startTimer(request.duration, request.sessionType);
          sendResponse({ success: true });
          break;

        case "stopTimer":
          await this.stopTimer();
          sendResponse({ success: true });
          break;

        case "pauseTimer":
          await this.pauseTimer();
          sendResponse({ success: true });
          break;

        case "resumeTimer":
          await this.resumeTimer();
          sendResponse({ success: true });
          break;

        case "getTimerState":
          const timerData = await this.getTimerState();
          sendResponse(timerData);
          break;
        default:
          sendResponse({ error: "Unknown action" });
      }
    } catch (error) {
      console.error("Message handling error:", error);
      sendResponse({ error: error.message });
    }
  }

  async getTrackingStatus() {
    const currentData = this.isTracking
      ? {
          isTracking: true,
          startTime: this.trackingData.startTime,
          sitesVisited: this.trackingData.sites.size,
          tabSwitches: this.trackingData.tabSwitches,
          currentSite: this.trackingData.activeTab?.title || "Unknown",
          totalTime: this.formatTime(Date.now() - this.trackingData.startTime),
        }
      : {
          isTracking: false,
        };

    return currentData;
  }

  async startTimer(duration, sessionType = "work") {
    // Clear any existing timer
    await this.stopTimer();

    // Set up timer state
    this.timerState = {
      isActive: true,
      startTime: Date.now(),
      duration: duration * 60 * 1000, // Convert minutes to milliseconds
      sessionType,
    };

    // Create alarm for timer completion
    await chrome.alarms.create("zenithTimer", {
      delayInMinutes: duration,
    });

    // Store timer info in chrome storage for persistence
    await chrome.storage.local.set({
      timerActive: true,
      timerStart: this.timerState.startTime,
      timerDuration: this.timerState.duration,
      sessionType,
    });

    // Update badge to show timer is active
    await chrome.action.setBadgeText({ text: "⏱️" });
    await chrome.action.setBadgeBackgroundColor({ color: "#667EEA" });

    // Start timer update interval for badge updates
    this.startTimerInterval();
  }

  async stopTimer() {
    // Clear alarm
    await chrome.alarms.clear("zenithTimer");

    // Clear timer interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Reset timer state
    this.timerState = {
      isActive: false,
      startTime: null,
      duration: 0,
      sessionType: "work",
    };

    // Clear storage
    await chrome.storage.local.remove([
      "timerActive",
      "timerStart",
      "timerDuration",
      "sessionType",
      "timerPaused",
      "pausedTimeLeft",
    ]);

    // Reset badge
    this.updateBadge();
  }

  async pauseTimer() {
    if (!this.timerState.isActive) return;

    // Calculate remaining time
    const elapsed = Date.now() - this.timerState.startTime;
    const remaining = Math.max(0, this.timerState.duration - elapsed);

    // Clear alarm and interval
    await chrome.alarms.clear("zenithTimer");
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Mark as paused
    this.timerState.isActive = false;

    // Store paused state
    await chrome.storage.local.set({
      timerPaused: true,
      pausedTimeLeft: remaining,
      sessionType: this.timerState.sessionType,
    });

    // Update badge to show paused
    await chrome.action.setBadgeText({ text: "⏸️" });
    await chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
  }

  async resumeTimer() {
    try {
      const data = await chrome.storage.local.get([
        "timerPaused",
        "pausedTimeLeft",
        "sessionType",
      ]);

      if (!data.timerPaused || !data.pausedTimeLeft) return;

      // Resume timer with remaining time
      this.timerState = {
        isActive: true,
        startTime: Date.now(),
        duration: data.pausedTimeLeft,
        sessionType: data.sessionType || "work",
      };

      // Set alarm for remaining time
      await chrome.alarms.create("zenithTimer", {
        delayInMinutes: data.pausedTimeLeft / (60 * 1000),
      });

      // Store resumed timer info
      await chrome.storage.local.set({
        timerActive: true,
        timerStart: this.timerState.startTime,
        timerDuration: this.timerState.duration,
        sessionType: this.timerState.sessionType,
      });

      // Clear paused state
      await chrome.storage.local.remove(["timerPaused", "pausedTimeLeft"]);

      // Update badge to show timer is active
      await chrome.action.setBadgeText({ text: "⏱️" });
      await chrome.action.setBadgeBackgroundColor({ color: "#667EEA" });

      // Start timer update interval
      this.startTimerInterval();
    } catch (error) {
      console.error("Error resuming timer:", error);
    }
  }

  async handleAlarm(alarm) {
    if (alarm.name === "zenithTimer") {
      await this.handleTimerComplete();
    } else if (alarm.name === "zenithBreakTimer") {
      await this.handleBreakComplete();
    }
  }

  async handleTimerComplete() {
    const currentSessionType = this.timerState.sessionType;

    if (currentSessionType === "work") {
      // Work session completed - start break
      await this.showWorkCompleteNotification();
    } else if (currentSessionType === "break") {
      // Break completed - session finished
      await this.showBreakCompleteNotification();
    }
  }

  async showWorkCompleteNotification() {
    // Show notification that work session is complete
    await chrome.notifications.create("workComplete", {
      type: "basic",
      iconUrl: "icons/zenith_logo.png",
      title: "Work Session Complete! 🎉",
      message: "Great job! Time for a well-deserved break.",
      buttons: [{ title: "Start Break" }, { title: "Skip Break" }],
      requireInteraction: true,
    });

    // Listen for notification button clicks
    chrome.notifications.onButtonClicked.addListener(
      this.handleWorkCompleteResponse.bind(this)
    );
    chrome.notifications.onClicked.addListener(
      this.handleWorkCompleteClick.bind(this)
    );
  }

  async handleWorkCompleteResponse(notificationId, buttonIndex) {
    if (notificationId === "workComplete") {
      chrome.notifications.clear("workComplete");

      if (buttonIndex === 0) {
        // Start Break button clicked
        await this.startBreakTimer();
      } else {
        // Skip Break button clicked
        await this.completeSession();
      }

      // Remove listeners to prevent memory leaks
      chrome.notifications.onButtonClicked.removeListener(
        this.handleWorkCompleteResponse
      );
      chrome.notifications.onClicked.removeListener(
        this.handleWorkCompleteClick
      );
    }
  }

  async handleWorkCompleteClick(notificationId) {
    if (notificationId === "workComplete") {
      // Default action when notification is clicked (not button)
      chrome.notifications.clear("workComplete");
      await this.startBreakTimer();

      // Remove listeners
      chrome.notifications.onButtonClicked.removeListener(
        this.handleWorkCompleteResponse
      );
      chrome.notifications.onClicked.removeListener(
        this.handleWorkCompleteClick
      );
    }
  }

  async startBreakTimer() {
    // Get break duration from session preset (default 5 minutes)
    const breakDuration = await this.getBreakDuration();

    // Clear current timer state
    await chrome.alarms.clear("zenithTimer");

    // Set up break timer
    this.timerState = {
      isActive: true,
      startTime: Date.now(),
      duration: breakDuration * 60 * 1000, // Convert minutes to milliseconds
      sessionType: "break",
    };

    // Create alarm for break completion
    await chrome.alarms.create("zenithTimer", {
      delayInMinutes: breakDuration,
    });

    // Store break timer info
    await chrome.storage.local.set({
      timerActive: true,
      timerStart: this.timerState.startTime,
      timerDuration: this.timerState.duration,
      sessionType: "break",
    });

    // Update badge to show break timer
    await chrome.action.setBadgeText({ text: "☕" });
    await chrome.action.setBadgeBackgroundColor({ color: "#10b981" });

    // Start timer interval for badge updates
    this.startTimerInterval();

    // Show break started notification
    await chrome.notifications.create("breakStarted", {
      type: "basic",
      iconUrl: "icons/zenith_logo.png",
      title: "Break Time Started! ☕",
      message: `Enjoy your ${breakDuration}-minute break. You've earned it!`,
    });

    // Clear the notification after 3 seconds
    setTimeout(() => {
      chrome.notifications.clear("breakStarted");
    }, 3000);
  }

  async getBreakDuration() {
    // Get the stored break duration from current session
    try {
      const { currentBreakDuration } = await chrome.storage.local.get([
        "currentBreakDuration",
      ]);
      return currentBreakDuration || 5; // Default to 5 minutes if not found
    } catch (error) {
      console.error("Error getting break duration:", error);
      return 5; // Default fallback
    }
  }

  async showBreakCompleteNotification() {
    // Show notification that break is complete and session is finished
    await chrome.notifications.create("sessionComplete", {
      type: "basic",
      iconUrl: "icons/zenith_logo.png",
      title: "Session Complete! 🚀",
      message: "Break time is over. Your productivity session is now complete!",
      buttons: [{ title: "View Report" }, { title: "Start New Session" }],
      requireInteraction: true,
    });

    // Listen for notification button clicks
    chrome.notifications.onButtonClicked.addListener(
      this.handleSessionCompleteResponse.bind(this)
    );
    chrome.notifications.onClicked.addListener(
      this.handleSessionCompleteClick.bind(this)
    );

    // Complete the session
    await this.completeSession();
  }

  async handleSessionCompleteResponse(notificationId, buttonIndex) {
    if (notificationId === "sessionComplete") {
      chrome.notifications.clear("sessionComplete");

      if (buttonIndex === 0) {
        // View Report button clicked - could open popup or create a report
        console.log("User wants to view session report");
      } else {
        // Start New Session button clicked - could trigger popup to open
        console.log("User wants to start new session");
      }

      // Remove listeners
      chrome.notifications.onButtonClicked.removeListener(
        this.handleSessionCompleteResponse
      );
      chrome.notifications.onClicked.removeListener(
        this.handleSessionCompleteClick
      );
    }
  }

  async handleSessionCompleteClick(notificationId) {
    if (notificationId === "sessionComplete") {
      chrome.notifications.clear("sessionComplete");

      // Remove listeners
      chrome.notifications.onButtonClicked.removeListener(
        this.handleSessionCompleteResponse
      );
      chrome.notifications.onClicked.removeListener(
        this.handleSessionCompleteClick
      );
    }
  }

  async completeSession() {
    // Stop any active tracking
    if (this.isTracking) {
      await this.stopTracking();
    }

    // Clear timer state
    await this.stopTimer();

    // Save session completion data
    await this.saveSessionCompletion();
  }

  async saveSessionCompletion() {
    try {
      const { completedSessions = [] } = await chrome.storage.local.get([
        "completedSessions",
      ]);

      const sessionData = {
        completedAt: Date.now(),
        sessionType: "full", // work + break cycle
        duration: this.timerState.duration || 0,
      };

      completedSessions.unshift(sessionData);

      // Keep only last 100 sessions
      if (completedSessions.length > 100) {
        completedSessions.splice(100);
      }

      await chrome.storage.local.set({ completedSessions });
    } catch (error) {
      console.error("Error saving session completion:", error);
    }
  }

  // New timer management methods
  async restoreTimerState() {
    try {
      // First check if timer is paused
      const pausedData = await chrome.storage.local.get([
        "timerPaused",
        "pausedTimeLeft",
        "sessionType",
      ]);
      if (pausedData.timerPaused && pausedData.pausedTimeLeft) {
        // Timer is paused, just update badge
        await chrome.action.setBadgeText({ text: "⏸️" });
        await chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
        return;
      }

      // Check if timer is running
      const data = await chrome.storage.local.get([
        "timerActive",
        "timerStart",
        "timerDuration",
        "sessionType",
      ]);

      if (data.timerActive && data.timerStart && data.timerDuration) {
        const elapsed = Date.now() - data.timerStart;
        const remaining = data.timerDuration - elapsed;

        if (remaining > 0) {
          // Timer is still running
          this.timerState = {
            isActive: true,
            startTime: data.timerStart,
            duration: data.timerDuration,
            sessionType: data.sessionType || "work",
          };

          // Set alarm for remaining time
          await chrome.alarms.create("zenithTimer", {
            delayInMinutes: remaining / (60 * 1000),
          });

          // Update badge
          await chrome.action.setBadgeText({ text: "⏱️" });
          await chrome.action.setBadgeBackgroundColor({ color: "#667EEA" });

          // Start timer interval
          this.startTimerInterval();
        } else {
          // Timer has expired, clean up
          await this.stopTimer();
        }
      }
    } catch (error) {
      console.error("Error restoring timer state:", error);
    }
  }

  startTimerInterval() {
    // Clear any existing interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Update badge every second with remaining time
    this.timerInterval = setInterval(() => {
      if (this.timerState.isActive) {
        const elapsed = Date.now() - this.timerState.startTime;
        const remaining = this.timerState.duration - elapsed;

        if (remaining > 0) {
          const minutes = Math.floor(remaining / (60 * 1000));
          const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
          const timeText = minutes > 0 ? `${minutes}m` : `${seconds}s`;
          chrome.action.setBadgeText({ text: timeText });
        } else {
          // Timer finished
          this.stopTimer();
        }
      }
    }, 1000);
  }

  async getTimerState() {
    // Check if timer is paused
    const pausedData = await chrome.storage.local.get([
      "timerPaused",
      "pausedTimeLeft",
      "sessionType",
    ]);
    if (pausedData.timerPaused && pausedData.pausedTimeLeft) {
      return {
        isActive: false,
        isPaused: true,
        timeLeft: Math.floor(pausedData.pausedTimeLeft / 1000), // Return in seconds
        sessionType: pausedData.sessionType || "work",
        totalDuration: 0,
      };
    }

    if (!this.timerState.isActive) {
      return {
        isActive: false,
        isPaused: false,
        timeLeft: 0,
        sessionType: "work",
      };
    }

    const elapsed = Date.now() - this.timerState.startTime;
    const remaining = Math.max(0, this.timerState.duration - elapsed);

    return {
      isActive: this.timerState.isActive,
      isPaused: false,
      timeLeft: Math.floor(remaining / 1000), // Return in seconds
      sessionType: this.timerState.sessionType,
      totalDuration: Math.floor(this.timerState.duration / 1000),
    };
  }

  // Tracking persistence methods
  async updateTrackingStorage() {
    if (!this.isTracking) return;

    try {
      // Convert sites Map to object for storage
      const sitesObject = {};
      this.trackingData.sites.forEach((siteData, domain) => {
        sitesObject[domain] = siteData;
      });

      await chrome.storage.local.set({
        trackingSites: sitesObject,
        trackingTabSwitches: this.trackingData.tabSwitches,
      });
    } catch (error) {
      console.error("Error updating tracking storage:", error);
    }
  }

  async restoreTrackingState() {
    try {
      const data = await chrome.storage.local.get([
        "trackingActive",
        "trackingStartTime",
        "trackingTabSwitches",
        "trackingSites",
      ]);

      if (data.trackingActive && data.trackingStartTime) {
        // Restore tracking state
        this.isTracking = true;
        this.trackingData = {
          startTime: data.trackingStartTime,
          sites: new Map(),
          tabSwitches: data.trackingTabSwitches || 0,
          activeTab: null,
        };

        // Restore sites Map from stored object
        if (data.trackingSites) {
          Object.entries(data.trackingSites).forEach(([domain, siteData]) => {
            this.trackingData.sites.set(domain, siteData);
          });
        }

        // Update badge to show tracking is active
        this.updateBadge();

        console.log(
          "✅ Tracking state restored - continuing from previous session"
        );
      }
    } catch (error) {
      console.error("Error restoring tracking state:", error);
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
  console.log("Zenith extension started");
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Zenith extension installed");
});
