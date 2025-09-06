// Popup script for Zenith Chrome Extension
// Simplified version of your main App component

// Session presets (simplified)
const SESSION_PRESETS = [
  { name: "Pomodoro", workMinutes: 25, breakMinutes: 5, emoji: "🍅" },
  { name: "Deep Work", workMinutes: 45, breakMinutes: 15, emoji: "🎯" },
  { name: "Quick Focus", workMinutes: 15, breakMinutes: 5, emoji: "⚡" },
  { name: "Long Session", workMinutes: 90, breakMinutes: 20, emoji: "🚀" },
];

class ZenithPopup {
  constructor() {
    this.selectedPreset = SESSION_PRESETS[0];
    this.timeLeft = 25 * 60;
    this.isRunning = false;
    this.isPaused = false;
    this.isTracking = false;
    this.trackingData = null;
    this.currentTab = "timer";
    this.timerInterval = null;
    this.showCustomModal = false;
    this.customWorkMinutes = 25;
    this.customBreakMinutes = 5;
    this.isCustomTimer = false;
    this.trackingReports = [];
    this.selectedReport = null;

    this.init();
  }

  async init() {
    await this.loadTrackingStatus();
    await this.loadTimerState();
    await this.loadTrackingReports();
    this.render();
    this.setupEventListeners();
    this.startTimerSync();
  }

