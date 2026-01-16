import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { MantecaService } from '../../../shared/manteca/manteca.service';
import { SpendingLimitsService } from '../../../shared/spending-limits/spending-limits.service';
import {
  QrPaymentDto,
  PaymentLockDto,
  RampOnDto,
  RampOffDto,
} from '../dto/manteca.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MantecaOperationsService {
  private readonly logger = new Logger(MantecaOperationsService.name);

  constructor(
    private prisma: PrismaService,
    private mantecaService: MantecaService,
    private spendingLimitsService: SpendingLimitsService,
  ) {}

  /**
   * Process QR code payment
   */
  async qrPayment(
    dto: QrPaymentDto,
    userId: string,
    userIdentityId: string,
  ): Promise<any> {
    this.logger.log(`Processing QR payment for user ${userId}`);

    // Get user's country
    const country =
      await this.spendingLimitsService.getIdentityCountry(userIdentityId);

    // Check spending limits
    const limitCheck = await this.spendingLimitsService.checkSpendingLimitV2({
      userIdentityId,
      amount: dto.amount,
      operationType: 'qrCode',
      country,
    });

    if (!limitCheck.allowed) {
      throw new BadRequestException(
        'Spending limit exceeded: ' + limitCheck.message,
      );
    }

    // Get source account
    const sourceAccountId = dto.sourceAccountId;
    let sourceAccount: any;

    if (sourceAccountId) {
      sourceAccount = await this.prisma.usersAccounts.findUnique({
        where: { id: sourceAccountId },
      });
    } else {
      // Get default account for user
      sourceAccount = await this.prisma.usersAccounts.findFirst({
        where: {
          userIdentityId,
          status: 'enable',
          type: country === 'ar' ? 'bind' : 'cronos',
        },
      });
    }

    if (!sourceAccount) {
      throw new BadRequestException('Source account not found');
    }

    // Create transaction
    const transactionId = uuidv4();
    const now = new Date();
    const transactionType =
      country === 'ar' ? 'cashout_manteca_qr_ar' : 'cashout_manteca_qr_br';

    const transaction = await this.prisma.transactions.create({
      data: {
        id: transactionId,
        date: now,
        type: transactionType as any,
        status: 'pending',
        sourceUserId: userId,
        sourceIdentityId: userIdentityId,
        sourceAccountId: sourceAccount.id,
        sourceCvu: sourceAccount.cvu,
        amount: dto.amount,
        reason: dto.description || 'QR Payment via Manteca',
        country,
        currency: country === 'ar' ? 'ARS' : 'BRL',
        createdAt: now,
        updatedAt: now,
      },
    });

    // Update spending limits
    await this.spendingLimitsService.updateSpendingV2({
      userIdentityId,
      amount: dto.amount,
      operationType: 'qrCode',
      country,
    });

    // Log transaction
    await this.prisma.transactionsLogs.create({
      data: {
        id: uuidv4(),
        transactionId,
        userId,
        initialStatus: null,
        finalStatus: 'pending',
        context: 'mantecaQrPayment',
        params: JSON.stringify({
          qrCode: dto.qrCode,
          amount: dto.amount,
          description: dto.description,
        }),
        result: JSON.stringify({ success: true }),
        createdAt: now,
        updatedAt: now,
      },
    });

    this.logger.log(`QR payment transaction created: ${transactionId}`);

    return {
      success: true,
      transactionId,
      mantecaId: null, // Will be updated by webhook
      status: 'pending',
      message: 'QR payment initiated successfully',
    };
  }

  /**
   * Create payment lock for QR
   */
  async paymentLock(
    dto: PaymentLockDto,
    userId: string,
    userIdentityId: string,
  ): Promise<any> {
    this.logger.log(`Creating payment lock for user ${userId}`);

    const country =
      await this.spendingLimitsService.getIdentityCountry(userIdentityId);

    // Check spending limits
    const limitCheck = await this.spendingLimitsService.checkSpendingLimitV2({
      userIdentityId,
      amount: dto.amount,
      operationType: 'qrCode',
      country,
    });

    if (!limitCheck.allowed) {
      throw new BadRequestException(
        'Spending limit exceeded: ' + limitCheck.message,
      );
    }

    return {
      success: true,
      lockId: uuidv4(),
      qrCode: dto.qrCode,
      amount: dto.amount,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      message: 'Payment lock created',
    };
  }

  /**
   * Ramp On operation (Crypto -> Fiat)
   */
  async rampOn(
    dto: RampOnDto,
    userId: string,
    userIdentityId: string,
  ): Promise<any> {
    this.logger.log(`Processing Ramp ON for user ${userId}`);

    const country = dto.targetCurrency.toUpperCase() === 'ARS' ? 'ar' : 'br';

    // Get target account
    let targetAccount: any;

    if (dto.targetAccountId) {
      targetAccount = await this.prisma.usersAccounts.findUnique({
        where: { id: dto.targetAccountId },
      });
    } else {
      targetAccount = await this.prisma.usersAccounts.findFirst({
        where: {
          userIdentityId,
          status: 'enable',
          type: country === 'ar' ? 'bind' : 'cronos',
        },
      });
    }

    if (!targetAccount) {
      throw new BadRequestException('Target account not found');
    }

    // Create ramp operation record
    const operationId = uuidv4();
    const now = new Date();

    const rampOperation = await this.prisma.ramp_operations.create({
      data: {
        id: operationId,
        user_id: userId,
        direction: 'RAMP_ON',
        status: 'STARTING',
        country: country.toUpperCase() as any,
        deposit_amount: dto.amount,
        expected_credit_amount: dto.amount, // Will be updated
        withdraw_address:
          targetAccount.cvu || targetAccount.accountNumber || '',
        manteca_external_id: dto.externalId,
        credit_transaction_id: null,
        debit_transaction_id: null,
      },
    });

    this.logger.log(`Ramp ON operation created: ${operationId}`);

    return {
      success: true,
      operationId,
      mantecaOperationId: null, // Will be updated by Manteca
      status: 'STARTING',
      direction: 'RAMP_ON',
      depositAmount: dto.amount,
      expectedCreditAmount: dto.amount,
      depositAddress: null, // Will be provided by Manteca
      message: 'Ramp ON operation initiated',
    };
  }

  /**
   * Ramp Off operation (Fiat -> Crypto)
   */
  async rampOff(
    dto: RampOffDto,
    userId: string,
    userIdentityId: string,
  ): Promise<any> {
    this.logger.log(`Processing Ramp OFF for user ${userId}`);

    const country = dto.sourceCurrency.toUpperCase() === 'ARS' ? 'ar' : 'br';

    // Check spending limits
    const limitCheck = await this.spendingLimitsService.checkSpendingLimitV2({
      userIdentityId,
      amount: dto.amount,
      operationType: 'transfer',
      country: country as 'ar' | 'br',
    });

    if (!limitCheck.allowed) {
      throw new BadRequestException(
        'Spending limit exceeded: ' + limitCheck.message,
      );
    }

    // Get source account
    let sourceAccount: any;

    if (dto.sourceAccountId) {
      sourceAccount = await this.prisma.usersAccounts.findUnique({
        where: { id: dto.sourceAccountId },
      });
    } else {
      sourceAccount = await this.prisma.usersAccounts.findFirst({
        where: {
          userIdentityId,
          status: 'enable',
          type: country === 'ar' ? 'bind' : 'cronos',
        },
      });
    }

    if (!sourceAccount) {
      throw new BadRequestException('Source account not found');
    }

    // Create ramp operation record
    const operationId = uuidv4();
    const now = new Date();

    const rampOperation = await this.prisma.ramp_operations.create({
      data: {
        id: operationId,
        user_id: userId,
        direction: 'RAMP_OFF',
        status: 'STARTING',
        country: country.toUpperCase() as any,
        deposit_amount: dto.amount,
        expected_credit_amount: 0, // Will be calculated by Manteca
        withdraw_address: dto.cryptoAddress || '',
        manteca_external_id: dto.externalId,
        credit_transaction_id: null,
        debit_transaction_id: null,
      },
    });

    // Update spending limits
    await this.spendingLimitsService.updateSpendingV2({
      userIdentityId,
      amount: dto.amount,
      operationType: 'transfer',
      country: country as 'ar' | 'br',
    });

    this.logger.log(`Ramp OFF operation created: ${operationId}`);

    return {
      success: true,
      operationId,
      mantecaOperationId: null, // Will be updated by Manteca
      status: 'STARTING',
      direction: 'RAMP_OFF',
      depositAmount: dto.amount,
      expectedCreditAmount: 0,
      depositAlias: sourceAccount.alias,
      message: 'Ramp OFF operation initiated',
    };
  }

  /**
   * Get synthetic operation status
   */
  async getSyntheticById(syntheticId: string): Promise<any> {
    // First try to find in ramp_operations
    const rampOperation = await this.prisma.ramp_operations.findFirst({
      where: {
        OR: [{ id: syntheticId }, { manteca_operation_id: syntheticId }],
      },
    });

    if (rampOperation) {
      return {
        id: rampOperation.id,
        mantecaId: rampOperation.manteca_operation_id,
        status: rampOperation.status,
        direction: rampOperation.direction,
        country: rampOperation.country,
        depositAmount: rampOperation.deposit_amount,
        expectedCreditAmount: rampOperation.expected_credit_amount,
        stages: rampOperation.stages_data,
        createdAt: rampOperation.created_at,
        confirmedAt: rampOperation.manteca_confirmed_at,
      };
    }

    // Try to find in transactions with mantecaId
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        mantecaId: syntheticId,
      },
    });

    if (transaction) {
      return {
        id: transaction.id,
        mantecaId: transaction.mantecaId,
        status: transaction.status,
        type: transaction.type,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
      };
    }

    throw new NotFoundException('Synthetic operation not found');
  }

  /**
   * Get all ramp operations for a user
   */
  async getUserRampOperations(
    userId: string,
    limit: number = 20,
  ): Promise<any[]> {
    const operations = await this.prisma.ramp_operations.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return operations.map((op) => ({
      id: op.id,
      mantecaOperationId: op.manteca_operation_id,
      direction: op.direction,
      status: op.status,
      country: op.country,
      depositAmount: op.deposit_amount,
      expectedCreditAmount: op.expected_credit_amount,
      createdAt: op.created_at,
      confirmedAt: op.manteca_confirmed_at,
    }));
  }
}
