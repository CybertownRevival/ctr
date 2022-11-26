/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  coverageProvider: 'v8',
  preset: 'ts-jest',
  rootDir: 'src',
  setupFiles: [ '<rootDir>/test-setup.ts' ],
  testMatch: ['**/*.spec.ts'],
};
