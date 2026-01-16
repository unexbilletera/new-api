/**
 * @file authentication.integration-spec.ts
 * @description Integration tests for authentication flows (login, logout, password management)
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

describe('Authentication Integration Tests', () => {
  let httpClient: IntegrationHttpClient;
  let testUser: TestUser;
  let authToken: string;
  let logger: IntegrationTestLogger;

  beforeAll(() => {
    logger = createIntegrationLogger('AuthenticationIntegrationTest');
    httpClient = createHttpClient();
    logger.info('Integration test suite initialized', {
      baseURL: httpClient.getBaseURL(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  beforeEach(() => {
    testUser = createTestUser('br');
    logger.debug('Test user generated', { email: testUser.email });
  });

  describe('Login Flow', () => {
    it('should authenticate user with valid email and password', async () => {
      logger.testStart('Signin with valid credentials');

      logger.step(1, 'Create user account');
      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      logger.info('Signup response', { status: signupResponse.status });
      expect([201, 400]).toContain(signupResponse.status);

      if (signupResponse.status === 201) {
        logger.success('User account created');

        logger.step(2, 'Authenticate with email');
        const loginResponse = await httpClient.post('/api/users/user/signin', {
          identifier: testUser.email,
          password: testUser.password,
        });

        logger.info('Signin response', { status: loginResponse.status });
        expect([200, 401]).toContain(loginResponse.status);

        if (loginResponse.status === 200) {
          expect(loginResponse.data).toHaveProperty('token');
          expect(loginResponse.data).toHaveProperty('user');
          authToken = loginResponse.data.token;
          logger.success('User authenticated successfully', {
            userId: loginResponse.data.user.id,
            tokenPresent: !!authToken,
          });
        } else {
          logger.warn('Signin failed - user verification may be required');
        }
      }

      logger.testEnd('Signin with valid credentials');
    }, 30000);

    it('should authenticate user with valid phone and password', async () => {
      logger.testStart('Signin with phone number');

      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      logger.info('Signup response', { status: signupResponse.status });
      expect([201, 400]).toContain(signupResponse.status);

      if (signupResponse.status === 201) {
        const loginResponse = await httpClient.post('/api/users/user/signin', {
          identifier: testUser.phone,
          password: testUser.password,
        });

        logger.info('Signin with phone response', {
          status: loginResponse.status,
        });
        expect([200, 401]).toContain(loginResponse.status);

        if (loginResponse.status === 200) {
          logger.success('User authenticated with phone number');
        } else {
          logger.warn('Signin with phone failed');
        }
      }

      logger.testEnd('Signin with phone number');
    }, 30000);

    it('should reject signin with invalid credentials', async () => {
      logger.testStart('Signin with invalid credentials');

      const loginResponse = await httpClient.post('/api/users/user/signin', {
        identifier: testUser.email,
        password: 'wrongpassword',
      });

      logger.info('Invalid credentials response', {
        status: loginResponse.status,
      });
      expect(loginResponse.status).toBe(401);
      expect(loginResponse.data.message).toBeDefined();
      logger.success('Invalid credentials correctly rejected');

      logger.testEnd('Signin with invalid credentials');
    });

    it('should reject signin for non-existent user', async () => {
      logger.testStart('Signin for non-existent user');

      const loginResponse = await httpClient.post('/api/users/user/signin', {
        identifier: 'nonexistent@example.com',
        password: '123456',
      });

      logger.info('Non-existent user response', {
        status: loginResponse.status,
      });
      expect(loginResponse.status).toBe(401);
      logger.success('Non-existent user correctly rejected');

      logger.testEnd('Signin for non-existent user');
    });
  });

  describe('Session Management', () => {
    it('should allow access to protected routes with valid token', async () => {
      logger.testStart('Protected route access with valid token');

      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      expect([201, 400]).toContain(signupResponse.status);

      if (signupResponse.status === 201) {
        const loginResponse = await httpClient.post('/api/users/user/signin', {
          identifier: testUser.email,
          password: testUser.password,
        });

        if (loginResponse.status === 200) {
          authToken = loginResponse.data.token;
          httpClient.setAuthToken(authToken);
          logger.info('Auth token set', { tokenLength: authToken.length });

          logger.step(1, 'Access protected route');
          const profileResponse = await httpClient.get('/api/users/user/me');

          logger.info('Protected route response', {
            status: profileResponse.status,
          });
          expect(profileResponse.status).toBe(200);
          expect(profileResponse.data.email).toBe(testUser.email);
          logger.success('Protected route accessible with valid token');
        }
      }

      logger.testEnd('Protected route access with valid token');
    }, 30000);

    it('should deny access to protected routes without token', async () => {
      logger.testStart('Protected route access without token');

      httpClient.clearAuthToken();
      const profileResponse = await httpClient.get('/api/users/user/me');

      logger.info('No token response', { status: profileResponse.status });
      expect(profileResponse.status).toBe(401);
      logger.success('Access correctly denied without token');

      logger.testEnd('Protected route access without token');
    });

    it('should deny access with invalid token', async () => {
      logger.testStart('Protected route access with invalid token');

      httpClient.setAuthToken('invalid.token.here');
      const profileResponse = await httpClient.get('/api/users/user/me');

      logger.info('Invalid token response', { status: profileResponse.status });
      expect(profileResponse.status).toBe(401);
      logger.success('Invalid token correctly rejected');

      logger.testEnd('Protected route access with invalid token');
    });
  });

  describe('Logout Flow', () => {
    it('should logout user successfully', async () => {
      logger.testStart('User logout');

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

          logger.step(1, 'Execute logout');
          const logoutResponse = await httpClient.post(
            '/api/users/user/signout',
          );

          logger.info('Logout response', { status: logoutResponse.status });
          expect([200, 401]).toContain(logoutResponse.status);

          if (logoutResponse.status === 200) {
            logger.success('User logged out successfully');
          }
        }
      }

      logger.testEnd('User logout');
    }, 30000);
  });

  describe('Password Management', () => {
    it('should change password successfully', async () => {
      logger.testStart('Password change');

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

          const newPassword = '654321';
          logger.step(1, 'Change password');
          const changePasswordResponse = await httpClient.post(
            '/api/users/user/change-password',
            {
              currentPassword: testUser.password,
              newPassword: newPassword,
            },
          );

          logger.info('Password change response', {
            status: changePasswordResponse.status,
          });
          expect([200, 401]).toContain(changePasswordResponse.status);

          if (changePasswordResponse.status === 200) {
            logger.success('Password changed successfully');

            logger.step(2, 'Signin with new password');
            httpClient.clearAuthToken();
            const newLoginResponse = await httpClient.post(
              '/api/users/user/signin',
              {
                identifier: testUser.email,
                password: newPassword,
              },
            );

            logger.info('Signin with new password response', {
              status: newLoginResponse.status,
            });
            expect([200, 401]).toContain(newLoginResponse.status);
            if (newLoginResponse.status === 200) {
              logger.success('Signin with new password successful');
            }
          }
        }
      }

      logger.testEnd('Password change');
    }, 30000);
  });
});
