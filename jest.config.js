module.exports = {
  preset: '@ionic/angular-toolkit/jest',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  collectCoverageFrom: [
    'www/js/**/*.js',
    '!www/js/**/*.spec.js',
    '!www/lib/**/*',
    '!www/external/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/www/$1'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/www/**/__tests__/**/*.(js|jsx)',
    '<rootDir>/www/**/?(*.)(spec|test).(js|jsx)'
  ],
  moduleFileExtensions: ['js', 'json', 'jsx'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
