module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  moduleFileExtensions: ['js'],
  testPathIgnorePatterns: ['/node_modules/']
}; 