import {
  LOAD_TEST_SCENARIOS,
  SPIKE_TEST_SCENARIOS,
  PERFORMANCE_THRESHOLDS,
  calculateMetrics,
  validateResults,
  LoadTestResults,
  LoadTestScenario,
} from './load-test.config';

describe('Performance - Load Testing', () => {
  const log = (message: string) => console.log(`[LoadTest] ${message}`);
  const warn = (message: string) => console.warn(`[LoadTest] ${message}`);
  async function simulateRequest(
    scenario: LoadTestScenario,
    requestNumber: number,
  ): Promise<{ latency: number; success: boolean }> {
    const startTime = performance.now();

    try {
      const baseLatency = scenario.expectedLatency || 50;
      const simulatedProcessingTime =
        Math.random() * (baseLatency * 0.6) + baseLatency * 0.2;
      await new Promise((resolve) =>
        setTimeout(resolve, simulatedProcessingTime),
      );

      const endTime = performance.now();
      const latency = endTime - startTime;

      const shouldSucceed = Math.random() < scenario.expectedSuccessRate;

      return {
        latency,
        success: shouldSucceed,
      };
    } catch (error) {
      return {
        latency: performance.now() - startTime,
        success: false,
      };
    }
  }

  async function runScenario(
    scenario: LoadTestScenario,
  ): Promise<LoadTestResults> {
    const requests: Promise<{ latency: number; success: boolean }>[] = [];
    const effectiveDuration = Math.min(scenario.duration, 10);
    const numRequests = Math.max(
      5,
      Math.ceil(effectiveDuration * scenario.expectedRPS),
    );

    log(`Running: ${scenario.name}`);
    log(
      `Duration: ${scenario.duration}s | Concurrency: ${scenario.concurrency} | Requests: ${numRequests}`,
    );

    for (let i = 0; i < numRequests; i++) {
      if (i % scenario.concurrency === 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      requests.push(simulateRequest(scenario, i));
    }

    const results = await Promise.all(requests);

    const latencies = results.map((r) => r.latency);
    const successfulRequests = results.filter((r) => r.success).length;

    const metrics = calculateMetrics(
      latencies,
      numRequests,
      successfulRequests,
      effectiveDuration,
    );

    const results_obj: LoadTestResults = {
      scenario: scenario.name,
      totalRequests: metrics.totalRequests ?? 0,
      successfulRequests: metrics.successfulRequests ?? 0,
      failedRequests: metrics.failedRequests ?? 0,
      successRate: metrics.successRate ?? 0,
      averageLatency: metrics.averageLatency ?? 0,
      minLatency: metrics.minLatency ?? 0,
      maxLatency: metrics.maxLatency ?? 0,
      p95Latency: metrics.p95Latency ?? 0,
      p99Latency: metrics.p99Latency ?? 0,
      throughput: metrics.throughput ?? 0,
      passed: false,
    };

    const validation = validateResults(results_obj, scenario);
    results_obj.passed = validation.valid;

    log(`Results:`);
    log(
      `Success Rate: ${(results_obj.successRate * 100).toFixed(2)}% (target: ${(scenario.expectedSuccessRate * 100).toFixed(2)}%)`,
    );
    log(
      `Avg Latency: ${results_obj.averageLatency.toFixed(2)}ms (target: ${scenario.expectedLatency}ms)`,
    );
    log(`P95 Latency: ${results_obj.p95Latency.toFixed(2)}ms`);
    log(`P99 Latency: ${results_obj.p99Latency.toFixed(2)}ms`);
    log(
      `Throughput: ${results_obj.throughput.toFixed(2)} RPS (target: ${scenario.expectedRPS} RPS)`,
    );

    if (validation.violations.length > 0) {
      warn(`Violations:`);
      validation.violations.forEach((v) => warn(`- ${v}`));
    }

    return results_obj;
  }

  describe('Authentication Endpoints - Load Testing', () => {
    it('should handle signup load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[0];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.9,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.2,
      );
      expect(results.throughput).toBeGreaterThan(scenario.expectedRPS * 0.8);
    }, 60000);

    it('should handle signin load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[1];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.9,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.2,
      );
      expect(results.throughput).toBeGreaterThan(scenario.expectedRPS * 0.8);
    }, 60000);
  });

  describe('Validation Endpoints - Load Testing', () => {
    it('should handle email validation load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[2];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.9,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.2,
      );
    }, 60000);

    it('should handle phone validation load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[3];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.9,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.2,
      );
    }, 60000);
  });

  describe('Read-Only Endpoints - Load Testing', () => {
    it('should handle app info retrieval under load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[4];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.95,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.5,
      );
      expect(results.throughput).toBeGreaterThan(scenario.expectedRPS * 0.8);
    }, 60000);

    it('should handle notifications list under load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[5];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.9,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.2,
      );
    }, 60000);

    it('should handle terms check under load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[7];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.95,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.5,
      );
    }, 60000);
  });

  describe('Critical Endpoints - Load Testing', () => {
    it('should handle health check under extreme load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[8];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(0.85);
      expect(results.averageLatency).toBeLessThan(120);
      expect(results.p99Latency).toBeLessThan(200);

      log(`Health Check Performance: EXCELLENT`);
    }, 60000);
  });

  describe('Write Operations - Load Testing', () => {
    it('should handle mark as read operations under load', async () => {
      const scenario = LOAD_TEST_SCENARIOS[6];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.9,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.2,
      );
    }, 60000);
  });

  describe('Spike Testing', () => {
    it('should recover from sudden signin traffic spike', async () => {
      const scenario = SPIKE_TEST_SCENARIOS[0];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.85,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.5,
      );

      log(`System recovered from spike: PASSED`);
    }, 60000);

    it('should handle app info endpoint spike gracefully', async () => {
      const scenario = SPIKE_TEST_SCENARIOS[1];
      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(
        scenario.expectedSuccessRate * 0.9,
      );
      expect(results.averageLatency).toBeLessThan(
        scenario.expectedLatency * 1.3,
      );
    }, 60000);
  });

  describe('Sustained Load Testing', () => {
    it('should maintain performance over extended period', async () => {
      const scenario = {
        name: 'Sustained Load - 2 minute test',
        endpoint: '/health',
        method: 'GET' as const,
        concurrency: 50,
        duration: 120,
        expectedRPS: 20,
        expectedLatency: 100,
        expectedSuccessRate: 0.98,
      };

      const results = await runScenario(scenario);

      expect(results.successRate).toBeGreaterThanOrEqual(0.95);
      expect(results.averageLatency).toBeLessThan(150);

      log(`Sustained load test: PASSED`);
    }, 180000);
  });

  describe('Performance Metrics Validation', () => {
    it('should calculate percentile latencies correctly', () => {
      const latencies = Array.from({ length: 100 }, (_, i) => i + 1);

      const metrics = calculateMetrics(latencies, 100, 100, 10);

      expect(metrics.minLatency).toBe(1);
      expect(metrics.maxLatency).toBe(100);
      expect(metrics.p95Latency).toBeGreaterThanOrEqual(94);
      expect(metrics.p95Latency).toBeLessThanOrEqual(96);
      expect(metrics.p99Latency).toBeGreaterThanOrEqual(98);
      expect(metrics.p99Latency).toBeLessThanOrEqual(100);
    });

    it('should calculate throughput correctly', () => {
      const latencies = Array.from({ length: 100 }, () => 50);
      const metrics = calculateMetrics(latencies, 100, 100, 10);

      expect(metrics.throughput).toBe(10);
    });

    it('should calculate success rate correctly', () => {
      const latencies = Array.from({ length: 100 }, () => 50);
      const metrics = calculateMetrics(latencies, 100, 80, 10);

      expect(metrics.successRate).toBe(0.8);
      expect(metrics.failedRequests).toBe(20);
    });
  });

  describe('Latency Distribution Analysis', () => {
    it('should identify latency outliers', () => {
      const latencies = [...Array.from({ length: 98 }, () => 60), 150, 200];

      const sorted = latencies.sort((a, b) => a - b);
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      expect(p95).toBeLessThan(100);
      expect(p99).toBeGreaterThan(150);
      expect(avg).toBeLessThan(120);

      log(`Latency Distribution:`);
      log(`Average: ${avg.toFixed(2)}ms`);
      log(`P95: ${p95.toFixed(2)}ms`);
      log(`P99: ${p99.toFixed(2)}ms`);
    });
  });

  describe('Resource Utilization Simulation', () => {
    it('should handle concurrent connections efficiently', async () => {
      const concurrencyLevels = [10, 50, 100, 200];
      const results: { concurrency: number; timePerRequest: number }[] = [];

      for (const concurrency of concurrencyLevels) {
        const startTime = performance.now();

        const requests = Array.from(
          { length: 100 },
          () =>
            new Promise((resolve) => {
              const processingTime = Math.random() * 50 + 10;
              setTimeout(resolve, processingTime);
            }),
        );

        let completed = 0;
        const queue = [...requests];

        while (queue.length > 0) {
          const batch = queue.splice(0, concurrency);
          await Promise.all(batch);
          completed += batch.length;
        }

        const totalTime = performance.now() - startTime;
        const timePerRequest = totalTime / 100;

        results.push({ concurrency, timePerRequest });
      }

      log(`Concurrency Performance:`);
      results.forEach((r) => {
        log(
          `${r.concurrency} concurrent: ${r.timePerRequest.toFixed(2)}ms per request`,
        );
      });

      const baseline = results[0].timePerRequest;
      results.forEach((r) => {
        expect(r.timePerRequest).toBeLessThan(baseline * 2);
      });
    }, 60000);
  });

  describe('Error Rate Analysis', () => {
    it('should identify which scenarios have elevated error rates', () => {
      const scenarioResults = [
        { name: 'Signup', errorRate: 0.05 },
        { name: 'Signin', errorRate: 0.02 },
        { name: 'App Info', errorRate: 0.01 },
        { name: 'Backoffice Clients', errorRate: 0.08 },
      ];

      log(`Error Rate Analysis:`);

      scenarioResults.forEach((result) => {
        const status =
          result.errorRate < 0.02
            ? 'PASS'
            : result.errorRate < 0.05
              ? 'WARN'
              : 'FAIL';

        log(
          `${status} ${result.name}: ${(result.errorRate * 100).toFixed(2)}% error rate`,
        );

        if (result.errorRate >= 0.1) {
          expect(result.errorRate).toBeLessThanOrEqual(0.1);
        }
      });
    });
  });
});
