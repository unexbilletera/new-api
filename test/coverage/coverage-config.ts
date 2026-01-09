export interface CoverageMetrics {
  lines: CoverageDetail;
  statements: CoverageDetail;
  functions: CoverageDetail;
  branches: CoverageDetail;
}

export interface CoverageDetail {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface FileCoverage {
  file: string;
  lines: CoverageDetail;
  statements: CoverageDetail;
  functions: CoverageDetail;
  branches: CoverageDetail;
  url?: string;
}

export interface CoverageReport {
  timestamp: string;
  version: string;
  summary: CoverageMetrics;
  byFile: FileCoverage[];
  history: CoverageHistoryEntry[];
}

export interface CoverageHistoryEntry {
  timestamp: string;
  lines: number;
  statements: number;
  functions: number;
  branches: number;
  status: 'improved' | 'stable' | 'degraded';
  change: number;
}

export const COVERAGE_THRESHOLDS = {
  global: {
    lines: 80,
    statements: 80,
    functions: 75,
    branches: 70,
  },

  file: {
    lines: 75,
    statements: 75,
    functions: 70,
    branches: 65,
  },

  critical: {
    lines: 95,
    statements: 95,
    functions: 90,
    branches: 85,
  },

  core: {
    lines: 90,
    statements: 90,
    functions: 85,
    branches: 80,
  },

  standard: {
    lines: 80,
    statements: 80,
    functions: 75,
    branches: 70,
  },
};

export const CRITICAL_FILES = [
  'src/public/auth/services/*.ts',
  'src/shared/jwt/*.ts',
  'src/shared/prisma/*.ts',
];

export const CORE_FILES = [
  'src/public/auth/controllers/*.ts',
  'src/secure/notifications/services/*.ts',
  'src/secure/app-info/services/*.ts',
];

export const COVERAGE_STATUS = {
  excellent: { min: 95, color: '#10b981', emoji: '🟢' },
  good: { min: 85, color: '#3b82f6', emoji: '🔵' },
  acceptable: { min: 75, color: '#f59e0b', emoji: '🟡' },
  poor: { min: 60, color: '#ef4444', emoji: '🔴' },
  critical: { min: 0, color: '#7f1d1d', emoji: '🔴' },
};

export function getCoverageStatus(percentage: number): keyof typeof COVERAGE_STATUS {
  if (percentage >= COVERAGE_STATUS.excellent.min) return 'excellent';
  if (percentage >= COVERAGE_STATUS.good.min) return 'good';
  if (percentage >= COVERAGE_STATUS.acceptable.min) return 'acceptable';
  if (percentage >= COVERAGE_STATUS.poor.min) return 'poor';
  return 'critical';
}

export function analyzeCoverageTrend(
  previous: number,
  current: number
): { status: 'improved' | 'stable' | 'degraded'; change: number } {
  const change = current - previous;
  const changePercent = (change / previous) * 100;

  let status: 'improved' | 'stable' | 'degraded';
  if (changePercent > 0.5) status = 'improved';
  else if (changePercent < -0.5) status = 'degraded';
  else status = 'stable';

  return { status, change: parseFloat(changePercent.toFixed(2)) };
}

export const SAMPLE_COVERAGE_REPORT: CoverageReport = {
  timestamp: new Date().toISOString(),
  version: '1.0',
  summary: {
    lines: { total: 10000, covered: 8200, skipped: 50, pct: 82 },
    statements: { total: 10500, covered: 8600, skipped: 50, pct: 81.9 },
    functions: { total: 800, covered: 650, skipped: 10, pct: 81.25 },
    branches: { total: 1200, covered: 900, skipped: 20, pct: 75 },
  },
  byFile: [
    {
      file: 'src/public/auth/controllers/auth.controller.ts',
      lines: { total: 200, covered: 195, skipped: 0, pct: 97.5 },
      statements: { total: 220, covered: 215, skipped: 0, pct: 97.7 },
      functions: { total: 15, covered: 14, skipped: 0, pct: 93.3 },
      branches: { total: 40, covered: 38, skipped: 0, pct: 95 },
    },
    {
      file: 'src/public/auth/services/auth.service.ts',
      lines: { total: 300, covered: 285, skipped: 5, pct: 95 },
      statements: { total: 320, covered: 305, skipped: 5, pct: 95.3 },
      functions: { total: 25, covered: 24, skipped: 0, pct: 96 },
      branches: { total: 60, covered: 57, skipped: 0, pct: 95 },
    },
  ],
  history: [
    {
      timestamp: '2026-01-01',
      lines: 78,
      statements: 77.5,
      functions: 75,
      branches: 70,
      status: 'stable',
      change: 0,
    },
    {
      timestamp: '2026-01-02',
      lines: 79.5,
      statements: 79,
      functions: 76.5,
      branches: 71.5,
      status: 'improved',
      change: 1.5,
    },
    {
      timestamp: '2026-01-03',
      lines: 80.2,
      statements: 79.8,
      functions: 77.2,
      branches: 72.5,
      status: 'improved',
      change: 0.7,
    },
    {
      timestamp: '2026-01-04',
      lines: 81,
      statements: 80.5,
      functions: 78,
      branches: 73.5,
      status: 'improved',
      change: 0.8,
    },
    {
      timestamp: '2026-01-05',
      lines: 81.5,
      statements: 81,
      functions: 78.5,
      branches: 74,
      status: 'improved',
      change: 0.5,
    },
    {
      timestamp: '2026-01-06',
      lines: 82,
      statements: 81.5,
      functions: 79,
      branches: 74.5,
      status: 'improved',
      change: 0.5,
    },
    {
      timestamp: '2026-01-07',
      lines: 82.5,
      statements: 82,
      functions: 79.5,
      branches: 75,
      status: 'improved',
      change: 0.5,
    },
  ],
};

export function generateBadgeUrl(coverage: number): string {
  const status = getCoverageStatus(coverage);
  const color = COVERAGE_STATUS[status].color;
  const label = `coverage-${coverage.toFixed(1)}%`;
  return `https://img.shields.io/badge/${label}-${color}.svg`;
}

export const JEST_COVERAGE_CONFIG = {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    './src/public/auth/': {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95,
    },
  },
  testEnvironment: 'node',
};

export function getRecommendations(coverage: CoverageMetrics): string[] {
  const recommendations: string[] = [];

  if (coverage.lines.pct < 80) {
    recommendations.push('❌ Line coverage below 80% - Add more test cases');
  } else if (coverage.lines.pct < 90) {
    recommendations.push('⚠️ Line coverage 80-90% - Good, but can improve');
  }

  if (coverage.statements.pct < 80) {
    recommendations.push('❌ Statement coverage below 80% - Focus on statement coverage');
  }

  if (coverage.functions.pct < 75) {
    recommendations.push('❌ Function coverage below 75% - Test more functions');
  }

  if (coverage.branches.pct < 70) {
    recommendations.push('❌ Branch coverage below 70% - Add edge case tests');
  }

  if (
    coverage.lines.pct >= 90 &&
    coverage.statements.pct >= 90 &&
    coverage.functions.pct >= 85
  ) {
    recommendations.push('✅ Excellent coverage - Keep up the quality!');
  }

  return recommendations;
}
