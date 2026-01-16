import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { CronosService } from '../../shared/cronos/cronos.service';
import { PixCronosValidationService } from '../../secure/transactions/cronos/pix-cronos/services/pix-cronos-validation.service';
import { ColoredLogger } from '../../shared/utils/logger-colors';
import type { transactions_status } from '../../../generated/prisma';

@Injectable()
export class PixCronosHandler {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private cronosService: CronosService,
    private validationService: PixCronosValidationService,
  ) {}

  async handleCreate(payload: {
    transactionId: string;
    userId: string;
    sourceAccountId: string;
    sourceIdentityId: string;
    amount: number;
    targetKeyType: string;
    targetKeyValue: string;
    description?: string;
  }): Promise<void> {
    this.logger.info(
      `Processing PIX Cronos create for transaction: ${payload.transactionId}`,
    );

    try {
      const transaction = await this.prisma.transactions.findUnique({
        where: { id: payload.transactionId },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found: ${payload.transactionId}`);
        return;
      }

      if (transaction.status !== 'pending') {
        this.logger.warn(
          `Transaction ${payload.transactionId} is not pending. Status: ${transaction.status}`,
        );
        return;
      }

      this.logger.info(
        `PIX Cronos create job processed successfully for transaction: ${payload.transactionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing PIX Cronos create job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(
          `Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
        );
      }

      throw error;
    }
  }

  async handleConfirm(payload: {
    transactionId: string;
    userId: string;
  }): Promise<void> {
    this.logger.info(
      `Processing PIX Cronos confirm for transaction: ${payload.transactionId}`,
    );

    try {
      const transaction = await this.prisma.transactions.findFirst({
        where: {
          id: payload.transactionId,
          userId: payload.userId,
          type: 'cashout_cronos',
        },
        include: {
          users_transactions_userIdTousers: {
            include: {
              usersAccounts: {
                where: { status: 'enable' },
                take: 1,
              },
            },
          },
        },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found: ${payload.transactionId}`);
        return;
      }

      if (transaction.status !== 'process') {
        this.logger.warn(
          `Transaction ${payload.transactionId} is not in process status. Status: ${transaction.status}`,
        );
        return;
      }

      // Validar dados necessários
      if (!transaction.cronosId) {
        ColoredLogger.error(
          '[PixCronosHandler] ❌',
          `Transação ${payload.transactionId} não possui cronosId. A transferência PIX deve ser criada primeiro.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      if (!transaction.sourceTaxDocumentNumber) {
        ColoredLogger.error(
          '[PixCronosHandler] ❌',
          `Transação ${payload.transactionId} não possui sourceTaxDocumentNumber.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      if (!transaction.amount) {
        ColoredLogger.error(
          '[PixCronosHandler] ❌',
          `Transação ${payload.transactionId} não possui amount.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      if (!transaction.sourceAccountId) {
        ColoredLogger.error(
          '[PixCronosHandler] ❌',
          `Transação ${payload.transactionId} não possui sourceAccountId.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      if (!transaction.sourceIdentityId) {
        ColoredLogger.error(
          '[PixCronosHandler] ❌',
          `Transação ${payload.transactionId} não possui sourceIdentityId.`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      // Validar saldo, limites antes de chamar API da Cronos
      ColoredLogger.info(
        '[PixCronosHandler]',
        `Validando saldo e limites antes da confirmação - transactionId: ${payload.transactionId}, amount: ${Number(transaction.amount)}`,
      );

      const validationResult = await this.validationService.validateAll(
        transaction.sourceIdentityId,
        transaction.sourceAccountId,
        Number(transaction.amount),
        payload.userId,
        payload.transactionId,
      );

      if (!validationResult.valid) {
        ColoredLogger.error(
          '[PixCronosHandler] ❌',
          `Validação falhou: ${validationResult.error}`,
        );
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
        return;
      }

      // Chamar API da Cronos para confirmar a transferência PIX
      ColoredLogger.info(
        '[PixCronosHandler]',
        `Confirmando transferência PIX na API da Cronos - transactionId: ${payload.transactionId}, cronosId: ${transaction.cronosId}`,
      );

      try {
        // 1. Criar token transacional (requesttoken) - igual API antiga
        ColoredLogger.info(
          '[PixCronosHandler]',
          `Criando token transacional na Cronos - document: ${transaction.sourceTaxDocumentNumber}, amount: ${Number(transaction.amount)}`,
        );
        await this.cronosService.createTransactionalToken({
          document: transaction.sourceTaxDocumentNumber,
          amount: Number(transaction.amount),
          lat: 0,
          lon: 0,
        });

        // 2. Confirmar senha transacional (pass) - igual API antiga
        ColoredLogger.info(
          '[PixCronosHandler]',
          `Confirmando senha transacional na Cronos - document: ${transaction.sourceTaxDocumentNumber}`,
        );
        await this.cronosService.confirmTransactionPassword({
          document: transaction.sourceTaxDocumentNumber,
        });

        // 3. Confirmar transferência PIX (confirmartransferencia)
        const confirmResult = (await this.cronosService.confirmTransferPix({
          document: transaction.sourceTaxDocumentNumber,
          id: transaction.cronosId,
          amount: Number(transaction.amount),
          description: transaction.reason || 'Transferência PIX',
        })) as { success?: boolean };

        // Validar resposta da API
        if (!confirmResult || confirmResult.success === false) {
          ColoredLogger.error(
            '[PixCronosHandler] ❌',
            `API da Cronos retornou erro ao confirmar transferência: ${JSON.stringify(confirmResult)}`,
          );
          await this.prisma.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'error' as transactions_status,
              updatedAt: new Date(),
            },
          });
          return;
        }

        // Debitar saldo da conta de origem e atualizar transação como confirm
        // Usar SELECT FOR UPDATE para evitar race conditions
        await this.prisma.$transaction(async (tx) => {
          // 1. LOCK da conta (SELECT FOR UPDATE) - previne race conditions
          const lockedAccount = await tx.$queryRaw<
            Array<{
              id: string;
              balance: unknown; // Decimal do Prisma retorna como string ou number
            }>
          >`
            SELECT id, balance 
            FROM usersAccounts 
            WHERE id = ${transaction.sourceAccountId} 
            FOR UPDATE
          `;

          if (!lockedAccount || lockedAccount.length === 0) {
            ColoredLogger.error(
              '[PixCronosHandler] ❌',
              `Conta de origem não encontrada para transactionId: ${payload.transactionId}, sourceAccountId: ${transaction.sourceAccountId}`,
            );
            await tx.transactions.update({
              where: { id: payload.transactionId },
              data: {
                status: 'error' as transactions_status,
                updatedAt: new Date(),
              },
            });
            throw new Error('Conta de origem não encontrada');
          }

          const account = lockedAccount[0];
          const currentBalance = Number(account.balance ?? 0);
          const transactionAmount = Number(transaction.amount);

          if (Number.isNaN(currentBalance) || Number.isNaN(transactionAmount)) {
            ColoredLogger.error(
              '[PixCronosHandler] ❌',
              `Saldo ou valor da transação inválidos. balance=${account.balance?.toString() ?? 'null'}, amount=${transaction.amount?.toString() ?? 'null'}`,
            );
            await tx.transactions.update({
              where: { id: payload.transactionId },
              data: {
                status: 'error' as transactions_status,
                updatedAt: new Date(),
              },
            });
            throw new Error('Saldo ou valor da transação inválidos');
          }

          // 2. Verificar saldo novamente após lock (pode ter mudado)
          if (currentBalance < transactionAmount) {
            ColoredLogger.error(
              '[PixCronosHandler] ❌',
              `Saldo insuficiente após lock. balance=${currentBalance.toFixed(2)}, amount=${transactionAmount.toFixed(2)}`,
            );
            await tx.transactions.update({
              where: { id: payload.transactionId },
              data: {
                status: 'error' as transactions_status,
                updatedAt: new Date(),
              },
            });
            throw new Error('Saldo insuficiente após lock');
          }

          const newBalance = currentBalance - transactionAmount;

          // 3. Atualizar saldo e status da transação de forma atômica
          await tx.usersAccounts.update({
            where: { id: account.id },
            data: {
              balance: newBalance,
              updatedAt: new Date(),
            },
          });

          await tx.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'confirm' as transactions_status,
              updatedAt: new Date(),
            },
          });
        });

        ColoredLogger.success(
          '[PixCronosHandler] ✅',
          `Transferência PIX confirmada com sucesso - transactionId: ${payload.transactionId}, cronosId: ${transaction.cronosId}`,
        );
      } catch (error) {
        // Se falhar ao confirmar, atualizar transação com erro
        ColoredLogger.errorWithStack(
          '[PixCronosHandler] ❌ ERRO CRÍTICO',
          `Erro ao confirmar transferência PIX na API da Cronos - transactionId: ${payload.transactionId}`,
          error,
        );

        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });

        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Error processing PIX Cronos confirm job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(
          `Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
        );
      }

      throw error;
    }
  }
}
