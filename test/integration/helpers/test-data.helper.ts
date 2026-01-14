/**
 * @file test-data.helper.ts
 * @description Test data generators for creating realistic user data in integration tests
 */

/**
 * Supported countries for test data generation
 */
export type Country = 'br' | 'ar';

/**
 * Test user data structure
 */
export interface TestUser {
  email: string;
  phone: string;
  password: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  document?: string;
  country?: Country;
}

/**
 * Generates test data for integration tests
 */
export class TestDataGenerator {
  /**
   * Generates a unique email address for testing
   * @returns Unique email string
   */
  static generateUniqueEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test.${timestamp}.${random}@unex-integration.com`;
  }

  /**
   * Generates a unique phone number for testing
   * @param country - Country code (br or ar)
   * @returns Formatted phone number with country code
   */
  static generateUniquePhone(country: Country = 'br'): string {
    const timestamp = Date.now().toString().slice(-8);
    if (country === 'br') {
      return `+55119${timestamp}`;
    }
    return `+54911${timestamp}`;
  }

  /**
   * Generates a 6-digit password
   * @returns 6-digit password string
   */
  static generatePassword(): string {
    return Math.random().toString().slice(-6);
  }

  /**
   * Generates a Brazilian CPF number (not validated, for testing only)
   * @returns 11-digit CPF string
   */
  static generateCPF(): string {
    return Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
  }

  /**
   * Generates a Brazilian CNPJ number (not validated, for testing only)
   * @returns 14-digit CNPJ string
   */
  static generateCNPJ(): string {
    return Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  }

  /**
   * Generates an Argentinian DNI number (not validated, for testing only)
   * @returns 8-digit DNI string
   */
  static generateDNI(): string {
    return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  }

  /**
   * Generates a random full name
   * @returns Full name string
   */
  static generateName(): string {
    const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Ferreira'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  }

  /**
   * Generates a random birthdate for users 18+ years old
   * @returns Birthdate in YYYY-MM-DD format
   */
  static generateBirthdate(): string {
    const year = 1980 + Math.floor(Math.random() * 25);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Creates a complete test user with all required fields
 * @param country - Country code for phone and document generation
 * @returns Complete test user object
 */
export const createTestUser = (country: Country = 'br'): TestUser => {
  const fullName = TestDataGenerator.generateName();
  const [firstName, lastName] = fullName.split(' ');

  return {
    email: TestDataGenerator.generateUniqueEmail(),
    phone: TestDataGenerator.generateUniquePhone(country),
    password: TestDataGenerator.generatePassword(),
    firstName,
    lastName,
    birthdate: TestDataGenerator.generateBirthdate(),
    document: country === 'br' ? TestDataGenerator.generateCPF() : TestDataGenerator.generateDNI(),
    country,
  };
};
