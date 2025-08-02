const { BrowserWindow, powerMonitor, app } = require('electron');
const { exec } = require('child_process');
const axios = require('axios');
const urlParse = require('url-parse');

class BrowserActivityTracker {
  constructor() {
    this.isTracking = false;
    this.activeTab = null;
    this.tabSessions = new Map();
    this.currentSession = null;
    this.trackingInterval = null;
    this.youtubeCheckInterval = null;
    this.lastActiveTime = Date.now();
    
    // Initialize tracking data structure
    this.dailyStats = {
      date: new Date().toDateString(),
      totalTime: 0,
      sites: new Map(),
      youtubeVideos: new Map(),
      productivity: {
        productive: 0,
        neutral: 0,
        distracting: 0
      }
    };

    this.setupPowerMonitoring();
  }

  setupPowerMonitoring() {
    // Monitor system activity to pause tracking when inactive
    powerMonitor.on('suspend', () => {
      this.pauseTracking();
    });

    powerMonitor.on('resume', () => {
      this.resumeTracking();
    });

    powerMonitor.on('lock-screen', () => {
      this.pauseTracking();
    });

    powerMonitor.on('unlock-screen', () => {
      this.resumeTracking();
    });
  }

  startTracking() {
    if (this.isTracking) {
      console.log('⚠️ Browser tracking is already running');
      return;
    }
    
    this.isTracking = true;
    console.log('🎯 Browser activity tracking started');
    console.log('📊 Checking active windows every 2 seconds...');
    
    // Do an immediate check
    this.checkActiveWindow();
    
    // Check active window every 2 seconds
    this.trackingInterval = setInterval(() => {
      this.checkActiveWindow();
    }, 2000);

    // Check YouTube video status every 5 seconds
    this.youtubeCheckInterval = setInterval(() => {
      this.checkYouTubeActivity();
    }, 5000);

    console.log('✅ Browser tracking intervals set up successfully');
  }

  // Test method to verify PowerShell is working
  testPowerShell() {
    console.log('🧪 Testing PowerShell commands...');
    
    // Test 1: Simple browser process detection
    const test1 = `powershell -Command "Get-Process | Where-Object {$_.ProcessName -match 'chrome|firefox|msedge'} | Select-Object ProcessName, MainWindowTitle -First 5"`;
    
    console.log('🔍 Test 1: Simple browser detection...');
    exec(test1, { timeout: 3000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Test 1 failed:', error.message);
      } else {
        console.log('✅ Test 1 successful');
        console.log('📄 Output:', stdout.substring(0, 300));
      }
    });
    
    // Test 2: Tasklist fallback
    const test2 = `tasklist /FI "IMAGENAME eq chrome.exe" /FO CSV /NH`;
    
