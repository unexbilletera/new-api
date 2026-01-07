
export interface LoadTestScenario {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  concurrency: number;
  duration: number;
  expectedRPS: number;
  expectedLatency: number;
  expectedSuccessRate: number;
  payload?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface LoadTestResults {
  scenario: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  passed: boolean;
}

export const LOAD_TEST_SCENARIOS: LoadTestScenario[] = [
  {
    name: 'Signup - 50 concurrent users',
    endpoint: '/auth/signup',
    method: 'POST',
    concurrency: 50,
    duration: 30,
    expectedRPS: 10,
    expectedLatency: 200,
    expectedSuccessRate: 0.95,
    payload: {
      email: 'user@example.com',
      phone: '+5511999999999',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    },
  },

  {
    name: 'Signin - 100 concurrent users',
    endpoint: '/auth/signin',
    method: 'POST',
    concurrency: 100,
    duration: 30,
    expectedRPS: 20,
    expectedLatency: 150,
    expectedSuccessRate: 0.98,
    payload: {
      email: 'user@example.com',
      password: 'SecurePass123!',
    },
  },

  {
    name: 'Email Validation - 50 concurrent requests',
    endpoint: '/auth/send-email-validation',
    method: 'POST',
    concurrency: 50,
    duration: 30,
    expectedRPS: 15,
    expectedLatency: 100,
    expectedSuccessRate: 0.99,
    payload: {
      email: 'user@example.com',
    },
  },

  {
    name: 'Phone Validation - 50 concurrent requests',
    endpoint: '/auth/send-phone-validation',
    method: 'POST',
    concurrency: 50,
    duration: 30,
    expectedRPS: 15,
    expectedLatency: 100,
    expectedSuccessRate: 0.99,
    payload: {
      phone: '+5511999999999',
    },
  },

  {
    name: 'Get App Info - 200 concurrent users',
    endpoint: '/app-info',
    method: 'GET',
    concurrency: 200,
    duration: 30,
    expectedRPS: 50,
    expectedLatency: 50,
    expectedSuccessRate: 0.99,
    headers: {
      'Authorization': 'Bearer mock-token',
    },
  },

  {
    name: 'List Notifications - 100 concurrent users',
    endpoint: '/notifications?limit=20&offset=0',
    method: 'GET',
    concurrency: 100,
    duration: 30,
    expectedRPS: 30,
    expectedLatency: 100,
    expectedSuccessRate: 0.98,
    headers: {
      'Authorization': 'Bearer mock-token',
    },
  },

  {
    name: 'Mark Notification as Read - 100 concurrent requests',
    endpoint: '/notifications/:id/read',
    method: 'PUT',
    concurrency: 100,
    duration: 30,
    expectedRPS: 30,
    expectedLatency: 80,
    expectedSuccessRate: 0.98,
    headers: {
      'Authorization': 'Bearer mock-token',
    },
  },

  {
    name: 'Check Terms - 150 concurrent users',
    endpoint: '/terms/check',
    method: 'GET',
    concurrency: 150,
    duration: 30,
    expectedRPS: 40,
    expectedLatency: 60,
    expectedSuccessRate: 0.99,
    headers: {
      'Authorization': 'Bearer mock-token',
    },
  },

  {
    name: 'List Clients (Backoffice) - 50 concurrent users',
    endpoint: '/backoffice/clients?limit=20&offset=0',
    method: 'GET',
    concurrency: 50,
    duration: 30,
    expectedRPS: 15,
    expectedLatency: 150,
    expectedSuccessRate: 0.95,
    headers: {
      'Authorization': 'Bearer admin-token',
    },
  },

  {
    name: 'Health Check - 500 concurrent requests',
    endpoint: '/health',
    method: 'GET',
    concurrency: 500,
    duration: 30,
    expectedRPS: 200,
    expectedLatency: 10,
    expectedSuccessRate: 1.0,
  },
];

export const SPIKE_TEST_SCENARIOS: LoadTestScenario[] = [
  {
    name: 'Spike: Signin - 500 concurrent requests',
    endpoint: '/auth/signin',
    method: 'POST',
    concurrency: 500,
    duration: 10,
    expectedRPS: 100,
    expectedLatency: 300,
    expectedSuccessRate: 0.90,
    payload: {
      email: 'user@example.com',
      password: 'SecurePass123!',
    },
  },

  {
    name: 'Spike: Get App Info - 1000 concurrent requests',
    endpoint: '/app-info',
    method: 'GET',
    concurrency: 1000,
    duration: 10,
    expectedRPS: 300,
    expectedLatency: 100,
    expectedSuccessRate: 0.95,
    headers: {
      'Authorization': 'Bearer mock-token',
    },
  },
];

export const SUSTAINED_LOAD_SCENARIOS: LoadTestScenario[] = [
  {
    name: 'Sustained: Mixed API Load - 5 minutes',
    endpoint: '/health',
    method: 'GET',
    concurrency: 100,
    duration: 300,
    expectedRPS: 30,
    expectedLatency: 100,
    expectedSuccessRate: 0.98,
  },
];

export const PERFORMANCE_THRESHOLDS = {
  critical: {
    latencyP95: 100,
    latencyP99: 200,
    successRate: 0.99,
  },

  highPriority: {
    latencyP95: 200,
    latencyP99: 300,
    successRate: 0.95,
  },

  mediumPriority: {
    latencyP95: 300,
    latencyP99: 500,
    successRate: 0.90,
  },

  lowPriority: {
    latencyP95: 500,
    latencyP99: 1000,
    successRate: 0.85,
  },
};

export const ARTILLERY_CONFIG = {
  config: {
    target: 'http://localhost:3000',
    phases: [
      {
        duration: 30,
        arrivalRate: 5,
        name: 'Warm up',
      },
      {
        duration: 120,
        arrivalRate: 20,
        name: 'Ramp up',
      },
      {
        duration: 120,
        arrivalRate: 50,
        name: 'Sustained high load',
      },
      {
        duration: 30,
        arrivalRate: 10,
        name: 'Cool down',
      },
    ],
    defaults: {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Artillery Load Tester',
      },
    },
  },
  scenarios: [
    {
      name: 'Health Check Flow',
      flow: [
        {
          get: {
            url: '/health',
          },
        },
      ],
    },
    {
      name: 'Authentication Flow',
      flow: [
        {
          post: {
            url: '/auth/signin',
            json: {
              email: 'user@example.com',
              password: 'SecurePass123!',
            },
            capture: {
              json: '$.accessToken',
              as: 'token',
            },
          },
        },
        {
          get: {
            url: '/app-info',
            headers: {
              Authorization: 'Bearer {{ token }}',
            },
          },
        },
      ],
    },
  ],
};

