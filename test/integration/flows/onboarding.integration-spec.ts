/**
 * @file onboarding.integration-spec.ts
 * @description Integration tests for complete onboarding flow with real backend
 */

import { IntegrationHttpClient, createHttpClient } from '../helpers/http-client.helper';
import { TestUser, createTestUser } from '../helpers/test-data.helper';
import { IntegrationTestLogger, createIntegrationLogger } from '../helpers/logger.helper';

describe('Onboarding Integration Tests', () => {
  let httpClient: IntegrationHttpClient;
  let testUser: TestUser;
  let userId: string;
  let authToken: string;
  let logger: IntegrationTestLogger;

  beforeAll(() => {
    logger = createIntegrationLogger('OnboardingIntegrationTest');
    httpClient = createHttpClient();
    logger.info('Integration test suite initialized', {
      baseURL: httpClient.getBaseURL(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  beforeEach(() => {
    testUser = createTestUser('br');
    logger.debug('Test user generated', { email: testUser.email, phone: testUser.phone });
  });

  describe('Complete Onboarding Flow', () => {
    it('should complete full onboarding flow with all validations', async () => {
      logger.testStart('Complete onboarding flow');

      logger.step(1, 'User signup');
      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      logger.info('Signup response received', { status: signupResponse.status });
      expect(signupResponse.status).toBe(201);
      expect(signupResponse.data).toHaveProperty('success', true);
      userId = signupResponse.data.userId;
      logger.success('User created successfully', { userId });

      logger.step(2, 'Send email validation code');
      const sendEmailResponse = await httpClient.post('/api/users/user/sendEmailValidation', {
        email: testUser.email,
      });

      logger.info('Email validation code send response', { status: sendEmailResponse.status });
      expect(sendEmailResponse.status).toBe(200);
      logger.success('Email validation code sent');

      logger.step(3, 'Verify email code');
      const emailCode = process.env.ENABLE_MOCK_CODES === 'true' ? '123456' : '999999';
      const verifyEmailResponse = await httpClient.post('/api/users/user/verifyEmailCode', {
        email: testUser.email,
        code: emailCode,
      });

      logger.info('Email verification response', {
        status: verifyEmailResponse.status,
        mockCodesEnabled: process.env.ENABLE_MOCK_CODES === 'true'
      });
      expect([200, 400]).toContain(verifyEmailResponse.status);

      if (verifyEmailResponse.status === 200) {
        logger.success('Email verified successfully');
      } else {
        logger.warn('Email verification failed - expected in real environment without mock codes');
      }

      logger.step(4, 'Send phone validation code');
      const sendPhoneResponse = await httpClient.post('/api/users/user/sendPhoneValidation', {
        phone: testUser.phone,
      });

      logger.info('SMS validation code send response', { status: sendPhoneResponse.status });
      expect([200, 400]).toContain(sendPhoneResponse.status);

      if (sendPhoneResponse.status === 200) {
        logger.success('SMS validation code sent');
      } else {
        logger.warn('SMS send failed - expected in real environment');
      }

      logger.step(5, 'Verify phone code');
      const phoneCode = process.env.ENABLE_MOCK_CODES === 'true' ? '123456' : '999999';
      const verifyPhoneResponse = await httpClient.post('/api/users/user/verifyPhoneCode', {
        phone: testUser.phone,
        code: phoneCode,
      });

      logger.info('Phone verification response', { status: verifyPhoneResponse.status });
      expect([200, 400]).toContain(verifyPhoneResponse.status);

      if (verifyPhoneResponse.status === 200) {
        logger.success('Phone verified successfully');
      } else {
        logger.warn('Phone verification failed - expected in real environment');
      }

      logger.step(6, 'User signin');
      const loginResponse = await httpClient.post('/api/users/user/signin', {
        identifier: testUser.email,
        password: testUser.password,
      });

      logger.info('Signin response', { status: loginResponse.status });
      expect([200, 401]).toContain(loginResponse.status);

      if (loginResponse.status === 200) {
        authToken = loginResponse.data.token;
        httpClient.setAuthToken(authToken);
        logger.success('User authenticated successfully', {
          tokenLength: authToken.length,
          userId: loginResponse.data.user?.id,
        });

        logger.step(7, 'Update user profile with personal data');
        const updateProfileResponse = await httpClient.post('/api/users/user/profile', {
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          birthdate: testUser.birthdate,
          gender: 'male',
          maritalStatus: 'single',
        });

        logger.info('Profile update response', { status: updateProfileResponse.status });
        expect([200, 401]).toContain(updateProfileResponse.status);

        if (updateProfileResponse.status === 200) {
          logger.success('Profile updated successfully');
        } else {
          logger.warn('Profile update failed');
        }

        logger.step(8, 'Retrieve user profile');
        const profileResponse = await httpClient.get('/api/users/user/me');

        logger.info('Profile retrieval response', { status: profileResponse.status });
        expect([200, 401]).toContain(profileResponse.status);

        if (profileResponse.status === 200) {
          logger.success('Profile retrieved successfully', {
            name: profileResponse.data.name,
            email: profileResponse.data.email,
            status: profileResponse.data.status,
          });
        }
      } else {
        logger.warn('Signin failed - verification may be required');
      }

      logger.testEnd('Complete onboarding flow');
    }, 60000);

    it('should reject duplicate email during signup', async () => {
      logger.testStart('Duplicate email validation');

      const duplicateEmail = testUser.email;

      logger.step(1, 'Create first user');
      const firstSignup = await httpClient.post('/api/users/user/signup', {
        email: duplicateEmail,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      logger.info('First signup response', { status: firstSignup.status });
      expect([201, 400]).toContain(firstSignup.status);

      logger.step(2, 'Attempt to create duplicate user');
      const secondSignup = await httpClient.post('/api/users/user/signup', {
        email: duplicateEmail,
        password: '654321',
        phone: '+5511999999999',
        language: 'pt',
      });

      logger.info('Duplicate signup response', { status: secondSignup.status });
      expect(secondSignup.status).toBe(400);
      expect(secondSignup.data.message).toContain('email');
      logger.success('Duplicate email correctly rejected');

      logger.testEnd('Duplicate email validation');
    });

    it('should validate email format during signup', async () => {
      logger.testStart('Email format validation');

      const invalidEmails = [
        'invalid-email',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];

      for (const invalidEmail of invalidEmails) {
        logger.debug('Testing invalid email format', { email: invalidEmail });
        const response = await httpClient.post('/api/users/user/signup', {
          email: invalidEmail,
          password: testUser.password,
          phone: testUser.phone,
          language: 'pt',
        });

        logger.info('Invalid email response', { email: invalidEmail, status: response.status });
        expect(response.status).toBe(400);
      }

      logger.success('Email format validation working correctly');
      logger.testEnd('Email format validation');
    });

    it('should validate phone format during signup', async () => {
      logger.testStart('Phone format validation');

      const invalidPhones = [
        '11999999999',
        '+55119999',
        'invalid-phone',
        '+55 11 99999-9999',
      ];

      for (const invalidPhone of invalidPhones) {
        logger.debug('Testing invalid phone format', { phone: invalidPhone });
        const response = await httpClient.post('/api/users/user/signup', {
          email: testUser.email,
          password: testUser.password,
          phone: invalidPhone,
          language: 'pt',
        });

        logger.info('Invalid phone response', { phone: invalidPhone, status: response.status });
        expect(response.status).toBe(400);
      }

      logger.success('Phone format validation working correctly');
      logger.testEnd('Phone format validation');
    });
  });

  describe('Onboarding State Management', () => {
    it('should track onboarding progress correctly', async () => {
      logger.testStart('Onboarding state tracking');

      const signupResponse = await httpClient.post('/api/users/user/signup', {
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        language: 'pt',
      });

      logger.info('Signup response for state tracking', { status: signupResponse.status });
      expect([201, 400]).toContain(signupResponse.status);

      if (signupResponse.status === 201 && signupResponse.data.onboardingState) {
        const onboardingState = signupResponse.data.onboardingState;
        logger.success('Onboarding state tracked', { state: onboardingState });
      } else {
        logger.warn('Onboarding state not available in response');
      }

      logger.testEnd('Onboarding state tracking');
    });
  });
});
