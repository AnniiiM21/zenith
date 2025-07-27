# ⚡ Zenith - Peak Productivity Timer

<div align="center">

![Zenith Logo](https://via.placeholder.com/120x120/667EEA/FFFFFF?text=⚡)

**Elevate Your Focus, Reach Your Peak**

A modern, beautiful desktop productivity timer built with Electron, React, and TypeScript.

[![Made with Electron](https://img.shields.io/badge/Made%20with-Electron-9feaf9.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12.23.9-ff69b4.svg)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## ✨ Features

### 🎯 **Smart Timer System**
- **Preset Sessions**: Pomodoro (25/5), Deep Work (50/10), Quick Sprint (15/3), Power Hour (60/15)
- **Custom Timers**: Create your own work and break durations
- **Auto-switching**: Seamlessly transitions between work and break sessions
- **Smart Notifications**: Desktop alerts when sessions complete

### 🎨 **Modern Design**
- **Glass Morphism UI**: Beautiful blur effects with Figma-accurate color palette
- **Smooth Animations**: Powered by Framer Motion for delightful interactions
- **Circular Timer Display**: Large, easy-to-read timer with visual progress
- **Dark Theme**: Eye-friendly design for long productivity sessions

### 📊 **Productivity Insights**
- **Session History**: Complete tracking of all your focus sessions
- **Daily Progress**: Real-time metrics with visual progress bars
- **Goal Tracking**: Daily 4-hour focus goal with progress visualization
- **Break Suggestions**: Curated activities for productive breaks

### 🚀 **Advanced Features**
- **Always-on-top Widget**: Optional floating timer for multitasking
- **Cross-platform**: Windows, macOS, and Linux support
- **Local Privacy**: All data stored locally on your device
- **Modern Typography**: System fonts for native feel across platforms

## 🛠 Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Desktop Framework** | Electron | 37.2.4 |
| **Frontend** | React | 18.3.1 |
| **Language** | TypeScript | 5.8.3 |
| **Animations** | Framer Motion | 12.23.9 |
| **Styling** | Tailwind CSS | 3.x |
| **Build Tool** | Webpack | 5.x |

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zenith.git
cd zenith

# Install dependencies
npm install

# Start development server
npm run dev

# In a separate terminal, run Electron
npm run electron:dev
```

### Building for Production

```bash
# Build React app
npm run build

# Package Electron app (current platform)
npm run electron:pack

# Build distributables for all platforms
npm run electron:dist
```

## 📁 Project Structure

```
zenith/
├── 📁 electron/              # Electron main process
│   ├── main.js              # Main process entry point
│   └── preload.js           # Renderer IPC bridge
├── 📁 src/                  # React application source
│   ├── 📁 components/       # Reusable UI components
│   │   └── 📁 ui/          # Specialized UI components
│   │       ├── AnimatedButton.tsx
│   │       ├── AnimatedCard.tsx
│   │       └── TimerDisplay.tsx
│   ├── 📁 utils/           # Utility functions & constants
│   ├── 📁 types/           # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # React entry point
│   └── index.css           # Global styles & Tailwind
├── 📁 public/              # Static assets
├── 📁 .github/             # GitHub templates & workflows
└── 📄 README.md            # You are here
```

## 🎮 Usage Guide

### Getting Started
1. **Choose Your Session**: Select from preset timers or create a custom one
2. **Start Focusing**: Click the play button to begin your productivity session
3. **Take Smart Breaks**: Follow suggested break activities for optimal productivity
4. **Track Progress**: Monitor your daily and historical productivity metrics

### Pro Tips
- 🎯 Use the **floating widget** to keep the timer visible while working in other apps
- 📊 Aim for the **4-hour daily goal** for sustained productivity
- 🧘 Follow **break suggestions** to maintain energy and focus throughout the day
- 📈 Review your **session history** to identify your most productive patterns

## 🎨 Screenshots

<div align="center">

### Main Timer Interface
*Beautiful glass morphism design with animated timer*

### Session History & Analytics  
*Track your productivity journey with detailed insights*

### Break Suggestions & Wellness
*Smart recommendations for productive breaks*

</div>

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/zenith.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Development Guidelines
- ✅ Use **TypeScript** for type safety
- ✅ Follow **React hooks** patterns
- ✅ Use **Tailwind CSS** for styling
- ✅ Maintain **accessibility** standards (ARIA labels, keyboard navigation)
- ✅ Test on **multiple platforms**
- ✅ Follow **conventional commits** format

### Areas for Contribution
- 🐛 Bug fixes and performance improvements
- ✨ New features and productivity enhancements
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🌐 Internationalization (i18n)
- 🧪 Testing and quality assurance

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- 🎨 **Design Inspiration**: Modern productivity apps and glass morphism trends
- 🎨 **Color Palette**: Figma-based gradient designs for visual appeal
- 📚 **Icons**: Emoji-based iconography for universal accessibility
- ⚡ **Animations**: Framer Motion for smooth, delightful interactions
- 🔧 **Tools**: Electron ecosystem and React community

## 🗺 Roadmap

### Phase 1: Core Enhancement
- [ ] 🌐 **Browser extension** integration for activity tracking
- [ ] ☁️ **Cloud sync** for session data backup
- [ ] 📱 **Mobile companion** app for cross-device productivity

### Phase 2: Team Features
- [ ] 👥 **Team collaboration** and shared sessions
- [ ] 📊 **Advanced analytics** with insights and recommendations
- [ ] 🔗 **Productivity tool** integrations (Notion, Trello, etc.)

### Phase 3: Intelligence
- [ ] 🤖 **AI-powered** focus recommendations
- [ ] 📈 **Productivity pattern** analysis
- [ ] 🎯 **Smart goal** setting and achievement tracking

---

<div align="center">

**Built with ❤️ for productivity enthusiasts everywhere**

⭐ **Star this repo** if Zenith helps boost your productivity!

[Report Bug](https://github.com/yourusername/zenith/issues) · [Request Feature](https://github.com/yourusername/zenith/issues) · [Join Discussions](https://github.com/yourusername/zenith/discussions)

</div>