export function calculateMetrics(
  latencies: number[],
  totalRequests: number,
  successfulRequests: number,
  duration: number
): Partial<LoadTestResults> {
  const sorted = [...latencies].sort((a, b) => a - b);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  return {
    totalRequests,
    successfulRequests,
    failedRequests: totalRequests - successfulRequests,
    successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    minLatency: Math.min(...latencies),
    maxLatency: Math.max(...latencies),
    p95Latency: sorted[p95Index],
    p99Latency: sorted[p99Index],
    throughput: totalRequests / duration,
  };
}

export function validateResults(
  results: LoadTestResults,
  scenario: LoadTestScenario
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (results.averageLatency > scenario.expectedLatency) {
    violations.push(
      `Average latency ${results.averageLatency}ms exceeds expected ${scenario.expectedLatency}ms`
    );
  }

  if (results.successRate < scenario.expectedSuccessRate) {
    violations.push(
      `Success rate ${(results.successRate * 100).toFixed(2)}% below expected ${(scenario.expectedSuccessRate * 100).toFixed(2)}%`
    );
  }

  if (results.throughput < scenario.expectedRPS * 0.8) {
    violations.push(
      `Throughput ${results.throughput.toFixed(2)} RPS below expected ${scenario.expectedRPS} RPS`
    );
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
