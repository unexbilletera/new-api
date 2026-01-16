import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SpendingLimitsService } from '../../../shared/spending-limits/spending-limits.service';
import { RateCodeService } from '../../exchange/services/rate-code.service';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateCashinDto,
  CreateCashoutDto,
  CreateTransferDto,
  CreatePaymentDto,
  CreatePaymentQrDto,
  CreateRechargeDto,
  CreateMantecaExchangeDto,
  CreateCoelsaDto,
  ConfirmTransactionDto,
  CancelTransactionDto,
} from '../dto/create-transaction.dto';

interface ContextUser {
  id: string;
  userIdentityId?: string;
}

@Injectable()
export class TransactionCreationService {
  private readonly logger = new Logger(TransactionCreationService.name);

  constructor(
    private prisma: PrismaService,
    private spendingLimitsService: SpendingLimitsService,
    private rateCodeService: RateCodeService,
  ) {}

  /**
   * Get source account with validation
   */
  private async getSourceAccount(accountId: string, userId: string) {
    const account = await this.prisma.usersAccounts.findFirst({
      where: {
        id: accountId,
        userId,
        status: 'enable',
        deletedAt: null,
      },
      include: {
        usersIdentities: {
          select: {
            id: true,
            country: true,
            taxDocumentNumber: true,
            name: true,
          },
        },
      },
    });

    if (!account) {
      throw new BadRequestException('Source account not found or not enabled');
    }

    return account;
  }

