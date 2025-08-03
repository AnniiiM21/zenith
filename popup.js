// Popup script for Zenith Chrome Extension
// Simplified version of your main App component

// Session presets (simplified)
const SESSION_PRESETS = [
  { name: 'Pomodoro', workMinutes: 25, breakMinutes: 5, emoji: '🍅' },
  { name: 'Deep Work', workMinutes: 45, breakMinutes: 15, emoji: '🎯' },
  { name: 'Quick Focus', workMinutes: 15, breakMinutes: 5, emoji: '⚡' },
  { name: 'Long Session', workMinutes: 90, breakMinutes: 20, emoji: '🚀' }
];

class ZenithPopup {
  constructor() {
    this.selectedPreset = SESSION_PRESETS[0];
    this.timeLeft = 25 * 60;
    this.isRunning = false;
    this.isPaused = false;
    this.isTracking = false;
    this.trackingData = null;
    this.currentTab = 'timer';
    this.timerInterval = null;
    this.showCustomModal = false;
    this.customWorkMinutes = 25;
    this.customBreakMinutes = 5;
    this.isCustomTimer = false;
    
    this.init();
  }

  async init() {
    await this.loadTrackingStatus();
    await this.loadTimerState();
    this.render();
    this.setupEventListeners();
    this.startTimerSync();
  }

