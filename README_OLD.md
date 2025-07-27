# Zenith - Productivity Timer

A cross-platform desktop application designed to help users reach their productivity zenith through focused work sessions using customizable timers and productivity methods.

## Features

### Core Features ✅
- **Always-on-top Timer Widget**: Floating, draggable timer that stays visible
- **Session Presets**: Pre-configured timing patterns (Pomodoro, Deep Work, Quick Sprint, Ultra Focus)
- **Break Suggestions**: Categorized break activities (Physical, Mental, Social, Creative)
- **Session History**: Track completed sessions with detailed analytics
- **Dark/Light Theme**: Automatic system theme detection with manual override
- **Local Storage**: Persistent session data and settings

### Planned Features 🚧
- Browser extension integration for activity tracking
- Advanced analytics and productivity insights
- Custom session preset creation
- Export reports (PDF/CSV)
- Notification sounds and system notifications
- Session goals and achievements

## Tech Stack

- **Framework**: Electron (cross-platform desktop)
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Build**: Webpack
- **Package Manager**: npm

## Project Structure

```
StudyFocus/
├── electron/           # Electron main process
│   ├── main.js        # Main Electron process
│   └── preload.js     # Preload script for IPC
├── src/               # React application
│   ├── components/    # React components
│   │   ├── Dashboard.tsx
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerWidget.tsx
│   │   ├── SessionPresets.tsx
│   │   ├── SessionHistory.tsx
│   │   ├── BreakSuggestions.tsx
│   │   └── SettingsPanel.tsx
│   ├── types/         # TypeScript definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main React component
│   ├── index.tsx      # React entry point
│   └── index.css      # Global styles
├── public/            # Static assets
├── webpack.config.js  # Webpack configuration
├── tailwind.config.js # Tailwind CSS configuration
└── package.json       # Project dependencies
```

## Getting Started

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd StudyFocus
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run electron-dev
```

### Available Scripts

- `npm start` - Start Webpack dev server
- `npm run build` - Build React app for production
- `npm run electron` - Run Electron app
- `npm run electron-dev` - Run in development mode (React + Electron)
- `npm run dist` - Build and package the app for distribution

## Usage

### Timer Widget
- Click "Show Widget" to display the floating timer
- Widget stays on top of other windows
- Drag to reposition
- Hover to reveal controls (pause/resume, close)

### Session Presets
- **Pomodoro Classic**: 25min focus, 5min break, 15min long break every 4 sessions
- **Deep Work**: 50min focus, 10min break, 30min long break every 3 sessions
- **Quick Sprint**: 15min focus, 3min break, 10min long break every 6 sessions
- **Ultra Focus**: 90min focus, 20min break, 45min long break every 2 sessions

### Break Suggestions
- **Physical**: Walking, stretching, hydration
- **Mental**: Breathing exercises, meditation, journaling
- **Social**: Quick conversations, check-ins
- **Creative**: Music, creative writing

### Session History
- View completed sessions with timestamps
- Filter by session type (focus/break) and date range
- Track total time, completion rate, and focus patterns
- Export data backup (JSON format)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Use TypeScript for all new files
- Follow React functional component patterns with hooks
- Use Tailwind CSS for styling
- Maintain accessibility with proper ARIA labels
- Store data in localStorage for persistence
- Use IPC for Electron main/renderer communication

## Future Enhancements

### Browser Extension Integration
- Track browser activity during sessions
- Classify websites as productive/distracting
- Sync with YouTube playlists or study platforms
- Real-time productivity scoring

### Advanced Analytics
- Weekly/monthly productivity reports
- Focus pattern analysis
- Distraction tracking
- Goal setting and achievement tracking

### Additional Features
- Custom sound alerts
- Session templates
- Team/collaborative sessions
- Cloud sync across devices

## License

MIT License - see LICENSE file for details

## Author

**Aniruddha Mondal**  
Version: 1.0.0  
Date: 2025-07-26