  async loadTrackingStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getTrackingStatus",
      });
      this.isTracking = response.isTracking;
      if (response.isTracking) {
        this.trackingData = response;
      }
    } catch (error) {
      console.error("Error loading tracking status:", error);
    }
  }

  async loadTimerState() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getTimerState",
      });
      if (response.isActive) {
        this.isRunning = true;
        this.isPaused = false;
        this.timeLeft = response.timeLeft;
        // Update preset to match background timer if needed
        const matchingPreset = SESSION_PRESETS.find(
          (p) => p.workMinutes * 60 === response.totalDuration
        );
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
      console.error("Error loading timer state:", error);
    }
  }

  async loadTrackingReports() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getTrackingReports",
      });
      this.trackingReports = response.reports || [];
      if (this.trackingReports.length > 0 && !this.selectedReport) {
        this.selectedReport = this.trackingReports[0];
      }
    } catch (error) {
      console.error("Error loading tracking reports:", error);
    }
  }

  startTimerSync() {
    // Sync with background timer every second
    this.timerInterval = setInterval(async () => {
      if (this.isRunning || this.isPaused) {
        try {
          const response = await chrome.runtime.sendMessage({
            action: "getTimerState",
          });
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
          console.error("Error syncing timer:", error);
        }
      }

      // Also sync tracking status
      if (this.isTracking) {
        try {
          const trackingResponse = await chrome.runtime.sendMessage({
            action: "getTrackingStatus",
          });
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
          console.error("Error syncing tracking:", error);
        }
      }
    }, 1000);
  }

  updateTrackingDisplay() {
    // Update tracking display elements if they exist
    const trackingStatus = document.querySelector(".tracking-status");
    if (trackingStatus && this.trackingData) {
      trackingStatus.textContent = this.formatTrackingTime();
    }
  }

  formatTrackingTime() {
    if (!this.trackingData || !this.trackingData.startTime) {
      return "0:00";
    }

    const elapsed = Date.now() - this.trackingData.startTime;
    const minutes = Math.floor(elapsed / (60 * 1000));
    const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  updateTimerDisplay() {
    const timerDisplay = document.querySelector(".timer-display");
    if (timerDisplay) {
      timerDisplay.textContent = this.formatTime(this.timeLeft);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  async startTimer() {
    try {
      if (this.isPaused) {
        // Resume paused timer
        await chrome.runtime.sendMessage({ action: "resumeTimer" });
        this.isRunning = true;
        this.isPaused = false;
      } else {
        // Start new timer
        const duration = this.isCustomTimer
          ? this.customWorkMinutes
          : this.selectedPreset.workMinutes;

        await chrome.runtime.sendMessage({
          action: "startTimer",
          duration: duration,
          sessionType: "work",
        });

        // Update local state
        this.isRunning = true;
        this.isPaused = false;
        this.timeLeft = duration * 60;
      }
      this.render();
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  }

  async pauseTimer() {
    try {
      await chrome.runtime.sendMessage({ action: "pauseTimer" });

      // Update local state
      this.isRunning = false;
      this.isPaused = true;
      this.render();
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  }

  async stopTimer() {
    try {
      await chrome.runtime.sendMessage({ action: "stopTimer" });

      // Update local state
      this.isRunning = false;
      this.isPaused = false;
      const duration = this.isCustomTimer
        ? this.customWorkMinutes
        : this.selectedPreset.workMinutes;
      this.timeLeft = duration * 60;
      this.render();
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  }

  async startTracking() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "startTracking",
      });

      if (response && response.success) {
        this.isTracking = true;
        await this.loadTrackingStatus();
        this.render();
      }
    } catch (error) {
      // Silent error handling
    }
  }

  async stopTracking() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "stopTracking",
      });
      if (response.success) {
        this.isTracking = false;
        this.trackingData = response.report;
        // Reload reports to include the new one
        await this.loadTrackingReports();
        this.render();
      }
    } catch (error) {
      console.error("Error stopping tracking:", error);
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
    window.addEventListener("beforeunload", () => {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    });

    // Make popup instance globally accessible for report selection
    window.zenithPopup = this;
  }

  setupEventListenersAfterRender() {
    // Tab navigation
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        this.currentTab = e.target.dataset.tab;
        this.render();
      });
    });

    // Timer controls
    const startButton = document.getElementById("startTimer");
    const setButton = document.getElementById("setTimer");
    const resetButton = document.getElementById("resetTimer");

    if (startButton) {
      startButton.addEventListener("click", () => {
        if (this.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      });
    }

    if (setButton) {
      setButton.addEventListener("click", () => {
        this.openCustomTimerModal();
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", async () => {
        await this.stopTimer();
        const duration = this.isCustomTimer
          ? this.customWorkMinutes
          : this.selectedPreset.workMinutes;
        this.timeLeft = duration * 60;
        this.render();
      });
    }

    // Tracking button
    const trackingButton = document.getElementById("trackingButton");
    if (trackingButton) {
      trackingButton.addEventListener("click", () => {
        if (this.isTracking) {
          this.stopTracking();
        } else {
          this.startTracking();
        }
      });
    }

    // Preset selection
    document.querySelectorAll(".preset-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const presetName = e.currentTarget.dataset.preset;
        const preset = SESSION_PRESETS.find((p) => p.name === presetName);
        if (preset) {
          this.selectedPreset = preset;
          this.isCustomTimer = false;
          this.timeLeft = preset.workMinutes * 60;
          this.render();
        }
      });
    });

    // Custom timer modal
    const customModalClose = document.getElementById("customModalClose");
    const customModalConfirm = document.getElementById("customModalConfirm");
    const workMinutesInput = document.getElementById("workMinutes");
    const breakMinutesInput = document.getElementById("breakMinutes");

    if (customModalClose) {
      customModalClose.addEventListener("click", () => {
        this.closeCustomTimerModal();
      });
    }

    if (customModalConfirm) {
      customModalConfirm.addEventListener("click", () => {
        this.confirmCustomTimer();
      });
    }

    if (workMinutesInput) {
      workMinutesInput.addEventListener("input", (e) => {
        this.customWorkMinutes = parseInt(e.target.value) || 25;
      });
    }

    if (breakMinutesInput) {
      breakMinutesInput.addEventListener("input", (e) => {
        this.customBreakMinutes = parseInt(e.target.value) || 5;
      });
    }
  }

  render() {
    const root = document.getElementById("root");
    if (!root) return;

    root.innerHTML = `
      <div style="
        padding: 20px;
        background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%);
        min-height: 100vh;
        color: #ffffff;
      ">
        <!-- Header -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="icons/zenith_logo.png" alt="Zenith" class="zenith-logo">
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; background: linear-gradient(45deg, #667EEA, #764BA2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Zenith
              </h1>
              <p style="margin: 0; font-size: 12px; opacity: 0.7;">Peak Productivity Timer</p>
            </div>
          </div>
          
          <div style="display: flex; gap: 8px;">
            <button class="tab-button ${
              this.currentTab === "timer" ? "active" : ""
            }" data-tab="timer" style="
              padding: 8px 16px;
              border: none;
              border-radius: 20px;
              background: ${
                this.currentTab === "timer"
                  ? "linear-gradient(45deg, #667EEA, #764BA2)"
                  : "rgba(255,255,255,0.1)"
              };
              color: #ffffff;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
            ">Timer</button>
            
            <button class="tab-button ${
              this.currentTab === "analytics" ? "active" : ""
            }" data-tab="analytics" style="
              padding: 8px 16px;
              border: none;
              border-radius: 20px;
              background: ${
                this.currentTab === "analytics"
                  ? "linear-gradient(45deg, #667EEA, #764BA2)"
                  : "rgba(255,255,255,0.1)"
              };
              color: #ffffff;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
            ">Analytics</button>
          </div>
        </div>

        ${
          this.currentTab === "timer"
            ? this.renderTimerTab()
            : this.renderAnalyticsTab()
        }
        
        ${this.showCustomModal ? this.renderCustomModal() : ""}
      </div>
    `;

    // Set up event listeners after DOM is rendered
    this.setupEventListenersAfterRender();
  }

  renderTimerTab() {
    return `
      <div>
        <!-- Timer Display -->
        <div style="
          text-align: center;
          background: rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 40px 20px;
          margin-bottom: 30px;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          <div class="timer-display" style="
            font-size: 64px;
            font-weight: 700;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            background: linear-gradient(45deg, #10b981, #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
            letter-spacing: -2px;
          ">${this.formatTime(this.timeLeft)}</div>
          
          <div style="
            font-size: 18px;
            opacity: 0.8;
            margin-bottom: 8px;
          ">${this.selectedPreset.emoji} ${this.selectedPreset.name}</div>
          
          <div style="
            font-size: 14px;
            opacity: 0.6;
          ">${this.selectedPreset.workMinutes} min work • ${
      this.selectedPreset.breakMinutes
    } min break</div>
        </div>

        <!-- Timer Controls -->
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          <button id="startTimer" style="
            padding: 12px 20px;
            border: none;
            border-radius: 12px;
            background: ${
              this.isRunning
                ? "linear-gradient(45deg, #ef4444, #dc2626)"
                : this.isPaused
                ? "linear-gradient(45deg, #10b981, #059669)"
                : "linear-gradient(45deg, #10b981, #059669)"
            };
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">${
            this.isRunning ? "Pause" : this.isPaused ? "Resume" : "Start"
          }</button>
          
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
        padding: 20px;
        margin-top: 30px;
      ">
        <h3 style="
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          opacity: 0.9;
        ">Quick Start Sessions</h3>
        
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        ">
          ${SESSION_PRESETS.map(
            (preset) => `
            <div class="preset-card" data-preset="${preset.name}" style="
              padding: 16px;
              background: ${
                this.selectedPreset.name === preset.name
                  ? "linear-gradient(45deg, #667EEA, #764BA2)"
                  : "rgba(255,255,255,0.05)"
              };
              border: 1px solid ${
                this.selectedPreset.name === preset.name
                  ? "rgba(102,126,234,0.3)"
                  : "rgba(255,255,255,0.1)"
              };
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              <div style="
                font-size: 24px;
                margin-bottom: 8px;
              ">${preset.emoji}</div>
              <div style="
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 4px;
              ">${preset.name}</div>
              <div style="
                font-size: 12px;
                opacity: 0.7;
              ">${preset.workMinutes}m work • ${
              preset.breakMinutes
            }m break</div>
            </div>
          `
          ).join("")}
        </div>
      </div>


    `;
  }

  renderAnalyticsTab() {
    return `
      <div>
        <!-- Activity Tracking Controls -->
        <div style="
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          ">
            <h3 style="
              margin: 0;
              font-size: 16px;
              font-weight: 600;
              opacity: 0.9;
            ">📊 Activity Tracking</h3>
            
            ${
              this.isTracking
                ? `
              <div class="tracking-status" style="
                font-size: 12px;
                padding: 4px 8px;
                background: rgba(16,185,129,0.2);
                border: 1px solid rgba(16,185,129,0.3);
                border-radius: 6px;
                color: #10b981;
              ">${this.formatTrackingTime()}</div>
            `
                : ""
            }
          </div>
          
          <button id="trackingButton" style="
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 12px;
            background: ${
              this.isTracking
                ? "linear-gradient(45deg, #ef4444, #dc2626)"
                : "linear-gradient(45deg, #8b5cf6, #7c3aed)"
            };
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">${this.isTracking ? "Stop Tracking" : "Start Tracking"}</button>
          
          ${
            this.isTracking && this.trackingData
              ? `
            <div style="
              margin-top: 16px;
              padding: 12px;
              background: rgba(16,185,129,0.1);
              border: 1px solid rgba(16,185,129,0.2);
              border-radius: 8px;
            ">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 8px;">
                <div style="text-align: center;">
                  <div style="font-size: 16px; font-weight: 600; color: #10b981;">${
                    this.trackingData.sitesVisited || 0
                  }</div>
                  <div style="font-size: 10px; opacity: 0.8;">Sites Visited</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 16px; font-weight: 600; color: #10b981;">${
                    this.trackingData.tabSwitches || 0
                  }</div>
                  <div style="font-size: 10px; opacity: 0.8;">Tab Switches</div>
                </div>
              </div>
              <div style="text-align: center; font-size: 11px; opacity: 0.7;">
                Current: ${this.trackingData.currentSite || "Unknown"}
              </div>
            </div>
          `
              : ""
          }
        </div>

        ${
          this.trackingReports.length === 0
            ? `
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
            <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">No Session Reports Yet</h2>
            <p style="margin: 0; opacity: 0.7; font-size: 14px;">
              Start tracking above to generate your first analytics report with detailed insights.
            </p>
          </div>
        `
            : this.renderAnalyticsReports()
        }
      </div>
    `;
  }

  renderAnalyticsReports() {
    if (this.trackingReports.length === 0) {
      return "";
    }

    const report = this.selectedReport || this.trackingReports[0];

    return `
        <!-- Report Selector -->
        ${
          this.trackingReports.length > 1
            ? `
          <div style="
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
          ">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; opacity: 0.8;">
              Session Reports (${this.trackingReports.length})
            </h3>
            <select onchange="window.zenithPopup.selectReport(this.value)" style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 8px;
              background: rgba(255,255,255,0.05);
              color: #ffffff;
              font-size: 12px;
            ">
              ${this.trackingReports
                .map(
                  (r, index) => `
                <option value="${index}" ${
                    r.sessionId === report.sessionId ? "selected" : ""
                  }>
                  ${new Date(r.startTime).toLocaleDateString()} - ${
                    r.totalTimeFormatted
                  }
                </option>
              `
                )
                .join("")}
            </select>
          </div>
        `
            : ""
        }

        <!-- Session Overview -->
        <div style="
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
            📈 Session Overview
          </h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #10b981; margin-bottom: 4px;">
                ${report.totalTimeFormatted || "0:00"}
              </div>
              <div style="font-size: 12px; opacity: 0.7;">Total Time</div>
            </div>
            
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #667EEA; margin-bottom: 4px;">
                ${report.sitesVisited || 0}
              </div>
              <div style="font-size: 12px; opacity: 0.7;">Sites Visited</div>
            </div>
            
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #f59e0b; margin-bottom: 4px;">
                ${report.tabSwitches || 0}
              </div>
              <div style="font-size: 12px; opacity: 0.7;">Tab Switches</div>
            </div>
            
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: ${
                (report.productivity || 0) >= 70
                  ? "#10b981"
                  : (report.productivity || 0) >= 40
                  ? "#f59e0b"
                  : "#ef4444"
              }; margin-bottom: 4px;">
                ${report.productivity || 0}%
              </div>
              <div style="font-size: 12px; opacity: 0.7;">Productivity</div>
            </div>
          </div>
          
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 12px; opacity: 0.7; margin-bottom: 4px;">Session Time</div>
            <div style="font-size: 14px;">
              ${new Date(report.startTime).toLocaleString()} - ${new Date(
      report.endTime
    ).toLocaleString()}
            </div>
          </div>
        </div>

        <!-- Productivity Score -->
        <div style="
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
            🎯 Productivity Analysis
          </h3>
          
          <div style="
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 14px;">Productivity Score</span>
              <span style="font-size: 18px; font-weight: 700; color: ${
                report.productivity >= 70
                  ? "#10b981"
                  : report.productivity >= 40
                  ? "#f59e0b"
                  : "#ef4444"
              };">
                ${report.productivity}%
              </span>
            </div>
            
            <div style="
              width: 100%;
              height: 8px;
              background: rgba(255,255,255,0.1);
              border-radius: 4px;
              overflow: hidden;
            ">
              <div style="
                width: ${report.productivity}%;
                height: 100%;
                background: linear-gradient(90deg, ${
                  report.productivity >= 70
                    ? "#10b981, #059669"
                    : report.productivity >= 40
                    ? "#f59e0b, #d97706"
                    : "#ef4444, #dc2626"
                });
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
          
          <div style="font-size: 12px; opacity: 0.7; line-height: 1.4;">
            ${this.getProductivityInsight(report.productivity)}
          </div>
        </div>

        <!-- Top Sites with Bar Graph -->
        <div style="
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
            📊 Time Spent by Website
          </h3>
          
          ${
            report.topSites && report.topSites.length > 0
              ? `
            <div style="margin-bottom: 20px;">
              ${report.topSites
                .slice(0, 10)
                .map(
                  (site, index) => `
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 16px;">${this.getDomainIcon(
                        site.domain
                      )}</span>
                      <span style="font-size: 13px; font-weight: 500;">${
                        site.domain
                      }</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <span style="font-size: 11px; opacity: 0.7;">${
                        site.visits
                      } visits</span>
                      <span style="font-size: 12px; font-weight: 600; color: #667EEA; min-width: 45px; text-align: right;">
                        ${this.formatTime(Math.floor(site.timeSpent / 1000))}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Bar Graph -->
                  <div style="
                    width: 100%;
                    height: 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 4px;
                  ">
                    <div style="
                      width: ${site.percentage}%;
                      height: 100%;
                      background: linear-gradient(90deg, 
                        ${this.getSiteColor(site.domain, index)});
                      transition: width 0.5s ease;
                    "></div>
                  </div>
                  
                  <div style="text-align: right;">
                    <span style="font-size: 11px; opacity: 0.6;">${site.percentage.toFixed(
                      1
                    )}% of total time</span>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
            
            <!-- Summary Stats -->
            <div style="
              background: rgba(255,255,255,0.03);
              border-radius: 12px;
              padding: 16px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              text-align: center;
            ">
              <div>
                <div style="font-size: 18px; font-weight: 700; color: #10b981; margin-bottom: 4px;">
                  ${report.topSites.length}
                </div>
                <div style="font-size: 11px; opacity: 0.7;">Total Sites</div>
              </div>
              
              <div>
                <div style="font-size: 18px; font-weight: 700; color: #f59e0b; margin-bottom: 4px;">
                  ${report.tabSwitches}
                </div>
                <div style="font-size: 11px; opacity: 0.7;">Tab Switches</div>
              </div>
              
              <div>
                <div style="font-size: 18px; font-weight: 700; color: #667EEA; margin-bottom: 4px;">
                  ${Math.round(
                    report.tabSwitches / (report.topSites.length || 1)
                  )}
                </div>
                <div style="font-size: 11px; opacity: 0.7;">Avg Switches/Site</div>
              </div>
            </div>
          `
              : `
            <div style="text-align: center; padding: 20px; opacity: 0.6;">
              <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
              <div style="font-size: 14px;">No site data available</div>
              <div style="font-size: 12px; opacity: 0.5; margin-top: 4px;">Start tracking to see detailed analytics</div>
            </div>
          `
          }
        </div>
    `;
  }

  getDomainIcon(domain) {
    const icons = {
      "github.com": "🐙",
      "stackoverflow.com": "📚",
      "google.com": "🔍",
      "youtube.com": "📺",
      "facebook.com": "📘",
      "twitter.com": "🐦",
      "instagram.com": "📷",
      "linkedin.com": "💼",
      "reddit.com": "🤖",
      "docs.google.com": "📄",
      "notion.so": "📝",
      "slack.com": "💬",
      "discord.com": "🎮",
      "netflix.com": "🎬",
    };

    return icons[domain] || "🌐";
  }

  getSiteColor(domain, index) {
    const colors = [
      "#10b981, #059669", // Green
      "#3b82f6, #2563eb", // Blue
      "#8b5cf6, #7c3aed", // Purple
      "#f59e0b, #d97706", // Orange
      "#ef4444, #dc2626", // Red
      "#06b6d4, #0891b2", // Cyan
      "#84cc16, #65a30d", // Lime
      "#f97316, #ea580c", // Orange-red
      "#ec4899, #db2777", // Pink
      "#6366f1, #4f46e5", // Indigo
    ];

    // Use domain-specific colors for known sites
    const domainColors = {
      "github.com": "#24292e, #1a1e22",
      "youtube.com": "#ff0000, #cc0000",
      "google.com": "#4285f4, #1a73e8",
      "facebook.com": "#1877f2, #166fe5",
      "twitter.com": "#1da1f2, #0d8bd9",
      "instagram.com": "#e4405f, #c13584",
      "linkedin.com": "#0077b5, #005885",
      "reddit.com": "#ff4500, #cc3700",
      "stackoverflow.com": "#f48024, #da6c0a",
      "netflix.com": "#e50914, #b8070f",
    };

    return domainColors[domain] || colors[index % colors.length];
  }

  getProductivityInsight(score) {
    if (score >= 80) {
      return "Excellent focus! You spent most of your time on productive activities.";
    } else if (score >= 60) {
      return "Good productivity with some room for improvement. Consider reducing time on distracting sites.";
    } else if (score >= 40) {
      return "Moderate productivity. Try using website blockers during focus sessions.";
    } else if (score >= 20) {
      return "Low productivity detected. Consider implementing stricter browsing habits.";
    } else {
      return "High distraction levels. Focus techniques and website blocking may help improve concentration.";
    }
  }

  selectReport(index) {
    this.selectedReport = this.trackingReports[parseInt(index)];
    this.render();
  }

  renderCustomModal() {
    return `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      ">
        <div style="
          background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
          border-radius: 16px;
          padding: 24px;
          width: 300px;
          border: 1px solid rgba(255,255,255,0.1);
        ">
          <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Custom Timer</h3>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">
              Work Duration (minutes)
            </label>
            <input id="workMinutes" type="number" value="${this.customWorkMinutes}" min="1" max="180" style="
              width: 100%;
              padding: 12px;
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 8px;
              background: rgba(255,255,255,0.05);
              color: #ffffff;
              font-size: 14px;
            ">
          </div>
          
          <div style="margin-bottom: 24px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; opacity: 0.8;">
              Break Duration (minutes)
            </label>
            <input id="breakMinutes" type="number" value="${this.customBreakMinutes}" min="1" max="60" style="
              width: 100%;
              padding: 12px;
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 8px;
              background: rgba(255,255,255,0.05);
              color: #ffffff;
              font-size: 14px;
            ">
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button id="customModalClose" style="
              flex: 1;
              padding: 12px;
              border: none;
              border-radius: 8px;
              background: rgba(255,255,255,0.1);
              color: #ffffff;
              font-size: 14px;
              cursor: pointer;
            ">Cancel</button>
            
            <button id="customModalConfirm" style="
              flex: 1;
              padding: 12px;
              border: none;
              border-radius: 8px;
              background: linear-gradient(45deg, #10b981, #059669);
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

// Initialize the popup
document.addEventListener("DOMContentLoaded", () => {
  new ZenithPopup();
});