    console.log('🔍 Test 2: Tasklist fallback...');
    exec(test2, { timeout: 2000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Test 2 failed:', error.message);
      } else {
        console.log('✅ Test 2 successful');
        console.log('📄 Output:', stdout.substring(0, 200));
      }
    });
    
    // Test 3: Check if we can detect any running processes
    const test3 = `powershell -Command "Get-Process | Select-Object ProcessName -First 3"`;
    
    console.log('🔍 Test 3: Basic PowerShell test...');
    exec(test3, { timeout: 2000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Test 3 failed - PowerShell may not be working:', error.message);
      } else {
        console.log('✅ Test 3 successful - PowerShell is working');
        console.log('📄 Output:', stdout.substring(0, 200));
      }
    });
  }

  stopTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    console.log('⏹️ Browser activity tracking stopped');
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.youtubeCheckInterval) {
      clearInterval(this.youtubeCheckInterval);
      this.youtubeCheckInterval = null;
    }

    this.endCurrentSession();
  }

  pauseTracking() {
    if (this.currentSession) {
      this.endCurrentSession();
    }
  }

  resumeTracking() {
    this.lastActiveTime = Date.now();
  }

  async checkActiveWindow() {
    try {
      // Try multiple approaches to get active window information
      
      // Approach 1: Simple PowerShell command for processes
      const simpleCommand = `powershell -Command "Get-Process | Where-Object {$_.ProcessName -match 'chrome|firefox|msedge|opera|brave'} | Select-Object ProcessName, MainWindowTitle -First 10 | ConvertTo-Json"`;
      
      exec(simpleCommand, { timeout: 3000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error getting active window:', error.message);
          // Fallback: Try to detect any running browsers
          this.fallbackBrowserDetection();
          return;
        }

        if (!stdout || stdout.trim() === '') {
          console.log('📝 No browser processes found');
          this.endCurrentSession();
          return;
        }

        try {
          // Clean the stdout to handle potential encoding issues
          const cleanOutput = stdout.trim().replace(/^\uFEFF/, ''); // Remove BOM if present
          
          let processes;
          try {
            processes = JSON.parse(cleanOutput);
          } catch (jsonError) {
            console.error('❌ JSON Parse Error:', jsonError.message);
            // Try fallback method
            this.fallbackBrowserDetection();
            return;
          }

          // Ensure processes is an array
          if (!Array.isArray(processes)) {
            processes = processes ? [processes] : [];
          }

          console.log(`🔍 Found ${processes.length} browser processes`);
          
          if (processes.length > 0) {
            // Filter for processes with actual window titles
            const activeProcesses = processes.filter(p => p && p.MainWindowTitle && p.MainWindowTitle.trim() !== '');
            
            if (activeProcesses.length > 0) {
              const activeProcess = activeProcesses[0];
              console.log(`🎯 Tracking browser: ${activeProcess.ProcessName} - ${activeProcess.MainWindowTitle}`);
              this.handleBrowserActivity(activeProcess);
            } else {
              console.log('📝 No browser processes with active windows');
              this.endCurrentSession();
            }
          } else {
            console.log('🔚 No browser processes found, ending session');
            this.endCurrentSession();
          }
        } catch (parseError) {
          console.error('❌ Error parsing window data:', parseError.message);
          this.fallbackBrowserDetection();
        }
      });
    } catch (error) {
      console.error('❌ Error in checkActiveWindow:', error.message);
      this.fallbackBrowserDetection();
    }
  }

  // Fallback method when PowerShell fails
  fallbackBrowserDetection() {
    console.log('🔄 Using fallback browser detection...');
    
    // Simple approach: just check if common browsers are running
    const fallbackCommand = `tasklist /FI "IMAGENAME eq chrome.exe" /FO CSV /NH 2>nul || tasklist /FI "IMAGENAME eq firefox.exe" /FO CSV /NH 2>nul || tasklist /FI "IMAGENAME eq msedge.exe" /FO CSV /NH 2>nul`;
    
    exec(fallbackCommand, { timeout: 2000 }, (error, stdout, stderr) => {
      if (!error && stdout && stdout.trim() !== '') {
        // Browser is running, create a generic session
        const now = Date.now();
        const sessionKey = 'browser-generic';
        
        if (!this.currentSession || this.currentSession.key !== sessionKey) {
          this.startNewSession(sessionKey, {
            processName: 'Browser',
            title: 'Active Browser Session',
            url: 'https://browser.activity',
            domain: 'browser.activity',
            startTime: now
          });
        }
        
        this.lastActiveTime = now;
        console.log('🌐 Generic browser session active');
      } else {
        console.log('🔚 No browser detected in fallback method');
        this.endCurrentSession();
      }
    });
  }

  filterBrowserProcesses(processes) {
    const browserNames = [
      'chrome', 'firefox', 'msedge', 'opera', 'brave', 
      'vivaldi', 'safari', 'iexplore', 'waterfox'
    ];

    if (!Array.isArray(processes)) {
      processes = [processes];
    }

    return processes.filter(process => {
      if (!process || !process.ProcessName) return false;
      
      const processName = process.ProcessName.toLowerCase();
      return browserNames.some(browser => processName.includes(browser));
    });
  }

  handleBrowserActivity(process) {
    const title = process.MainWindowTitle || '';
    const url = this.extractUrlFromTitle(title);
    const domain = this.extractDomain(url);
    
    const now = Date.now();
    const sessionKey = `${process.ProcessName}-${domain}`;

    // End previous session if switching tabs/sites
    if (this.currentSession && this.currentSession.key !== sessionKey) {
      this.endCurrentSession();
    }

    // Start new session or continue existing one
    if (!this.currentSession || this.currentSession.key !== sessionKey) {
      this.startNewSession(sessionKey, {
        processName: process.ProcessName,
        title: title,
        url: url,
        domain: domain,
        startTime: now
      });
    }

    this.lastActiveTime = now;
  }

  extractUrlFromTitle(title) {
    // Try to extract URL from browser title
    // Common patterns: "Page Title - Google Chrome", "YouTube", etc.
    
    // Simple heuristics to identify common sites
    if (title.toLowerCase().includes('youtube')) {
      return 'https://www.youtube.com';
    }
    if (title.toLowerCase().includes('google')) {
      return 'https://www.google.com';
    }
    if (title.toLowerCase().includes('github')) {
      return 'https://github.com';
    }
    if (title.toLowerCase().includes('stackoverflow')) {
      return 'https://stackoverflow.com';
    }
    if (title.toLowerCase().includes('reddit')) {
      return 'https://www.reddit.com';
    }
    if (title.toLowerCase().includes('twitter') || title.toLowerCase().includes('x.com')) {
      return 'https://twitter.com';
    }
    if (title.toLowerCase().includes('facebook')) {
      return 'https://www.facebook.com';
    }
    if (title.toLowerCase().includes('linkedin')) {
      return 'https://www.linkedin.com';
    }
    if (title.toLowerCase().includes('netflix')) {
      return 'https://www.netflix.com';
    }
    if (title.toLowerCase().includes('amazon')) {
      return 'https://www.amazon.com';
    }

    // If no pattern matches, return the title as identifier
    return title;
  }

  extractDomain(url) {
    if (!url || !url.startsWith('http')) {
      return url; // Return as-is if not a proper URL
    }

    try {
      const parsed = urlParse(url);
      return parsed.hostname;
    } catch (error) {
      return url;
    }
  }

  startNewSession(key, data) {
    this.currentSession = {
      key: key,
      ...data,
      timeSpent: 0,
      isYouTubeVideo: false,
      youTubeVideoTitle: null
    };

    console.log(`🌐 Started tracking: ${data.domain || data.title}`);
  }

  endCurrentSession() {
    if (!this.currentSession) return;

    const now = Date.now();
    const sessionTime = now - this.currentSession.startTime;
    this.currentSession.timeSpent = sessionTime;

    // Update daily stats
    this.updateDailyStats(this.currentSession);

    console.log(`⏱️ Session ended: ${this.currentSession.domain || this.currentSession.title} - ${Math.round(sessionTime / 1000)}s`);

    this.currentSession = null;
  }

  updateDailyStats(session) {
    const domain = session.domain || session.title;
    const timeSpent = session.timeSpent;

    // Update total time
    this.dailyStats.totalTime += timeSpent;

    // Update site-specific time
    if (!this.dailyStats.sites.has(domain)) {
      this.dailyStats.sites.set(domain, {
        timeSpent: 0,
        visits: 0,
        category: this.categorizeSite(domain),
        lastVisit: new Date()
      });
    }

    const siteData = this.dailyStats.sites.get(domain);
    siteData.timeSpent += timeSpent;
    siteData.visits += 1;
    siteData.lastVisit = new Date();

    // Update YouTube video data
    if (session.isYouTubeVideo && session.youTubeVideoTitle) {
      if (!this.dailyStats.youtubeVideos.has(session.youTubeVideoTitle)) {
        this.dailyStats.youtubeVideos.set(session.youTubeVideoTitle, {
          timeSpent: 0,
          watches: 0
        });
      }
      
      const videoData = this.dailyStats.youtubeVideos.get(session.youTubeVideoTitle);
      videoData.timeSpent += timeSpent;
      videoData.watches += 1;
    }

    // Update productivity metrics
    const category = siteData.category;
    this.dailyStats.productivity[category] += timeSpent;
  }

  categorizeSite(domain) {
    const productiveSites = [
      'github.com', 'stackoverflow.com', 'developer.mozilla.org',
      'docs.google.com', 'notion.so', 'trello.com', 'slack.com',
      'teams.microsoft.com', 'zoom.us', 'vscode.dev'
    ];

    const distractingSites = [
      'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
      'reddit.com', 'netflix.com', 'twitch.tv', 'tiktok.com'
    ];

    const domainLower = domain.toLowerCase();

    if (productiveSites.some(site => domainLower.includes(site))) {
      return 'productive';
    }
    
    if (distractingSites.some(site => domainLower.includes(site))) {
      return 'distracting';
    }

    return 'neutral';
  }

  async checkYouTubeActivity() {
    if (!this.currentSession) return;

    const domain = this.currentSession.domain;
    if (!domain || !domain.includes('youtube.com')) return;

    try {
      // Try to get YouTube video title from the window title
      const title = this.currentSession.title;
      
      // Extract video title from YouTube page title format
      if (title.includes('YouTube')) {
        const videoTitle = title.replace(/\s*-\s*YouTube\s*$/, '').trim();
        if (videoTitle && videoTitle !== 'YouTube') {
          this.currentSession.isYouTubeVideo = true;
          this.currentSession.youTubeVideoTitle = videoTitle;
          
          console.log(`🎥 YouTube video detected: ${videoTitle}`);
        }
      }
    } catch (error) {
      console.error('Error checking YouTube activity:', error);
    }
  }

  getStats() {
    return {
      ...this.dailyStats,
      sites: Object.fromEntries(this.dailyStats.sites),
      youtubeVideos: Object.fromEntries(this.dailyStats.youtubeVideos),
      currentSession: this.currentSession
    };
  }

  exportStats() {
    const stats = this.getStats();
    
    // Convert time values to readable format
    stats.totalTimeFormatted = this.formatTime(stats.totalTime);
    
    // Format site data
    const sitesArray = Array.from(this.dailyStats.sites.entries()).map(([domain, data]) => ({
      domain,
      timeSpent: data.timeSpent,
      timeSpentFormatted: this.formatTime(data.timeSpent),
      visits: data.visits,
      category: data.category,
      lastVisit: data.lastVisit
    })).sort((a, b) => b.timeSpent - a.timeSpent);

    // Format YouTube videos
    const videosArray = Array.from(this.dailyStats.youtubeVideos.entries()).map(([title, data]) => ({
      title,
      timeSpent: data.timeSpent,
      timeSpentFormatted: this.formatTime(data.timeSpent),
      watches: data.watches
    })).sort((a, b) => b.timeSpent - a.timeSpent);

    return {
      ...stats,
      sitesArray,
      videosArray,
      productivityFormatted: {
        productive: this.formatTime(stats.productivity.productive),
        neutral: this.formatTime(stats.productivity.neutral),
        distracting: this.formatTime(stats.productivity.distracting)
      }
    };
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  clearStats() {
    this.dailyStats = {
      date: new Date().toDateString(),
      totalTime: 0,
      sites: new Map(),
      youtubeVideos: new Map(),
      productivity: {
        productive: 0,
        neutral: 0,
        distracting: 0
      }
    };
    
    console.log('📊 Browser activity stats cleared');
  }
}

module.exports = BrowserActivityTracker;
