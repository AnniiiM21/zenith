# Contributing to Zenith ⚡

Thank you for your interest in contributing to Zenith! We welcome contributions from developers of all skill levels.

## 🚀 Quick Start

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch from `develop`
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

## 📋 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation
```bash
git clone https://github.com/yourusername/zenith.git
cd zenith
npm install
npm run dev
```

## 🎯 How to Contribute

### 🐛 Reporting Bugs
- Use the bug report template
- Include steps to reproduce
- Provide system information
- Add screenshots if applicable

### ✨ Suggesting Features
- Use the feature request template
- Explain the use case clearly
- Consider implementation challenges
- Provide mockups if possible

### 💻 Code Contributions

#### Areas We Need Help With
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation
- 🧪 Testing
- 🎨 UI/UX improvements
- 🌐 Internationalization
- 📱 Platform-specific enhancements

#### Development Guidelines

**Code Style**
- Use TypeScript for all new code
- Follow existing code patterns
- Use Prettier for formatting
- Follow ESLint rules

**React Patterns**
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization
- Follow component composition patterns

**Styling**
- Use Tailwind CSS classes
- Maintain design system consistency
- Ensure responsive design
- Test on multiple screen sizes

**Accessibility**
- Include ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

**Performance**
- Optimize bundle size
- Use code splitting where appropriate
- Implement proper loading states
- Monitor memory usage in Electron

#### Commit Messages
We follow the Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**
```
feat(timer): add custom timer duration validation
fix(ui): resolve button hover state animation
docs(readme): update installation instructions
```

## 🧪 Testing

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Test Guidelines
- Write tests for new features
- Maintain existing test coverage
- Test edge cases and error conditions
- Include integration tests for complex features

### Manual Testing
- Test on multiple platforms (Windows, macOS, Linux)
- Verify accessibility features
- Test with different screen sizes
- Validate performance with large datasets

## 📦 Building and Distribution

```bash
npm run build           # Build React app
npm run electron:pack   # Package Electron app
npm run electron:dist   # Build distributables
```

## 🔄 Pull Request Process

### Before Submitting
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Changes are tested on target platforms
- [ ] Commit messages follow conventions

### PR Requirements
- Clear description of changes
- Link to related issues
- Screenshots for UI changes
- Breaking changes documented
- Performance impact considered

### Review Process
1. Automated checks must pass
2. Code review by maintainers
3. Testing on multiple platforms
4. Documentation review
5. Final approval and merge

## 📁 Project Structure

```
zenith/
├── electron/           # Electron main process
├── src/               # React application
│   ├── components/    # UI components
│   ├── utils/        # Utility functions
│   ├── types/        # TypeScript types
│   └── styles/       # Styling and themes
├── public/           # Static assets
├── tests/           # Test files
└── docs/            # Documentation
```

## 🐛 Debugging

### Development Tools
- React DevTools
- Electron DevTools
- Chrome/Edge DevTools
- VS Code debugging configuration

### Common Issues
- Port conflicts (default: 3000)
- Node version compatibility
- Electron rebuild requirements
- Platform-specific build issues

## 📞 Getting Help

- 💬 **Discussions**: Use GitHub Discussions for questions
- 🐛 **Issues**: Report bugs via GitHub Issues  
- 📧 **Contact**: Reach out to maintainers directly
- 📖 **Docs**: Check existing documentation first

## 🏆 Recognition

Contributors will be:
- Listed in the README contributors section
- Credited in release notes for significant contributions
- Invited to become maintainers for consistent contributions

## 📄 License

By contributing to Zenith, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Zenith better! 🙏**
