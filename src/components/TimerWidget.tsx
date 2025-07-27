import React, { useState } from 'react';

const TimerWidget = ({ timerState, setTimerState, settings }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const closeWidget = () => {
    window.electronAPI?.hideTimerWidget();
  };

  const pauseResumeTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
      isPaused: !prev.isRunning
    }));
  };

  return (
    <div 
      style={{
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: timerState.isRunning 
          ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
          : 'linear-gradient(135deg, #6b7280, #4b5563)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        cursor: 'grab',
        transition: 'transform 0.2s',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        border: '3px solid rgba(255, 255, 255, 0.2)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Timer Display */}
      <div style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        {formatTime(timerState.timeRemaining)}
      </div>

      {/* Session Type */}
      <div style={{ 
        fontSize: '12px', 
        opacity: 0.8, 
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        {timerState.isRunning ? '🎯 Focus' : '⏸️ Ready'}
      </div>

      {/* Controls (shown on hover) */}
      {isHovered && (
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          marginTop: '8px'
        }}>
          {(timerState.isRunning || timerState.isPaused) && (
            <button
              onClick={pauseResumeTimer}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {timerState.isRunning ? '⏸️' : '▶️'}
            </button>
          )}
          
          <button
            onClick={closeWidget}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Preset indicator */}
      <div style={{ 
        position: 'absolute', 
        bottom: '16px', 
        fontSize: '10px', 
        opacity: 0.6,
        textAlign: 'center'
      }}>
        {timerState.currentPreset.name}
      </div>

      {/* Pulsing effect when running */}
      {timerState.isRunning && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          animation: 'pulse 2s infinite'
        }} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default TimerWidget;
