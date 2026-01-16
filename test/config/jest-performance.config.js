/**
 * @file jest-performance.config.js
 * @description Jest configuration for performance tests
 *
 * Configures Jest for running performance benchmarks, load tests,
 * and other performance-related test suites.
 *
 * Features:
 * - Very extended timeout (120s) for long-running benchmarks
 * - TS-Jest for TypeScript support
 * - Module name mapping for clean imports
 * - Performance metric collection
 */

module.exports = {
  displayName: 'performance',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../',
  testMatch: ['<rootDir>/test/performance/**/*.spec.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testTimeout: 120000,
  bail: false,
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
  reporters: ['default', 'jest-html-reporters'],
};
