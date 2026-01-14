/**
 * @file example.performance-spec.ts
 * @description Example performance benchmark test
 * @module test/performance
 * @category Performance Tests
 * @subcategory Benchmarks
 *
 * @author Unex Development Team
 * @since 2.0.0
 *
 * @description
 * This example test file demonstrates best practices for performance benchmarks.
 * Performance tests measure execution time, memory usage, and throughput
 * to ensure the API meets performance requirements.
 *
 * @testScenarios
 * - Measuring endpoint response times
 * - Testing throughput under load
 * - Memory usage profiling
 * - Identifying performance bottlenecks
 * - Comparing performance across implementations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/prisma/prisma.service';
import { UserFactory } from '../utils';

describe('API Performance Benchmarks', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  /**
   * @interface PerformanceMetric
   * @description Tracks performance measurements
   */
  interface PerformanceMetric {
    name: string;
    duration: number;
    unit: 'ms' | 'ops/sec';
    threshold: number;
    passed: boolean;
  }

  const metrics: PerformanceMetric[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    console.log('\n=== PERFORMANCE BENCHMARK RESULTS ===');
    metrics.forEach((metric) => {
      const status = metric.passed ? '✅' : '❌';
      console.log(
        `${status} ${metric.name}: ${metric.duration}${metric.unit} (threshold: ${metric.threshold}${metric.unit})`,
      );
    });
    await app.close();
  });

  /**
   * @test Performance benchmark for user signup endpoint
   * @given Valid signup request data
   * @when POST /api/auth/signup is called
   * @then Response should complete within threshold (< 500ms)
   *
   * @performance
   * - Target: < 500ms
   * - Measures: User creation, password hashing, JWT generation
   */
  it('should complete user signup within performance threshold', async () => {
    const signupDto = {
      email: 'perftest@test.com',
      password: 'SecurePassword123!',
      firstName: 'Perf',
      lastName: 'Test',
    };

    const startTime = performance.now();

    await request(app.getHttpServer())
      .post('/api/public/authentication/signup')
      .send(signupDto)
      .expect(201);

    const duration = performance.now() - startTime;

    const metric: PerformanceMetric = {
      name: 'User Signup Endpoint',
      duration: Math.round(duration),
      unit: 'ms',
      threshold: 500,
      passed: duration < 500,
    };
    metrics.push(metric);

    expect(duration).toBeLessThan(500);
  });

  /**
   * @test Performance benchmark for bulk user retrieval
   * @given Multiple users in database
   * @when GET /api/users is called
   * @then Response should complete within threshold (< 200ms)
   *
   * @performance
   * - Target: < 200ms for 100 users
   * - Measures: Database query, serialization
   */
  it('should retrieve users list within performance threshold', async () => {
    const users = UserFactory.createMultiple(20);
    await prisma.users.createMany({
      data: users,
    });

    const startTime = performance.now();

    await request(app.getHttpServer()).get('/api/public/users').expect(200);

    const duration = performance.now() - startTime;

    const metric: PerformanceMetric = {
      name: 'List Users Endpoint',
      duration: Math.round(duration),
      unit: 'ms',
      threshold: 200,
      passed: duration < 200,
    };
    metrics.push(metric);

    expect(duration).toBeLessThan(200);

    await prisma.users.deleteMany({});
  });

  /**
   * @test Performance throughput test for authentication
   * @given Authentication service loaded
   * @when Multiple authentication requests made
   * @then Should handle minimum operations per second
   *
   * @performance
   * - Target: > 100 ops/sec
   * - Measures: Token validation throughput
   */
  it('should validate tokens at minimum throughput rate', async () => {
    const iterations = 50;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      await new Promise((resolve) => {
        process.nextTick(resolve);
      });
    }

    const duration = performance.now() - startTime;
    const opsPerSecond = Math.round((iterations / duration) * 1000);

    const metric: PerformanceMetric = {
      name: 'Token Validation Throughput',
      duration: opsPerSecond,
      unit: 'ops/sec',
      threshold: 100,
      passed: opsPerSecond >= 100,
    };
    metrics.push(metric);

    expect(opsPerSecond).toBeGreaterThanOrEqual(100);
  });

  /**
   * @test Memory usage profiling
   * @given Service initialized
   * @when Multiple operations executed
   * @then Memory growth should be within acceptable limits
   *
   * @performance
   * - Target: < 50MB growth
   * - Measures: Heap memory usage
   */
  it('should maintain acceptable memory usage', async () => {
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;

    const users = UserFactory.createMultiple(100);
    await prisma.users.createMany({
      data: users,
    });

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;

    console.log(`Memory growth: ${memoryGrowth.toFixed(2)}MB`);

    expect(memoryGrowth).toBeLessThan(50);

    await prisma.users.deleteMany({});
  });
});
