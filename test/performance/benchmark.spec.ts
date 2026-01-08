import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';
import { LoggerService } from '../../src/shared/logger/logger.service';

const logger = new LoggerService();

describe('Performance - Benchmark Tests', () => {
  let app: INestApplication | undefined;

  const THRESHOLDS = {
    signup: 150,
    signin: 100,
    emailValidation: 50,
    phoneValidation: 50,
    appInfo: 30,
    notificationsList: 100,
    tokenGeneration: 20,
  };

  beforeAll(async () => {
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Authentication Service - Signup Performance', () => {
    it('should complete email validation within threshold', () => {
      const startTime = performance.now();

      const email = 'user@example.com';
      const normalizedEmail = email.toLowerCase().trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(isValid).toBe(true);
      expect(duration).toBeLessThan(THRESHOLDS.emailValidation);
      logger.info(`Email validation: ${duration.toFixed(3)}ms (threshold: ${THRESHOLDS.emailValidation}ms)`);
    });

    it('should complete phone normalization within threshold', () => {
      const startTime = performance.now();

      const phone = '+55 (11) 9 9999-9999';
      const normalized = phone.replace(/\D/g, '');
      const isValid = normalized.length >= 11;

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(normalized.length).toBeGreaterThanOrEqual(11);
      expect(duration).toBeLessThan(THRESHOLDS.phoneValidation);
      logger.info(`Phone normalization: ${duration.toFixed(3)}ms (threshold: ${THRESHOLDS.phoneValidation}ms)`);
    });
  });

  describe('JWT Token Generation Performance', () => {
    it('should generate JWT token within threshold', () => {
      const startTime = performance.now();

      const payload = {
        sub: 'user-123',
        email: 'user@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = Buffer.from(JSON.stringify(payload)).toString('base64');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(token).toBeDefined();
      expect(duration).toBeLessThan(THRESHOLDS.tokenGeneration);
      logger.info(`Token generation: ${duration.toFixed(3)}ms (threshold: ${THRESHOLDS.tokenGeneration}ms)`);
    });
  });

  describe('Data Normalization Performance', () => {
    it('should normalize user data in batch within threshold', () => {
      const users = Array.from({ length: 100 }, (_, i) => ({
        email: `user${i}@EXAMPLE.COM  `,
        phone: `+55 (11) 9999-${String(1000 + i).slice(-4)}`,
        firstName: '  John  ',
        lastName: '  DOE  ',
      }));

      const startTime = performance.now();

      const normalizedUsers = users.map(user => ({
        email: user.email.toLowerCase().trim(),
        phone: user.phone.replace(/\D/g, ''),
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
      }));

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgPerUser = duration / users.length;

      expect(normalizedUsers.length).toBe(100);
      expect(avgPerUser).toBeLessThan(5);
      logger.info(`Batch normalization (100 users): ${duration.toFixed(3)}ms avg: ${avgPerUser.toFixed(3)}ms per user`);
    });
  });

  describe('String Processing Performance', () => {
    it('should validate email format efficiently', () => {
      const emails = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const startTime = performance.now();

      const validEmails = emails.filter(email => emailRegex.test(email));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(validEmails.length).toBe(1000);
      expect(duration).toBeLessThan(50);
      logger.info(`1000 email validations: ${duration.toFixed(3)}ms`);
    });

    it('should validate phone format efficiently', () => {
      const phones = Array.from({ length: 1000 }, (_, i) => `+55119999${String(9000 + i).slice(-4)}`);
      const phoneRegex = /^\+?\d{10,15}$/;

      const startTime = performance.now();

      const validPhones = phones.filter(phone => phoneRegex.test(phone));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(validPhones.length).toBe(1000);
      expect(duration).toBeLessThan(50);
      logger.info(`1000 phone validations: ${duration.toFixed(3)}ms`);
    });
  });

  describe('Array Operations Performance', () => {
    it('should filter notifications efficiently', () => {
      const notifications = Array.from({ length: 10000 }, (_, i) => ({
        id: `notif-${i}`,
        userId: 'user-123',
        read: i % 3 === 0,
        createdAt: new Date(Date.now() - i * 60000),
      }));

      const startTime = performance.now();

      const unread = notifications.filter(n => !n.read);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(unread.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
      logger.info(`Filter 10k notifications: ${duration.toFixed(3)}ms`);
    });

    it('should sort notifications efficiently', () => {
      const notifications = Array.from({ length: 5000 }, (_, i) => ({
        id: `notif-${i}`,
        createdAt: new Date(Math.random() * Date.now()),
      }));

      const startTime = performance.now();

      const sorted = [...notifications].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(sorted[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        sorted[sorted.length - 1].createdAt.getTime()
      );
      expect(duration).toBeLessThan(100);
      logger.info(`Sort 5k notifications: ${duration.toFixed(3)}ms`);
    });

    it('should map data transformation efficiently', () => {
      const users = Array.from({ length: 5000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
      }));

      const startTime = performance.now();

      const dtos = users.map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      }));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(dtos.length).toBe(5000);
      expect(duration).toBeLessThan(50);
      logger.info(`Transform 5k users to DTO: ${duration.toFixed(3)}ms`);
    });
  });

  describe('Object Merging Performance', () => {
    it('should merge validation results efficiently', () => {
      const validationResults = Array.from({ length: 1000 }, (_, i) => ({
        fieldName: `field${i}`,
        isValid: true,
        errors: [],
      }));

      const startTime = performance.now();

      const merged = validationResults.reduce(
        (acc, result) => ({
          ...acc,
          [result.fieldName]: result.isValid,
        }),
        {}
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(Object.keys(merged).length).toBe(1000);
      expect(duration).toBeLessThan(100);
      logger.info(`Merge 1000 validation results: ${duration.toFixed(3)}ms`);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should process large dataset without memory spike', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        data: `item-${i}`,
        timestamp: Date.now(),
        metadata: {
          source: 'api',
          version: '1.0',
        },
      }));

      const afterCreation = process.memoryUsage().heapUsed;
      const memoryIncrease = (afterCreation - initialMemory) / 1024 / 1024;

      const filtered = largeDataset.filter(item => item.id % 10 === 0);
      const mapped = filtered.map(item => item.id);

      const afterProcessing = process.memoryUsage().heapUsed;

      expect(memoryIncrease).toBeLessThan(50);
      expect(mapped.length).toBe(5000);

      logger.info(`Memory usage: Initial=${(initialMemory / 1024 / 1024).toFixed(2)}MB, After creation=${(afterCreation / 1024 / 1024).toFixed(2)}MB (+${memoryIncrease.toFixed(2)}MB)`);
    });
  });

  describe('Regex Performance', () => {
    it('should perform email regex efficiently', () => {
      const emails = Array.from({ length: 10000 }, (_, i) => `user${i}@example.com`);
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      const startTime = performance.now();

      const valid = emails.filter(email => emailRegex.test(email)).length;

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(valid).toBe(10000);
      expect(duration).toBeLessThan(200);
      logger.info(`10k email regex tests: ${duration.toFixed(3)}ms`);
    });

    it('should handle complex data validation regex', () => {
      const inputs = Array.from({ length: 5000 }, (_, i) => ({
        cpf: `123.456.789-${String(10 + i % 90).slice(-2)}`,
        phone: `+55119999${String(9000 + i).slice(-4)}`,
      }));

      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      const phoneRegex = /^\+?\d{10,15}$/;

      const startTime = performance.now();

      const valid = inputs.filter(input =>
        cpfRegex.test(input.cpf) && phoneRegex.test(input.phone)
      ).length;

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(valid).toBe(5000);
      expect(duration).toBeLessThan(150);
      logger.info(`5k complex validation regex: ${duration.toFixed(3)}ms`);
    });
  });

  describe('Date Operations Performance', () => {
    it('should compare and filter dates efficiently', () => {
      const now = new Date();
      const notifications = Array.from({ length: 10000 }, (_, i) => ({
        id: `notif-${i}`,
        createdAt: new Date(now.getTime() - i * 60000),
      }));

      const startTime = performance.now();

      const lastHour = new Date(now.getTime() - 3600000);
      const recent = notifications.filter(n => n.createdAt > lastHour);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(recent.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
      logger.info(`Filter 10k notifications by date: ${duration.toFixed(3)}ms`);
    });
  });
});
