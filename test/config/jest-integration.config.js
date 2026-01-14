/**
 * @file jest-integration.config.js
 * @description Jest configuration for integration tests
 *
 * Configures Jest for running integration tests that verify multiple modules
 * working together with realistic database and service interactions.
 *
 * Features:
 * - Extended timeout (30s) for integration scenarios
 * - TS-Jest for TypeScript support
 * - Module name mapping for clean imports
 * - Full coverage collection for integrated flows
 */

module.exports = {
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../',
  testMatch: ['<rootDir>/test/integration/**/*.integration-spec.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
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
  testTimeout: 30000,
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
