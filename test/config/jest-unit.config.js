/**
 * @file jest-unit.config.js
 * @description Jest configuration for unit tests
 *
 * Configures Jest for running unit tests for individual services, controllers,
 * and utilities with strict coverage thresholds.
 *
 * Features:
 * - Coverage thresholds enforcement (75%+)
 * - TS-Jest for TypeScript support
 * - Module name mapping for clean imports
 * - Setup files for test initialization
 */

module.exports = {
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../',
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    'generated/',
  ],
  coverageThreshold: {
    global: {
      lines: 75,
      functions: 70,
      branches: 65,
      statements: 75,
    },
  },
  testTimeout: 10000,
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
};
