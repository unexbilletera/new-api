/**
 * @file jest-e2e.config.js
 * @description Jest configuration for end-to-end tests
 *
 * Configures Jest for running E2E tests that verify complete user flows
 * and system interactions across all API layers.
 *
 * Features:
 * - Extended timeout (60s) for E2E tests
 * - TS-Jest for TypeScript support
 * - Proper module name mapping for imports
 * - Setup files for test initialization
 */

module.exports = {
  displayName: 'e2e',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../',
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/test/config/setup.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
  ],
};
