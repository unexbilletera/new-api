/**
 * @file user.fixture.ts
 * @description Test fixtures for user-related tests
 * @module test/utils/fixtures
 * @category Test Utilities
 * @subcategory Fixtures
 *
 * @author Unex Development Team
 * @since 2.0.0
 *
 * @description
 * Provides reusable test data for user-related tests.
 * Includes mock users with various states (active, pending, locked, etc).
 */

/**
 * @description Standard test user - active status
 */
export const mockActiveUser = {
  id: 'user-123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+5511999999999',
  status: 'active',
  emailVerified: true,
  phoneVerified: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-13'),
};

/**
 * @description Test user - pending email verification
 */
export const mockPendingUser = {
  ...mockActiveUser,
  id: 'user-456',
  status: 'pending_email_verification',
  emailVerified: false,
};

/**
 * @description Test user - locked account
 */
export const mockLockedUser = {
  ...mockActiveUser,
  id: 'user-789',
  status: 'locked',
};

/**
 * @description Minimal user DTO for signup
 */
export const mockSignupDto = {
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+5511988888888',
};

/**
 * @description Minimal user DTO for signin
 */
export const mockSigninDto = {
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
};

/**
 * @description User profile update DTO
 */
export const mockUpdateUserProfileDto = {
  firstName: 'Jonathan',
  lastName: 'Smith',
  phone: '+5511977777777',
};

/**
 * @description User address DTO
 */
export const mockUserAddressDto = {
  street: 'Rua Exemplo',
  number: '123',
  complement: 'Apt 456',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310100',
  country: 'BR',
};

/**
 * @description User account object
 */
export const mockUserAccount = {
  id: 'account-123',
  userId: 'user-123',
  accountType: 'checking',
  accountNumber: '123456',
  bankCode: '001',
  alias: 'Minha Conta Corrente',
  isDefault: true,
  status: 'active',
  createdAt: new Date('2025-01-01'),
};

/**
 * @description User identity verification
 */
export const mockUserIdentity = {
  id: 'identity-123',
  userId: 'user-123',
  documentType: 'cpf',
  documentNumber: '12345678901',
  documentIssuer: 'SSP',
  issuedDate: new Date('2015-01-01'),
  expiryDate: new Date('2035-01-01'),
  isDefault: true,
  status: 'verified',
  verificationDate: new Date('2025-01-10'),
};
