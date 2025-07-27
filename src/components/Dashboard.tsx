import React, { useState } from 'react';

const Dashboard = ({ timerState, setTimerState, settings, updateSettings }) => {
  const [activeTab, setActiveTab] = useState('timer');

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false
    }));
  };

  const pauseTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true
    }));
  };

  const stopTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      timeRemaining: prev.currentPreset.focusDuration * 60
    }));
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              SF
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
              StudyFocus
            </h1>
          </div>
          
          <button
            onClick={() => window.electronAPI?.showTimerWidget()}
            style={{
              padding: '12px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🎯 Show Widget
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #e5e7eb' }}>
          {[
            { id: 'timer', label: 'Timer', icon: '⏱️' },
            { id: 'history', label: 'History', icon: '📊' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {activeTab === 'timer' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            {/* Timer Display */}
            <div className="card">
              <div className="text-center">
                <h2 className="text-2xl mb-6">Focus Session</h2>
                
                {/* Timer Circle */}
                <div className="timer-circle">
                  {formatTime(timerState.timeRemaining)}
                </div>
                
                {/* Control Buttons */}
                <div className="flex justify-center space-x-4">
                  {!timerState.isRunning && !timerState.isPaused && (
                    <button onClick={startTimer} className="btn btn-primary">
                      ▶️ Start Focus
                    </button>
                  )}
                  
                  {timerState.isRunning && (
                    <button onClick={pauseTimer} className="btn btn-danger">
                      ⏸️ Pause
                    </button>
                  )}
                  
                  {timerState.isPaused && (
                    <button onClick={startTimer} className="btn btn-primary">
                      ▶️ Resume
                    </button>
                  )}
                  
                  {(timerState.isRunning || timerState.isPaused) && (
                    <button onClick={stopTimer} className="btn btn-danger">
                      ⏹️ Stop
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px', 
                  marginTop: '30px' 
                }}>
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                      {timerState.sessionCount}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      Sessions Today
                    </div>
                  </div>
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                      {timerState.currentPreset.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      Current Preset
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Presets */}
            <div className="card">
              <h3 className="text-lg mb-4">Session Presets</h3>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                <strong>Current: </strong>{timerState.currentPreset.name}
                <br />
                <strong>Focus: </strong>{timerState.currentPreset.focusDuration} min
                <br />
                <strong>Break: </strong>{timerState.currentPreset.breakDuration} min
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  💡 Quick Tips
                </h4>
                <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                  <li>• Start with 25-minute focus sessions</li>
                  <li>• Take breaks to avoid burnout</li>
                  <li>• Use the floating widget to stay on track</li>
                  <li>• Track your progress in the History tab</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <h2 className="text-2xl mb-6">Session History</h2>
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              📊 Your completed sessions will appear here. Start your first session to begin tracking!
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card">
            <h2 className="text-2xl mb-6">Settings</h2>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                🎨 Appearance
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSettings({ theme: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white'
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                ℹ️ About StudyFocus
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                StudyFocus is a productivity timer app designed to help you maintain focus during study and work sessions.
                Built with Electron, React, and modern web technologies.
              </p>
              <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Version</span>
                  <span style={{ fontWeight: '500' }}>1.0.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Author</span>
                  <span style={{ fontWeight: '500' }}>Aniruddha Mondal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