  async loadTrackingStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTrackingStatus' });
      this.isTracking = response.isTracking;
      if (response.isTracking) {
        this.trackingData = response;
      }
    } catch (error) {
      console.error('Error loading tracking status:', error);
    }
  }

  async loadTimerState() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response.isActive) {
        this.isRunning = true;
        this.isPaused = false;
        this.timeLeft = response.timeLeft;
        // Update preset to match background timer if needed
        const matchingPreset = SESSION_PRESETS.find(p => p.workMinutes * 60 === response.totalDuration);
        if (matchingPreset) {
          this.selectedPreset = matchingPreset;
        }
      } else if (response.isPaused) {
        this.isRunning = false;
        this.isPaused = true;
        this.timeLeft = response.timeLeft;
      } else {
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = this.selectedPreset.workMinutes * 60;
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  }

  startTimerSync() {
    // Sync with background timer every second
    this.timerInterval = setInterval(async () => {
      if (this.isRunning || this.isPaused) {
        try {
          const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
          if (response.isActive) {
            this.isRunning = true;
            this.isPaused = false;
            this.timeLeft = response.timeLeft;
            this.updateTimerDisplay();
          } else if (response.isPaused) {
            this.isRunning = false;
            this.isPaused = true;
            this.timeLeft = response.timeLeft;
            this.updateTimerDisplay();
          } else {
            // Timer finished or stopped
            this.isRunning = false;
            this.isPaused = false;
            this.timeLeft = this.selectedPreset.workMinutes * 60;
            this.render();
          }
        } catch (error) {
          console.error('Error syncing timer:', error);
        }
      }
      
      // Also sync tracking status
      if (this.isTracking) {
        try {
          const trackingResponse = await chrome.runtime.sendMessage({ action: 'getTrackingStatus' });
          if (!trackingResponse.isTracking) {
            // Tracking was stopped
            this.isTracking = false;
            this.render();
          } else {
            // Update tracking data
            this.trackingData = trackingResponse;
            this.updateTrackingDisplay();
          }
        } catch (error) {
          console.error('Error syncing tracking:', error);
        }
      }
    }, 1000);
  }

  updateTrackingDisplay() {
    // Update tracking display elements if they exist
    const trackingStatus = document.querySelector('.tracking-status');
    if (trackingStatus && this.trackingData) {
      trackingStatus.textContent = this.formatTrackingTime();
    }
  }

  formatTrackingTime() {
    if (!this.trackingData || !this.trackingData.startTime) {
      return '0:00';
    }
    
    const elapsed = Date.now() - this.trackingData.startTime;
    const minutes = Math.floor(elapsed / (60 * 1000));
    const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  updateTimerDisplay() {
    const timerDisplay = document.querySelector('.timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = this.formatTime(this.timeLeft);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async startTimer() {
    try {
      if (this.isPaused) {
        // Resume paused timer
        await chrome.runtime.sendMessage({ action: 'resumeTimer' });
        this.isRunning = true;
        this.isPaused = false;
      } else {
        // Start new timer
        const duration = this.isCustomTimer ? this.customWorkMinutes : this.selectedPreset.workMinutes;
        
        await chrome.runtime.sendMessage({
          action: 'startTimer',
          duration: duration,
          sessionType: 'work'
        });
        
        // Update local state
        this.isRunning = true;
        this.isPaused = false;
        this.timeLeft = duration * 60;
      }
      this.render();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  }

  async pauseTimer() {
    try {
      await chrome.runtime.sendMessage({ action: 'pauseTimer' });
      
      // Update local state
      this.isRunning = false;
      this.isPaused = true;
      this.render();
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  }

  async stopTimer() {
    try {
      await chrome.runtime.sendMessage({ action: 'stopTimer' });
      
      // Update local state
      this.isRunning = false;
      this.isPaused = false;
      const duration = this.isCustomTimer ? this.customWorkMinutes : this.selectedPreset.workMinutes;
      this.timeLeft = duration * 60;
      this.render();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  }

  async startTracking() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'startTracking' });
      if (response.success) {
        this.isTracking = true;
        await this.loadTrackingStatus();
        this.render();
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  }

  async stopTracking() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'stopTracking' });
      if (response.success) {
        this.isTracking = false;
        this.trackingData = response.report;
        this.render();
      }
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  }

  openCustomTimerModal() {
    this.showCustomModal = true;
    this.render();
  }

  closeCustomTimerModal() {
    this.showCustomModal = false;
    this.render();
  }

  confirmCustomTimer() {
    this.isCustomTimer = true;
    this.timeLeft = this.customWorkMinutes * 60;
    this.showCustomModal = false;
    this.render();
  }

  setupEventListeners() {
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    });

    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.currentTab = e.target.dataset.tab;
        this.render();
      });
    });

    // Timer controls
    const startButton = document.getElementById('startTimer');
    const setButton = document.getElementById('setTimer');
    const resetButton = document.getElementById('resetTimer');

    if (startButton) {
      startButton.addEventListener('click', () => {
        if (this.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      });
    }

    if (setButton) {
      setButton.addEventListener('click', () => {
        this.openCustomTimerModal();
      });
    }

    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        await this.stopTimer();
        const duration = this.isCustomTimer ? this.customWorkMinutes : this.selectedPreset.workMinutes;
        this.timeLeft = duration * 60;
        this.render();
      });
    }
    const trackingButton = document.getElementById('trackingButton');
    if (trackingButton) {
      trackingButton.addEventListener('click', () => {
        if (this.isTracking) {
          this.stopTracking();
        } else {
          this.startTracking();
        }
      });
    }

    // Custom timer modal controls
    const customModalCancel = document.getElementById('customModalCancel');
    const customModalConfirm = document.getElementById('customModalConfirm');
    const customWorkInput = document.getElementById('customWorkInput');
    const customBreakInput = document.getElementById('customBreakInput');

    if (customModalCancel) {
      customModalCancel.addEventListener('click', () => {
        this.closeCustomTimerModal();
      });
    }

    if (customModalConfirm) {
      customModalConfirm.addEventListener('click', () => {
        this.confirmCustomTimer();
      });
    }

    if (customWorkInput) {
      customWorkInput.addEventListener('input', (e) => {
        this.customWorkMinutes = parseInt(e.target.value) || 25;
      });
    }

    if (customBreakInput) {
      customBreakInput.addEventListener('input', (e) => {
        this.customBreakMinutes = parseInt(e.target.value) || 5;
      });
    }

    // Preset selection
    document.querySelectorAll('.preset-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const presetName = e.target.dataset.preset;
        this.selectedPreset = SESSION_PRESETS.find(p => p.name === presetName);
        this.isCustomTimer = false; // Reset custom timer mode when selecting preset
        this.timeLeft = this.selectedPreset.workMinutes * 60;
        this.render();
      });
    });
  }

  render() {
    const app = document.getElementById('root');
    app.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%);
        color: #ffffff;
        min-height: 600px;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      ">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
            <img src="icons/zenith_logo.png" alt="Zenith Logo" class="zenith-logo" style="
              width: 32px;
              height: 32px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">
            <h1 style="
              font-size: 28px;
              font-weight: bold;
              margin: 0;
              text-shadow: 0 0 20px rgba(255,255,255,0.3);
            ">Zenith</h1>
          </div>
          <p style="font-size: 14px; margin: 0; opacity: 0.9;">
            Peak Productivity Timer
          </p>
        </div>

        <!-- Navigation -->
        <div style="
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 4px;
        ">
          <button class="tab-button" data-tab="timer" style="
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 8px;
            background: ${this.currentTab === 'timer' ? 'linear-gradient(45deg, #667EEA, #764BA2)' : 'transparent'};
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          ">Timer</button>
          <button class="tab-button" data-tab="analytics" style="
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 8px;
            background: ${this.currentTab === 'analytics' ? 'linear-gradient(45deg, #667EEA, #764BA2)' : 'transparent'};
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          ">Analytics</button>
        </div>

        ${this.currentTab === 'timer' ? this.renderTimerTab() : this.renderAnalyticsTab()}

        ${this.showCustomModal ? this.renderCustomTimerModal() : ''}
        
        <!-- Footer -->
        <div style="
          text-align: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
        ">
          <p style="
            font-size: 10px;
            margin: 0;
            opacity: 0.6;
            color: #ffffff;
            font-weight: 400;
            letter-spacing: 0.5px;
          ">Made by the unfocused engineer Aniruddha</p>
        </div>
      </div>
    `;

    // Re-setup event listeners after render
    setTimeout(() => this.setupEventListeners(), 0);
  }

  renderTimerTab() {
    return `
      <!-- Timer Display -->
      <div style="
        text-align: center;
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <div class="timer-display" style="
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 10px;
          font-family: monospace;
        ">${this.formatTime(this.timeLeft)}</div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 5px 0; font-size: 18px;">
            ${this.isCustomTimer 
              ? '⚡ Custom Timer' 
              : `${this.selectedPreset.emoji} ${this.selectedPreset.name}`}
          </h3>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">Focus Session</p>
        </div>

        <!-- Timer Controls -->
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          <button id="startTimer" style="
            padding: 12px 20px;
            border: none;
            border-radius: 12px;
            background: ${this.isRunning 
              ? 'linear-gradient(45deg, #ef4444, #dc2626)'
              : this.isPaused
                ? 'linear-gradient(45deg, #10b981, #059669)'
                : 'linear-gradient(45deg, #10b981, #059669)'};
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">${this.isRunning ? 'Pause' : this.isPaused ? 'Resume' : 'Start'}</button>
          
          <button id="setTimer" style="
            padding: 12px 20px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(45deg, #667EEA, #764BA2);
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">Set</button>
          
          <button id="resetTimer" style="
            padding: 12px 20px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(45deg, #3b82f6, #2563eb);
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">Reset</button>
        </div>
      </div>

      <!-- Session Presets -->
      <div style="
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 16px;
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 16px;">⏰ Session Presets</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${SESSION_PRESETS.map(preset => `
            <button class="preset-button" data-preset="${preset.name}" style="
              padding: 12px;
              border: none;
              border-radius: 10px;
              background: ${this.selectedPreset.name === preset.name
                ? 'linear-gradient(45deg, #667EEA, #764BA2)'
                : 'rgba(255,255,255,0.1)'};
              color: #ffffff;
              font-size: 12px;
              cursor: pointer;
              text-align: left;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="font-size: 16px;">${preset.emoji}</span>
              <div>
                <div style="font-weight: 600;">${preset.name}</div>
                <div style="opacity: 0.8; font-size: 11px;">
                  ${preset.workMinutes}min work / ${preset.breakMinutes}min break
                </div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderAnalyticsTab() {
    return `
      <!-- Tracking Controls -->
      <div style="
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 16px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        ">
          <h3 style="margin: 0; font-size: 16px;">🌐 Browser Tracking</h3>
          <button id="trackingButton" style="
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            background: ${this.isTracking 
              ? 'linear-gradient(45deg, #ef4444, #dc2626)'
              : 'linear-gradient(45deg, #10b981, #059669)'};
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          ">${this.isTracking ? '⏹️ Stop' : '▶️ Start'}</button>
        </div>

        ${this.isTracking && this.trackingData ? `
          <div style="font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Session Time:</span>
              <span class="tracking-status" style="font-weight: 600;">${this.formatTrackingTime()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Sites Visited:</span>
              <span style="font-weight: 600;">${this.trackingData.sitesVisited || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Tab Switches:</span>
              <span style="font-weight: 600;">${this.trackingData.tabSwitches || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Current Site:</span>
              <span style="font-weight: 600; font-size: 11px;">
                ${this.trackingData.currentSite || 'Unknown'}
              </span>
            </div>
            <div style="
              background: linear-gradient(45deg, #10b981, #059669);
              padding: 8px;
              border-radius: 8px;
              margin-top: 8px;
              text-align: center;
              font-size: 11px;
              font-weight: 600;
            ">
              🔄 Tracking continues even when popup is closed
            </div>
          </div>
        ` : ''}

        ${!this.isTracking && this.trackingData && this.trackingData.topSites ? `
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">📈 Last Session</h4>
            <div style="font-size: 12px; margin-bottom: 8px;">
              <div>Total Time: ${this.trackingData.totalTimeFormatted}</div>
              <div>Sites Visited: ${this.trackingData.sitesVisited}</div>
              <div>Tab Switches: ${this.trackingData.tabSwitches}</div>
            </div>
            
            <div style="font-size: 11px;">
              <div style="font-weight: 600; margin-bottom: 4px;">Top Sites:</div>
              ${this.trackingData.topSites.slice(0, 3).map(site => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span style="
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 200px;
                  ">${site.domain}</span>
                  <span style="color: #10b981;">${Math.round(site.percentage)}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${!this.isTracking && !this.trackingData ? `
          <div style="
            text-align: center;
            font-size: 12px;
            opacity: 0.8;
            padding: 20px;
          ">
            <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
            <div>Start tracking to monitor your browsing activity</div>
          </div>
        ` : ''}
      </div>

      <!-- Quick Stats -->
      <div style="
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 16px;
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 16px;">📈 Quick Stats</h3>
        <div style="font-size: 12px; opacity: 0.8;">
          Real-time browser activity tracking with detailed analytics,
          productivity scoring, and session reports.
        </div>
      </div>
    `;
  }

  renderCustomTimerModal() {
    return `
      <!-- Custom Timer Modal -->
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      ">
        <div style="
          background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 320px;
          box-shadow: 0 0 40px rgba(102,126,234,0.3);
        ">
          <h3 style="
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          ">
            <span style="font-size: 24px;">⚡</span>
            Custom Timer
          </h3>
          
          <div style="margin-bottom: 16px;">
            <label style="
              display: block;
              margin-bottom: 6px;
              font-size: 14px;
              font-weight: 600;
            ">Focus Time (minutes)</label>
            <input 
              type="number" 
              id="customWorkInput"
              min="1" 
              max="180" 
              value="${this.customWorkMinutes}"
              style="
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: rgba(255,255,255,0.15);
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
                box-sizing: border-box;
              "
              placeholder="Enter focus time..."
            >
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="
              display: block;
              margin-bottom: 6px;
              font-size: 14px;
              font-weight: 600;
            ">Break Time (minutes)</label>
            <input 
              type="number" 
              id="customBreakInput"
              min="1" 
              max="60" 
              value="${this.customBreakMinutes}"
              style="
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: rgba(255,255,255,0.15);
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
                box-sizing: border-box;
              "
              placeholder="Enter break time..."
            >
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button id="customModalCancel" style="
              flex: 1;
              padding: 12px;
              border: none;
              border-radius: 8px;
              background: linear-gradient(45deg, #ef4444, #dc2626);
              color: #ffffff;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
            ">Cancel</button>
            
            <button id="customModalConfirm" style="
              flex: 1;
              padding: 12px;
              border: none;
              border-radius: 8px;
              background: linear-gradient(45deg, #667EEA, #764BA2);
              color: #ffffff;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
            ">Confirm</button>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ZenithPopup();
});
