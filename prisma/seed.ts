import { PrismaClient } from '../generated/prisma';
import { Decimal } from '../generated/prisma/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';

class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);
  private readonly prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async seed(): Promise<void> {
    try {
      this.logger.log('Starting database seed');
      await this.prisma.$connect();

      await this.cleanupDatabase();
      await this.createBackofficeRoles();
      await this.createBackofficeUsers();
      await this.createCategories();
      await this.createUsers();
      await this.createUserIdentities();
      await this.createStores();
      await this.createStoresCategories();
      await this.createBranches();
      await this.createBenefits();
      await this.createSailpoints();
      await this.createUserAccounts();
      await this.createDevices();
      await this.createCards();
      await this.createContacts();
      await this.createCreditTypes();
      await this.createCredits();
      await this.createTransactions();
      await this.createTransactionLogs();
      await this.createRampOperations();
      await this.createAccreditations();

      this.logger.log('Database seed completed successfully');
    } catch (error) {
      this.logger.error('Error during seeding', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async cleanupDatabase(): Promise<void> {
    this.logger.log('Cleaning up existing data');

    await this.prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

    await this.prisma.transactionsWsLogs.deleteMany();
    await this.prisma.transactionsLogs.deleteMany();
    await this.prisma.transactions.deleteMany();
    await this.prisma.ramp_operations.deleteMany();
    await this.prisma.accreditations.deleteMany();
    await this.prisma.credits.deleteMany();
    await this.prisma.cards.deleteMany();
    await this.prisma.devices.deleteMany();
    await this.prisma.contacts.deleteMany();
    await this.prisma.usersIdentitiesGrants.deleteMany();
    await this.prisma.usersAccounts.deleteMany();
    await this.prisma.benefits.deleteMany();
    await this.prisma.sailpoints.deleteMany();
    await this.prisma.branches.deleteMany();
    await this.prisma.storesCategories.deleteMany();
    await this.prisma.stores.deleteMany();
    await this.prisma.usersIdentities.deleteMany();
    await this.prisma.categories.deleteMany();
    await this.prisma.creditsTypes.deleteMany();
    await this.prisma.users.deleteMany();
    await this.prisma.backofficeLogs.deleteMany();
    await this.prisma.backofficeUsers.deleteMany();
    await this.prisma.backofficeRoles.deleteMany();
    await this.prisma.challenges.deleteMany();

    await this.prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

    this.logger.log('Data cleaned up');
  }

  private async createBackofficeRoles(): Promise<void> {
    this.logger.log('Creating backoffice roles');

    await this.prisma.backofficeRoles.create({
      data: {
        id: uuidv4(),
        name: 'Admin',
        description: 'Administrator with full access',
        level: 100,
      },
    });

    await this.prisma.backofficeRoles.create({
      data: {
        id: uuidv4(),
        name: 'Support',
        description: 'Support team member',
        level: 50,
      },
    });
  }

  private async createBackofficeUsers(): Promise<void> {
    this.logger.log('Creating backoffice users');

    const adminRole = await this.prisma.backofficeRoles.findFirst({
      where: { name: 'Admin' },
    });

    const supportRole = await this.prisma.backofficeRoles.findFirst({
      where: { name: 'Support' },
    });

    await this.prisma.backofficeUsers.create({
      data: {
        id: uuidv4(),
        name: 'Admin User',
        email: 'admin@unex.com',
        password: 'hashed_password_here',
        roleId: adminRole.id,
        status: 'active',
      },
    });

    await this.prisma.backofficeUsers.create({
      data: {
        id: uuidv4(),
        name: 'Support User',
        email: 'support@unex.com',
        password: 'hashed_password_here',
        roleId: supportRole.id,
        status: 'active',
      },
    });
  }

  private async createCategories(): Promise<void> {
    this.logger.log('Creating categories');

    await this.prisma.categories.create({
      data: {
        id: uuidv4(),
        name: 'Technology',
        status: 'enable',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.categories.create({
      data: {
        id: uuidv4(),
        name: 'Food & Beverages',
        status: 'enable',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createUsers(): Promise<void> {
    this.logger.log('Creating users');

    await this.prisma.users.create({
      data: {
        id: uuidv4(),
        status: 'enable',
        access: 'user',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'hashed_password',
        phone: '+5491123456789',
        firstName: 'John',
        lastName: 'Doe',
        country: 'AR',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.users.create({
      data: {
        id: uuidv4(),
        status: 'enable',
        access: 'user',
        name: 'Jane Smith',
        email: 'jane@example.com',
        username: 'janesmith',
        password: 'hashed_password',
        phone: '+5491187654321',
        firstName: 'Jane',
        lastName: 'Smith',
        country: 'BR',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createUserIdentities(): Promise<void> {
    this.logger.log('Creating user identities');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const user2 = await this.prisma.users.findFirst({
      where: { email: 'jane@example.com' },
    });

    await this.prisma.usersIdentities.create({
      data: {
        id: uuidv4(),
        userId: user1.id,
        status: 'enable',
        type: 'personal',
        country: 'ar',
        taxDocumentType: 'DNI',
        taxDocumentNumber: '12345678',
        identityDocumentType: 'DNI',
        identityDocumentNumber: '12345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.usersIdentities.create({
      data: {
        id: uuidv4(),
        userId: user2.id,
        status: 'enable',
        type: 'personal',
        country: 'br',
        taxDocumentType: 'CPF',
        taxDocumentNumber: '98765432100',
        identityDocumentType: 'CPF',
        identityDocumentNumber: '98765432100',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createStores(): Promise<void> {
    this.logger.log('Creating stores');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const user2 = await this.prisma.users.findFirst({
      where: { email: 'jane@example.com' },
    });

    const identity1 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user1.id },
    });

    const identity2 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user2.id },
    });

    await this.prisma.stores.create({
      data: {
        id: uuidv4(),
        userId: user1.id,
        userIdentityId: identity1.id,
        status: 'enable',
        name: 'Tech Store Downtown',
        phone: '+5491123456789',
        email: 'techstore@example.com',
        address1: '123 Main St',
        address2: 'Suite 100',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.stores.create({
      data: {
        id: uuidv4(),
        userId: user2.id,
        userIdentityId: identity2.id,
        status: 'enable',
        name: 'Food Court',
        phone: '+5491187654321',
        email: 'foodcourt@example.com',
        address1: '456 Food Ave',
        address2: 'Level 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createStoresCategories(): Promise<void> {
    this.logger.log('Creating store categories');

    const store1 = await this.prisma.stores.findFirst({
      where: { name: 'Tech Store Downtown' },
    });

    const store2 = await this.prisma.stores.findFirst({
      where: { name: 'Food Court' },
    });

    const techCategory = await this.prisma.categories.findFirst({
      where: { name: 'Technology' },
    });

    const foodCategory = await this.prisma.categories.findFirst({
      where: { name: 'Food & Beverages' },
    });

    await this.prisma.storesCategories.create({
      data: {
        id: uuidv4(),
        storeId: store1.id,
        categoryId: techCategory.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.storesCategories.create({
      data: {
        id: uuidv4(),
        storeId: store2.id,
        categoryId: foodCategory.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createBranches(): Promise<void> {
    this.logger.log('Creating branches');

    const store1 = await this.prisma.stores.findFirst({
      where: { name: 'Tech Store Downtown' },
    });

    await this.prisma.branches.create({
      data: {
        id: uuidv4(),
        storeId: store1.id,
        status: 'enable',
        name: 'Downtown Branch',
        phone: '+5491123456789',
        email: 'downtown@techstore.com',
        address1: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createBenefits(): Promise<void> {
    this.logger.log('Creating benefits');

    const store1 = await this.prisma.stores.findFirst({
      where: { name: 'Tech Store Downtown' },
    });

    await this.prisma.benefits.create({
      data: {
        id: uuidv4(),
        storeId: store1.id,
        status: 'enable',
        type: 'amount',
        name: '10% Tech Discount',
        value: new Decimal('10.00'),
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        validMonday: true,
        validTuesday: true,
        validWednesday: true,
        validThursday: true,
        validFriday: true,
        validSaturday: true,
        validSunday: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createSailpoints(): Promise<void> {
    this.logger.log('Creating sailpoints');

    const store1 = await this.prisma.stores.findFirst({
      where: { name: 'Tech Store Downtown' },
    });

    const branch1 = await this.prisma.branches.findFirst({
      where: { name: 'Downtown Branch' },
    });

    await this.prisma.sailpoints.create({
      data: {
        id: uuidv4(),
        storeId: store1.id,
        branchId: branch1.id,
        status: 'enable',
        name: 'Main Sailpoint',
        notes: 'Primary sailpoint for transaction routing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createUserAccounts(): Promise<void> {
    this.logger.log('Creating user accounts');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const user2 = await this.prisma.users.findFirst({
      where: { email: 'jane@example.com' },
    });

    const identity1 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user1.id },
    });

    const identity2 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user2.id },
    });

    await this.prisma.usersAccounts.create({
      data: {
        id: uuidv4(),
        userId: user1.id,
        userIdentityId: identity1.id,
        status: 'enable',
        type: 'bind',
        balance: new Decimal('5000.00'),
        accountNumber: '123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.usersAccounts.create({
      data: {
        id: uuidv4(),
        userId: user2.id,
        userIdentityId: identity2.id,
        status: 'enable',
        type: 'bind',
        balance: new Decimal('8000.00'),
        accountNumber: '987654321',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createDevices(): Promise<void> {
    this.logger.log('Creating devices');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    await this.prisma.devices.create({
      data: {
        id: uuidv4(),
        userId: user1.id,
        status: 'active',
        deviceIdentifier: 'device-123-abc',
        publicKeyPem:
          '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----',
        keyType: 'RSA',
        platform: 'ios',
      },
    });
  }

  private async createCards(): Promise<void> {
    this.logger.log('Creating cards');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const user2 = await this.prisma.users.findFirst({
      where: { email: 'jane@example.com' },
    });

    const identity1 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user1.id },
    });

    const identity2 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user2.id },
    });

    await this.prisma.cards.create({
      data: {
        id: uuidv4(),
        userId: user1.id,
        userIdentityId: identity1.id,
        status: 'enable',
        type: 'credit',
        brand: 'visa',
        reference: 'VISA_4111',
        pan: '4111111111111111',
        name: 'John Visa Card',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.cards.create({
      data: {
        id: uuidv4(),
        userId: user2.id,
        userIdentityId: identity2.id,
        status: 'enable',
        type: 'debit',
        brand: 'master',
        reference: 'MC_5555',
        pan: '5555555555554444',
        name: 'Jane MasterCard',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createContacts(): Promise<void> {
    this.logger.log('Creating contacts');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const user2 = await this.prisma.users.findFirst({
      where: { email: 'jane@example.com' },
    });

    await this.prisma.contacts.create({
      data: {
        id: uuidv4(),
        userId: user1.id,
        contactUserId: user2.id,
        status: 'enable',
        type: 'internal',
        name: 'Jane (Contact)',
        email: 'jane@example.com',
        phone: '+5491187654321',
        alias: 'jane.contact',
        cbu: '1111111111111111111111',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createCreditTypes(): Promise<void> {
    this.logger.log('Creating credit types');

    await this.prisma.creditsTypes.create({
      data: {
        id: uuidv4(),
        name: 'Standard Credit',
        amount: new Decimal('10000.00'),
        status: 'enable',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createCredits(): Promise<void> {
    this.logger.log('Creating credits');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const identity1 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user1.id },
    });

    const account1 = await this.prisma.usersAccounts.findFirst({
      where: { userId: user1.id },
    });

    const creditType = await this.prisma.creditsTypes.findFirst({
      where: { name: 'Standard Credit' },
    });

    await this.prisma.credits.create({
      data: {
        id: uuidv4(),
        date: new Date(),
        userId: user1.id,
        userIdentityId: identity1.id,
        userAccountId: account1.id,
        creditTypeId: creditType.id,
        amount: new Decimal('5000.00'),
        sealed: new Decimal('0.00'),
        net: new Decimal('5000.00'),
        type: 'card',
        status: 'approved',
        dueDay: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createTransactions(): Promise<void> {
    this.logger.log('Creating transactions');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const user2 = await this.prisma.users.findFirst({
      where: { email: 'jane@example.com' },
    });

    const identity1 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user1.id },
    });

    const identity2 = await this.prisma.usersIdentities.findFirst({
      where: { userId: user2.id },
    });

    const account1 = await this.prisma.usersAccounts.findFirst({
      where: { userId: user1.id },
    });

    const account2 = await this.prisma.usersAccounts.findFirst({
      where: { userId: user2.id },
    });

    const store1 = await this.prisma.stores.findFirst({
      where: { name: 'Tech Store Downtown' },
    });

    const branch1 = await this.prisma.branches.findFirst({
      where: { name: 'Downtown Branch' },
    });

    await this.prisma.transactions.create({
      data: {
        id: uuidv4(),
        date: new Date(),
        type: 'transfer',
        status: 'confirm',
        sourceUserId: user1.id,
        sourceIdentityId: identity1.id,
        sourceAccountId: account1.id,
        sourceName: 'John Doe',
        sourceCbu: '0000000000000000000000',
        targetUserId: user2.id,
        targetIdentityId: identity2.id,
        targetAccountId: account2.id,
        targetName: 'Jane Smith',
        targetCbu: '1111111111111111111111',
        amount: new Decimal('500.00'),
        country: 'AR',
        currency: 'ARS',
        bindId: 'BIND_001',
        cronosId: 'CRONOS_001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.transactions.create({
      data: {
        id: uuidv4(),
        date: new Date(Date.now() + 1000),
        type: 'payment',
        status: 'confirm',
        sourceUserId: user1.id,
        sourceIdentityId: identity1.id,
        sourceAccountId: account1.id,
        sourceName: 'John Doe',
        storeId: store1.id,
        branchId: branch1.id,
        amount: new Decimal('1500.00'),
        country: 'AR',
        currency: 'ARS',
        bindId: 'BIND_002',
        cronosId: 'CRONOS_002',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async createTransactionLogs(): Promise<void> {
    this.logger.log('Creating transaction logs');

    const user1 = await this.prisma.users.findFirst({
      where: { email: 'john@example.com' },
    });

    const transactions = await this.prisma.transactions.findMany({
      where: { sourceUserId: user1.id },
      take: 1,
    });

    if (transactions.length > 0) {
      await this.prisma.transactionsLogs.create({
        data: {
          id: uuidv4(),
          transactionId: transactions[0].id,
          userId: user1.id,
          finalStatus: 'confirm',
          finalSourceBalance: new Decimal('4500.00'),
          finalTargetBalance: new Decimal('8500.00'),
          context: 'Transfer between accounts',
          params: '{}',
          result: '{}',
          ip: '192.168.1.1',
          agent: 'Mozilla/5.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }

  private async createRampOperations(): Promise<void> {
    this.logger.log('Creating ramp operations');

    const transactions = await this.prisma.transactions.findMany({
      take: 2,
    });
    const users = await this.prisma.users.findMany({ take: 1 });

    if (transactions.length >= 2 && users.length >= 1) {
      await this.prisma.ramp_operations.create({
        data: {
          id: uuidv4(),
          user_id: users[0].id,
          status: 'SETTLED',
          direction: 'RAMP_ON',
          country: 'AR',
          debit_transaction_id: transactions[0].id,
          credit_transaction_id: transactions[1].id,
          deposit_amount: new Decimal('2100.00'),
          expected_credit_amount: new Decimal('1900.00'),
          fee_total: new Decimal('100.00'),
          withdraw_address: '0x1234567890abcdef1234567890abcdef12345678',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
  }

  private async createAccreditations(): Promise<void> {
    this.logger.log('Creating accreditations');

    await this.prisma.accreditations.create({
      data: {
        id: uuidv4(),
        status: 'pending',
        type: 'bind',
        number: 'ACC_001',
        name: 'John Doe Accreditation',
        amount: new Decimal('5000.00'),
        taxDocumentType: 'DNI',
        taxDocumentNumber: '12345678',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

const seeder = new DatabaseSeeder();

seeder.seed().catch((error) => {
  new Logger('DatabaseSeeder').error('Fatal error during seeding', error);
  process.exit(1);
});
