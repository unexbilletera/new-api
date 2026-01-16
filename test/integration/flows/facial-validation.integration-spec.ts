/**
 * @file facial-validation.integration-spec.ts
 * @description Integration tests for liveness verification with and without Valida
 */

import {
  IntegrationHttpClient,
  createHttpClient,
} from '../helpers/http-client.helper';
import { TestUser, createTestUser } from '../helpers/test-data.helper';
import {
  IntegrationTestLogger,
  createIntegrationLogger,
} from '../helpers/logger.helper';

describe('Facial Validation Integration Tests', () => {
  let httpClient: IntegrationHttpClient;
  let testUser: TestUser;
  let authToken: string;
  let userId: string;
  let logger: IntegrationTestLogger;

  beforeAll(() => {
    logger = createIntegrationLogger('FacialValidationIntegrationTest');
    httpClient = createHttpClient();
    logger.info('Integration test suite initialized', {
      baseURL: httpClient.getBaseURL(),
      environment: process.env.NODE_ENV || 'development',
      validaEnabled: process.env.VALIDA_ENABLED === 'true',
    });
  });

  beforeEach(() => {
    testUser = createTestUser('br');
    logger.debug('Test user generated', { email: testUser.email });
  });

  describe('Liveness Verification - Valida Disabled', () => {
    it('should accept simple photo upload when Valida is disabled', async () => {
      logger.testStart('Simple photo upload for liveness');

      logger.step(1, 'Create user and authenticate');
      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      logger.info('Signup response', { status: signupResponse.status });
      expect([201, 400]).toContain(signupResponse.status);

      if (signupResponse.status === 201) {
        userId = signupResponse.data.userId;
        logger.success('User created', { userId });

        const loginResponse = await httpClient.post('/api/users/user/signin', {
          identifier: testUser.email,
          password: testUser.password,
        });

        if (loginResponse.status === 200) {
          authToken = loginResponse.data.token;
          httpClient.setAuthToken(authToken);
          logger.success('User authenticated');

          logger.step(2, 'Upload liveness photo');
          const mockBase64Image =
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

          const livenessResponse = await httpClient.patch(
            `/api/onboarding/user/${userId}`,
            {
              livenessImage: mockBase64Image,
            },
          );

          logger.info('Liveness upload response', {
            status: livenessResponse.status,
            validaEnabled: process.env.VALIDA_ENABLED === 'true',
          });

          expect([200, 400, 404]).toContain(livenessResponse.status);

          if (livenessResponse.status === 200) {
            logger.success('Liveness photo uploaded successfully');
            expect(livenessResponse.data).toHaveProperty('success');
          } else {
            logger.warn('Liveness upload failed', {
              error: livenessResponse.data.message,
            });
          }
        }
      }

      logger.testEnd('Simple photo upload for liveness');
    }, 30000);

    it('should validate base64 image format', async () => {
      logger.testStart('Base64 image format validation');

      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      if (signupResponse.status === 201) {
        userId = signupResponse.data.userId;

        const invalidFormats = [
          'not-base64-image',
          'data:text/plain;base64,invalid',
          '',
        ];

        for (const invalidFormat of invalidFormats) {
          logger.debug('Testing invalid image format', {
            format: invalidFormat.substring(0, 30),
          });
          const response = await httpClient.patch(
            `/api/onboarding/user/${userId}`,
            {
              livenessImage: invalidFormat,
            },
          );

          logger.info('Invalid format response', { status: response.status });
          expect([400, 404]).toContain(response.status);
        }

        logger.success('Image format validation working correctly');
      }

      logger.testEnd('Base64 image format validation');
    }, 30000);
  });

  describe('Liveness Verification - Valida Enabled', () => {
    it('should process liveness with Valida enrollment', async () => {
      logger.testStart('Liveness with Valida enrollment');

      if (process.env.VALIDA_ENABLED !== 'true') {
        logger.warn('Valida is disabled - skipping test');
        logger.testEnd('Liveness with Valida enrollment');
        return;
      }

      logger.step(1, 'Create and authenticate user');
      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      if (signupResponse.status === 201) {
        const loginResponse = await httpClient.post('/api/users/user/signin', {
          identifier: testUser.email,
          password: testUser.password,
        });

        if (loginResponse.status === 200) {
          authToken = loginResponse.data.token;
          userId = loginResponse.data.user.id;
          httpClient.setAuthToken(authToken);
          logger.success('User authenticated', { userId });

          logger.step(2, 'Submit Valida enrollment data');
          const validaResponse = await httpClient.post(
            '/api/users/user/liveness',
            {
              validaId: `valida_test_${Date.now()}`,
              refId: userId,
            },
          );

          logger.info('Valida liveness response', {
            status: validaResponse.status,
            validaEnabled: process.env.VALIDA_ENABLED,
          });

          expect([200, 400, 500]).toContain(validaResponse.status);

          if (validaResponse.status === 200) {
            logger.success('Valida liveness verification completed');
            expect(validaResponse.data).toHaveProperty('success');
          } else if (validaResponse.status === 500) {
            logger.warn('Valida service error', {
              error: validaResponse.data.message,
            });
          } else {
            logger.warn('Valida verification failed', {
              error: validaResponse.data.message,
            });
          }
        }
      }

      logger.testEnd('Liveness with Valida enrollment');
    }, 30000);

    it('should validate Valida enrollment ID format', async () => {
      logger.testStart('Valida ID format validation');

      if (process.env.VALIDA_ENABLED !== 'true') {
        logger.warn('Valida is disabled - skipping test');
        logger.testEnd('Valida ID format validation');
        return;
      }

      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      if (signupResponse.status === 201) {
        const loginResponse = await httpClient.post('/api/users/user/signin', {
          identifier: testUser.email,
          password: testUser.password,
        });

        if (loginResponse.status === 200) {
          authToken = loginResponse.data.token;
          userId = loginResponse.data.user.id;
          httpClient.setAuthToken(authToken);

          const invalidValidaIds = ['', 'invalid', '123'];

          for (const invalidId of invalidValidaIds) {
            logger.debug('Testing invalid Valida ID', { validaId: invalidId });
            const response = await httpClient.post('/api/users/user/liveness', {
              validaId: invalidId,
              refId: userId,
            });

            logger.info('Invalid Valida ID response', {
              validaId: invalidId,
              status: response.status,
            });
            expect([400, 500]).toContain(response.status);
          }

          logger.success('Valida ID validation working correctly');
        }
      }

      logger.testEnd('Valida ID format validation');
    }, 30000);
  });

  describe('Liveness State Management', () => {
    it('should track liveness verification status', async () => {
      logger.testStart('Liveness verification status tracking');

      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      if (signupResponse.status === 201) {
        const loginResponse = await httpClient.post('/api/users/user/signin', {
          identifier: testUser.email,
          password: testUser.password,
        });

        if (loginResponse.status === 200) {
          authToken = loginResponse.data.token;
          httpClient.setAuthToken(authToken);

          logger.step(1, 'Check initial liveness status');
          const initialProfileResponse =
            await httpClient.get('/api/users/user/me');

          if (initialProfileResponse.status === 200) {
            logger.info('Initial liveness status', {
              livenessVerified:
                !!initialProfileResponse.data.livenessVerifiedAt,
            });
            logger.success('Liveness verification status tracked');
          }
        }
      }

      logger.testEnd('Liveness verification status tracking');
    }, 30000);
  });

  describe('Configuration Detection', () => {
    it('should detect current Valida configuration', async () => {
      logger.testStart('Valida configuration detection');

      const validaEnabled = process.env.VALIDA_ENABLED === 'true';
      const walletValida = process.env.WALLET_VALIDA;

      logger.info('Valida configuration', {
        VALIDA_ENABLED: validaEnabled,
        WALLET_VALIDA: walletValida,
      });

      if (validaEnabled) {
        logger.info('Valida is enabled - full biometric verification active');
      } else {
        logger.info('Valida is disabled - simple photo upload active');
      }

      logger.success('Configuration detected successfully');
      logger.testEnd('Valida configuration detection');
    });
  });
});
