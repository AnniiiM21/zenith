<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# StudyFocus - Copilot Instructions

This is a productivity timer desktop application built with Electron, React, TypeScript, and Tailwind CSS.

## Project Structure
- `electron/` - Electron main process and preload scripts
- `src/` - React application source code
  - `components/` - React components
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions and constants
- `public/` - Static assets and HTML template

## Key Features
- Always-on-top timer widget
- Session presets (Pomodoro, Deep Work, etc.)
- Break suggestions with categories
- Session history and analytics
- Dark/light theme support
- Local storage for persistence

## Development Guidelines
- Use TypeScript for all new files
- Follow React functional component patterns with hooks
- Use Tailwind CSS for styling
- Maintain accessibility with proper ARIA labels
- Store data in localStorage for persistence
- Use IPC for Electron main/renderer communication

## Architecture
- Main window: Dashboard with timer, history, and settings
- Timer widget: Floating draggable widget (always-on-top)
- Local storage: Session data and user preferences
- Future: Browser extension integration for activity tracking

When suggesting code changes, prioritize:
1. Type safety and proper TypeScript usage
2. Responsive design with Tailwind CSS
3. Accessibility best practices
4. Performance optimization
5. User experience improvements
