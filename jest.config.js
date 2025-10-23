module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/coverage/**",
    "!**/dist/**"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      "lines": 80,
      statements: 80
    }
  },
  testMatch: [
    "<rootDir>/test/**/*.test.js"
  ],
  setupFilesAfterEnv: [],
  testTimeout: 10000
};