  /**
   * Check spending limits for a transaction
   */
  private async checkSpendingLimits(
    userIdentityId: string,
    amount: number,
    operationType: 'transfer' | 'qrCode' | 'pix',
    country?: string,
  ): Promise<void> {
    try {
      const result = await this.spendingLimitsService.checkSpendingLimitV2({
        userIdentityId,
        amount,
        operationType,
        country: country as 'ar' | 'br' | undefined,
      });

      if (!result.canProceed) {
        throw new ForbiddenException(
          result.message || 'Spending limit exceeded',
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.warn(`Spending limit check failed: ${error.message}`);
      // Continue without blocking if service fails
    }
  }

  /**
   * Create base transaction record
   */
  private async createTransactionRecord(data: {
    type: string;
    status: string;
    amount: number;
    sourceUserId: string;
    sourceAccountId: string;
    sourceIdentityId?: string;
    targetUserId?: string;
    targetAccountId?: string;
    targetIdentityId?: string;
    sourceName?: string;
    targetName?: string;
    sourceCvu?: string;
    targetCvu?: string;
    reason?: string;
    reference?: any;
    relatedTransactionId?: string;
    mantecaId?: string;
    cronosId?: string;
    gireId?: string;
    coelsaId?: string;
    bindId?: string;
  }) {
    const transaction = await this.prisma.transactions.create({
      data: {
        id: uuidv4(),
        type: data.type as any,
        status: data.status as any,
        amount: data.amount,
        sourceUserId: data.sourceUserId,
        sourceAccountId: data.sourceAccountId,
        sourceIdentityId: data.sourceIdentityId,
        targetUserId: data.targetUserId,
        targetAccountId: data.targetAccountId,
        targetIdentityId: data.targetIdentityId,
        sourceName: data.sourceName,
        targetName: data.targetName,
        sourceCvu: data.sourceCvu,
        targetCvu: data.targetCvu,
        reason: data.reason,
        reference: data.reference ? JSON.stringify(data.reference) : null,
        relatedTransactionId: data.relatedTransactionId,
        mantecaId: data.mantecaId,
        cronosId: data.cronosId,
        gireId: data.gireId,
        coelsaId: data.coelsaId,
        bindId: data.bindId,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create transaction log
    await this.prisma.transactionsLogs.create({
      data: {
        id: uuidv4(),
        transactionId: transaction.id,
        userId: data.sourceUserId,
        initialStatus: null,
        finalStatus: data.status as any,
        context: 'create',
        params: JSON.stringify({ type: data.type }),
        result: JSON.stringify({ success: true }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return transaction;
  }

  /**
   * Create CASHIN transaction
   */
  async createCashin(dto: CreateCashinDto, user: ContextUser): Promise<any> {
    this.logger.log(`Creating cashin transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'cashin',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      sourceName:
        dto.sourceName || sourceAccount.usersIdentities?.name || undefined,
      reason: dto.reason,
      reference: dto.reference,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT transaction
   */
  async createCashout(dto: CreateCashoutDto, user: ContextUser): Promise<any> {
    this.logger.log(`Creating cashout transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for transfer
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'transfer',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'cashout',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      targetAccountId: dto.targetAccountId,
      targetName: dto.targetName,
      targetCvu: dto.targetCvu,
      reason: dto.reason,
      reference: dto.reference,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create TRANSFER transaction (PIX, CVU, CBU)
   */
  async createTransfer(
    dto: CreateTransferDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating transfer transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for transfer
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'transfer',
        sourceAccount.usersIdentities.country,
      );
    }

    // Determine if auto-exchange is needed
    const sourceCountry = sourceAccount.usersIdentities?.country?.toLowerCase();
    const isPix = dto.targetType.startsWith('pix_');
    const isCvu = dto.targetType === 'cvu' || dto.targetType === 'cbu';

    let relatedExchangeId: string | undefined;
    let finalSourceAccountId = dto.sourceAccountId;

    // PIX requires BRL, CVU/CBU requires ARS
    if (isPix && sourceCountry === 'ar') {
      // Need auto-exchange ARS → BRL
      this.logger.log('Auto-exchange needed: ARS → BRL for PIX transfer');
      // Auto-exchange would be created here in full implementation
    } else if (isCvu && sourceCountry === 'br') {
      // Need auto-exchange BRL → ARS
      this.logger.log('Auto-exchange needed: BRL → ARS for CVU transfer');
      // Auto-exchange would be created here in full implementation
    }

    const transaction = await this.createTransactionRecord({
      type: 'transfer',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: finalSourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      targetName: dto.targetName,
      targetCvu: isCvu ? dto.target : undefined,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        targetType: dto.targetType,
        target: dto.target,
      },
      relatedTransactionId: relatedExchangeId,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create PAYMENT transaction (boleto)
   */
  async createPayment(dto: CreatePaymentDto, user: ContextUser): Promise<any> {
    this.logger.log(`Creating payment transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for boleto
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'transfer',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'payment',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        code: dto.code,
        paymentType: dto.paymentType,
        billData: dto.billData,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create PAYMENT_GIRE transaction (Argentina boleto)
   */
  async createPaymentGire(
    dto: CreatePaymentDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating payment_gire transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for boleto
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'transfer',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'payment_gire',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        code: dto.code,
        paymentType: dto.paymentType,
        billData: dto.billData,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create PAYMENT_CRONOS transaction (Brazil boleto)
   */
  async createPaymentCronos(
    dto: CreatePaymentDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating payment_cronos transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for boleto
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'transfer',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'payment_cronos',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        code: dto.code,
        paymentType: dto.paymentType,
        billData: dto.billData,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create PAYMENT_QR transaction
   */
  async createPaymentQr(
    dto: CreatePaymentQrDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating payment_qr transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for QR
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'qrCode',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'payment_qr',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        qrCode: dto.qrCode,
        against: dto.against,
        qrData: dto.qrData,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT_CRONOS_QR transaction (Brazil QR/PIX)
   */
  async createCashoutCronosQr(
    dto: CreatePaymentQrDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(
      `Creating cashout_cronos_qr transaction for user ${user.id}`,
    );

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for QR
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'qrCode',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'cashout_cronos_qr',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        qrCode: dto.qrCode,
        against: dto.against,
        qrData: dto.qrData,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT_MANTECA_QR_AR transaction (Argentina QR via Manteca)
   */
  async createCashoutMantecaQrAr(
    dto: CreatePaymentQrDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(
      `Creating cashout_manteca_qr_ar transaction for user ${user.id}`,
    );

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for QR
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'qrCode',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'cashout_manteca_qr_ar',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        qrCode: dto.qrCode,
        against: dto.against,
        qrData: dto.qrData,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT_MANTECA_QR_BR transaction (Brazil QR via Manteca)
   */
  async createCashoutMantecaQrBr(
    dto: CreatePaymentQrDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(
      `Creating cashout_manteca_qr_br transaction for user ${user.id}`,
    );

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Check spending limits for QR
    if (sourceAccount.usersIdentities?.id) {
      await this.checkSpendingLimits(
        sourceAccount.usersIdentities.id,
        dto.amount,
        'qrCode',
        sourceAccount.usersIdentities.country,
      );
    }

    const transaction = await this.createTransactionRecord({
      type: 'cashout_manteca_qr_br',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        qrCode: dto.qrCode,
        against: dto.against,
        qrData: dto.qrData,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT_MANTECA_EXCHANGE_AR transaction (Exchange AR → BR)
   */
  async createCashoutMantecaExchangeAr(
    dto: CreateMantecaExchangeDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(
      `Creating cashout_manteca_exchange_ar transaction for user ${user.id}`,
    );

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Validate rate code
    const rateCodeValid = await this.rateCodeService.validateRateCode(
      dto.rateCode,
      user.id,
    );

    if (!rateCodeValid.valid) {
      throw new BadRequestException(rateCodeValid.error || 'Invalid rate code');
    }

    const transaction = await this.createTransactionRecord({
      type: 'cashout_manteca_exchange_ar',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        rateCode: dto.rateCode,
        convertedAmount: dto.convertedAmount,
        rate: dto.rate,
      },
    });

    // Mark rate code as used
    await this.rateCodeService.markRateCodeAsUsed(dto.rateCode, transaction.id);

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT_MANTECA_EXCHANGE_BR transaction (Exchange BR → AR)
   */
  async createCashoutMantecaExchangeBr(
    dto: CreateMantecaExchangeDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(
      `Creating cashout_manteca_exchange_br transaction for user ${user.id}`,
    );

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    // Validate rate code
    const rateCodeValid = await this.rateCodeService.validateRateCode(
      dto.rateCode,
      user.id,
    );

    if (!rateCodeValid.valid) {
      throw new BadRequestException(rateCodeValid.error || 'Invalid rate code');
    }

    const transaction = await this.createTransactionRecord({
      type: 'cashout_manteca_exchange_br',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        rateCode: dto.rateCode,
        convertedAmount: dto.convertedAmount,
        rate: dto.rate,
      },
    });

    // Mark rate code as used
    await this.rateCodeService.markRateCodeAsUsed(dto.rateCode, transaction.id);

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create RECHARGE_GIRE transaction (Argentina recharge)
   */
  async createRechargeGire(
    dto: CreateRechargeDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating recharge_gire transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'recharge_gire',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        companyCode: dto.companyCode,
        companyName: dto.companyName,
        code: dto.code,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create RECHARGE_CRONOS transaction (Brazil recharge)
   */
  async createRechargeCronos(
    dto: CreateRechargeDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating recharge_cronos transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'recharge_cronos',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        companyCode: dto.companyCode,
        companyName: dto.companyName,
        code: dto.code,
      },
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT_GIRE transaction
   */
  async createCashoutGire(
    dto: CreateCashoutDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating cashout_gire transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'cashout_gire',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      targetAccountId: dto.targetAccountId,
      targetName: dto.targetName,
      targetCvu: dto.targetCvu,
      reason: dto.reason,
      reference: dto.reference,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHIN_COELSA transaction
   */
  async createCashinCoelsa(
    dto: CreateCoelsaDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating cashin_coelsa transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'cashin_coelsa',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      targetName: dto.targetName,
      targetCvu: dto.targetCvu,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        targetCuit: dto.targetCuit,
      },
      coelsaId: dto.coelsaId,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHOUT_COELSA transaction
   */
  async createCashoutCoelsa(
    dto: CreateCoelsaDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating cashout_coelsa transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'cashout_coelsa',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      targetName: dto.targetName,
      targetCvu: dto.targetCvu,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        targetCuit: dto.targetCuit,
      },
      coelsaId: dto.coelsaId,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create REFOUND_COELSA transaction
   */
  async createRefoundCoelsa(
    dto: CreateCoelsaDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Creating refound_coelsa transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'refound_coelsa',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      targetName: dto.targetName,
      targetCvu: dto.targetCvu,
      reason: dto.reason,
      reference: {
        ...dto.reference,
        targetCuit: dto.targetCuit,
      },
      coelsaId: dto.coelsaId,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Create CASHBACK transaction
   */
  async createCashback(dto: CreateCashinDto, user: ContextUser): Promise<any> {
    this.logger.log(`Creating cashback transaction for user ${user.id}`);

    const sourceAccount = await this.getSourceAccount(
      dto.sourceAccountId,
      user.id,
    );

    const transaction = await this.createTransactionRecord({
      type: 'cashback',
      status: 'pending',
      amount: dto.amount,
      sourceUserId: user.id,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: sourceAccount.userIdentityId,
      sourceName: dto.sourceName,
      reason: dto.reason,
      reference: dto.reference,
    });

    return {
      success: true,
      transaction,
    };
  }

  /**
   * Confirm transaction
   */
  async confirmTransaction(
    dto: ConfirmTransactionDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Confirming transaction ${dto.transactionId}`);

    const transaction = await this.prisma.transactions.findFirst({
      where: {
        id: dto.transactionId,
        sourceUserId: user.id,
        status: 'pending',
        deletedAt: null,
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction not found or not in pending status',
      );
    }

    const updatedTransaction = await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: 'confirm',
        updatedAt: new Date(),
      },
    });

    // Create transaction log
    await this.prisma.transactionsLogs.create({
      data: {
        id: uuidv4(),
        transactionId: transaction.id,
        userId: user.id,
        initialStatus: 'pending',
        finalStatus: 'confirm',
        context: 'confirm',
        params: JSON.stringify(dto.data || {}),
        result: JSON.stringify({ success: true }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update spending tracking
    if (transaction.sourceIdentityId) {
      try {
        // Get identity country
        const identity = await this.prisma.usersIdentities.findUnique({
          where: { id: transaction.sourceIdentityId },
          select: { country: true },
        });
        const country = (identity?.country?.toLowerCase() || 'br') as
          | 'ar'
          | 'br';

        await this.spendingLimitsService.updateSpendingV2({
          userIdentityId: transaction.sourceIdentityId,
          amount: Number(transaction.amount),
          operationType: this.getOperationType(transaction.type),
          country,
        });
      } catch (error) {
        this.logger.warn(`Failed to update spending: ${error.message}`);
      }
    }

    return {
      success: true,
      transaction: updatedTransaction,
    };
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(
    dto: CancelTransactionDto,
    user: ContextUser,
  ): Promise<any> {
    this.logger.log(`Canceling transaction ${dto.transactionId}`);

    const transaction = await this.prisma.transactions.findFirst({
      where: {
        id: dto.transactionId,
        sourceUserId: user.id,
        status: 'pending',
        deletedAt: null,
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        'Transaction not found or not in pending status',
      );
    }

    const updatedTransaction = await this.prisma.transactions.update({
      where: { id: transaction.id },
      data: {
        status: 'cancel',
        reason: dto.reason || transaction.reason,
        updatedAt: new Date(),
      },
    });

    // Create transaction log
    await this.prisma.transactionsLogs.create({
      data: {
        id: uuidv4(),
        transactionId: transaction.id,
        userId: user.id,
        initialStatus: 'pending',
        finalStatus: 'cancel',
        context: 'cancel',
        params: JSON.stringify({ reason: dto.reason }),
        result: JSON.stringify({ success: true }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      transaction: updatedTransaction,
    };
  }

  /**
   * Select transaction (get details)
   */
  async selectTransaction(
    transactionId: string,
    user: ContextUser,
  ): Promise<any> {
    const transaction = await this.prisma.transactions.findFirst({
      where: {
        id: transactionId,
        OR: [{ sourceUserId: user.id }, { targetUserId: user.id }],
        deletedAt: null,
      },
      include: {
        usersAccounts_transactions_sourceAccountIdTousersAccounts: {
          select: {
            id: true,
            type: true,
            cvu: true,
            alias: true,
          },
        },
        usersAccounts_transactions_targetAccountIdTousersAccounts: {
          select: {
            id: true,
            type: true,
            cvu: true,
            alias: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount,
        date: transaction.date,
        reason: transaction.reason,
        reference: transaction.reference
          ? JSON.parse(transaction.reference as string)
          : null,
        source: {
          userId: transaction.sourceUserId,
          accountId: transaction.sourceAccountId,
          name: transaction.sourceName,
          cvu: transaction.sourceCvu,
          account:
            transaction.usersAccounts_transactions_sourceAccountIdTousersAccounts,
        },
        target: {
          userId: transaction.targetUserId,
          accountId: transaction.targetAccountId,
          name: transaction.targetName,
          cvu: transaction.targetCvu,
          account:
            transaction.usersAccounts_transactions_targetAccountIdTousersAccounts,
        },
        mantecaId: transaction.mantecaId,
        cronosId: transaction.cronosId,
        gireId: transaction.gireId,
        coelsaId: transaction.coelsaId,
        bindId: transaction.bindId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    };
  }

  /**
   * Get transaction ticket (HTML or PDF data)
   */
  async ticketTransaction(
    transactionId: string,
    user: ContextUser,
    contentType: string = 'html',
  ): Promise<any> {
    const result = await this.selectTransaction(transactionId, user);
    const transaction = result.transaction;

    // Generate ticket HTML
    const ticketHtml = this.generateTicketHtml(transaction);

    if (contentType === 'pdf') {
      // Return data for PDF generation (would need PDF library integration)
      return {
        success: true,
        contentType: 'pdf',
        html: ticketHtml,
        transaction,
      };
    }

    return {
      success: true,
      contentType: 'html',
      html: ticketHtml,
      transaction,
    };
  }

  /**
   * Generate ticket HTML
   */
  private generateTicketHtml(transaction: any): string {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprovante de Transação</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; }
          .value { font-weight: bold; }
          .amount { font-size: 24px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Comprovante de Transação</h2>
        </div>
        <div class="amount">${formatAmount(Number(transaction.amount))}</div>
        <div class="row">
          <span class="label">Tipo:</span>
          <span class="value">${transaction.type}</span>
        </div>
        <div class="row">
          <span class="label">Status:</span>
          <span class="value">${transaction.status}</span>
        </div>
        <div class="row">
          <span class="label">Data:</span>
          <span class="value">${formatDate(transaction.date)}</span>
        </div>
        <div class="row">
          <span class="label">ID:</span>
          <span class="value">${transaction.id}</span>
        </div>
        ${transaction.source?.name ? `<div class="row"><span class="label">Origem:</span><span class="value">${transaction.source.name}</span></div>` : ''}
        ${transaction.target?.name ? `<div class="row"><span class="label">Destino:</span><span class="value">${transaction.target.name}</span></div>` : ''}
        ${transaction.reason ? `<div class="row"><span class="label">Descrição:</span><span class="value">${transaction.reason}</span></div>` : ''}
        <div class="footer">
          <p>Transação processada por Unex</p>
          <p>${formatDate(new Date())}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get operation type for spending limits
   */
  private getOperationType(
    transactionType: string,
  ): 'transfer' | 'qrCode' | 'pix' {
    if (
      transactionType.includes('qr') ||
      transactionType.includes('payment_qr')
    ) {
      return 'qrCode';
    }
    if (transactionType.includes('pix')) {
      return 'pix';
    }
    return 'transfer';
  }
}
