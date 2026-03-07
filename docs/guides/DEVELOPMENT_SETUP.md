# Development Environment Setup

## Prerequisites

### Required Software
- **Node.js**: 18.x LTS (use nvm for version management)
    nvm install 18
- **npm**: 9.x or higher
- **Git**: Latest version
- **Docker**: For consistent development environment (optional)

### Mobile Development
- **Android Studio**: Latest version with Android SDK 34
- **Xcode**: 15.x or higher (macOS only)
- **iOS Simulator**: iOS 15+ support required

### Development Tools
```bash
# Install global dependencies
npm install -g @ionic/cli@7.x
npm install -g @capacitor/cli@5.x
npm install -g cordova@12.x  # For legacy support during migration

# Install development dependencies
npm install --save-dev typescript@5.x
npm install --save-dev eslint@8.x
npm install --save-dev prettier@3.x
npm install --save-dev jest@29.x
npm install --save-dev cypress@13.x
```

## Project Setup

### Initial Setup
```bash
git clone https://github.com/ZoneMinder/zmNinja.git
cd zmNinja
npm install
```

### Platform Setup
```bash
# For Cordova (current)
cordova platform add android@13.0.0
cordova platform add ios@7.1.1

# For Capacitor (future)
npx cap add android
npx cap add ios
```

## Security Requirements
- All dependencies must pass `npm audit` with no high/critical vulnerabilities
- Pre-commit hooks enforce linting and formatting
- Secrets must be stored in environment variables, never committed to code

## Testing Requirements
- Unit tests: Jest with >80% coverage
- E2E tests: Cypress for critical user flows
- Mobile testing: Appium for cross-platform validation

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `hotfix/*`: Critical bug fixes

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Husky for pre-commit hooks
- Conventional commits for commit messages

### Build Process
```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Platform builds
cordova build android --debug
cordova build ios --debug
```

## Environment Variables
Create `.env` file in project root:
```
ZM_SERVER_URL=https://your-zoneminder-server.com
API_VERSION=v1
DEBUG_MODE=true
```

## IDE Configuration

### VS Code Extensions
- Ionic
- Angular Language Service
- ESLint
- Prettier
- GitLens

### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Troubleshooting

### Common Issues
1. **Node version conflicts**: Use nvm to manage Node.js versions
2. **Platform build failures**: Ensure Android SDK and Xcode are properly configured
3. **Plugin compatibility**: Check plugin versions against platform requirements

### Debug Tools
- Chrome DevTools for web debugging
- Safari Web Inspector for iOS debugging
- Android Studio for Android debugging
- Ionic DevApp for device testing

## Performance Monitoring
- Bundle analyzer for build optimization
- Lighthouse for performance auditing
- Memory profiling for leak detection
- Network monitoring for API optimization
