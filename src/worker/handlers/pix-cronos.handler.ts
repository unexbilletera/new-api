import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { CronosService } from '../../shared/cronos/cronos.service';
import { ColoredLogger } from '../../shared/utils/logger-colors';
import type { transactions_status } from '../../../generated/prisma';

/**
 * Handler para processar jobs PIX Cronos
 */
@Injectable()
export class PixCronosHandler {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private cronosService: CronosService,
  ) {}

  /**
   * Processa job de criação de transação PIX Cronos
   * Este job é executado após criar a transação inicial
   * Responsabilidade: Validar dados, preparar para confirmação
   */
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
    this.logger.info(`Processing PIX Cronos create for transaction: ${payload.transactionId}`);

    try {
      // Buscar transação
      const transaction = await this.prisma.transactions.findUnique({
        where: { id: payload.transactionId },
      });

      if (!transaction) {
        this.logger.error(`Transaction not found: ${payload.transactionId}`);
        return;
      }

      // Validar dados básicos
      if (transaction.status !== 'pending') {
        this.logger.warn(`Transaction ${payload.transactionId} is not pending. Status: ${transaction.status}`);
        return;
      }

      // Aqui você pode adicionar validações adicionais:
      // - Validar saldo da conta
      // - Validar limites de transação
      // - Validar chave PIX
      // - Preparar dados para envio à API da Cronos

      // Por enquanto, apenas logamos que o job foi processado
      // O status permanece como 'pending' até o usuário confirmar
      this.logger.info(`PIX Cronos create job processed successfully for transaction: ${payload.transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing PIX Cronos create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Atualizar transação com erro
      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(`Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
      
      throw error;
    }
  }

  /**
   * Processa job de confirmação de transação PIX Cronos
   * Este job é executado após o usuário confirmar a transação
   * Responsabilidade: Enviar para API da Cronos, atualizar status
   */
  async handleConfirm(payload: {
    transactionId: string;
    userId: string;
  }): Promise<void> {
    this.logger.info(`Processing PIX Cronos confirm for transaction: ${payload.transactionId}`);

    try {
      // Buscar transação
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

      // Validar status
      if (transaction.status !== 'process') {
        this.logger.warn(`Transaction ${payload.transactionId} is not in process status. Status: ${transaction.status}`);
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
        const confirmResult = await this.cronosService.confirmTransferPix({
          document: transaction.sourceTaxDocumentNumber,
          id: transaction.cronosId,
          amount: Number(transaction.amount),
          description: transaction.reason || 'Transferência PIX',
        });

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
        if (!transaction.sourceAccountId) {
          ColoredLogger.error(
            '[PixCronosHandler] ❌',
            `Transação ${payload.transactionId} não possui sourceAccountId. Não é possível debitar saldo.`,
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

        // Buscar conta de origem para obter saldo atual
        const sourceAccount = await this.prisma.usersAccounts.findUnique({
          where: { id: transaction.sourceAccountId },
        });

        if (!sourceAccount) {
          ColoredLogger.error(
            '[PixCronosHandler] ❌',
            `Conta de origem não encontrada para transactionId: ${payload.transactionId}, sourceAccountId: ${transaction.sourceAccountId}`,
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

        const currentBalance = Number(sourceAccount.balance ?? 0);
        const transactionAmount = Number(transaction.amount);

        if (Number.isNaN(currentBalance) || Number.isNaN(transactionAmount)) {
          ColoredLogger.error(
            '[PixCronosHandler] ❌',
            `Saldo ou valor da transação inválidos. balance=${sourceAccount.balance}, amount=${transaction.amount}`,
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

        const newBalance = currentBalance - transactionAmount;

        // Atualizar saldo e status da transação de forma atômica
        await this.prisma.$transaction([
          this.prisma.usersAccounts.update({
            where: { id: sourceAccount.id },
            data: {
              balance: newBalance,
              updatedAt: new Date(),
            },
          }),
          this.prisma.transactions.update({
            where: { id: payload.transactionId },
            data: {
              status: 'confirm' as transactions_status,
              updatedAt: new Date(),
            },
          }),
        ]);

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
      this.logger.error(`Error processing PIX Cronos confirm job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Atualizar transação com erro
      try {
        await this.prisma.transactions.update({
          where: { id: payload.transactionId },
          data: {
            status: 'error' as transactions_status,
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.error(`Error updating transaction status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
      
      throw error;
    }
  }
}

