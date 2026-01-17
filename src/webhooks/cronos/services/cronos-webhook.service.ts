import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ColoredLogger } from '../../../shared/utils/logger-colors';
import { CronosWebhookDto } from '../dto/cronos-webhook.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CronosWebhookService {
  constructor(private prisma: PrismaService) {}

  /**
   * Processa webhook da Cronos
   * Busca transação existente ou cria nova transação cashin_cronos
   */
  async processWebhook(dto: CronosWebhookDto): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    try {
      ColoredLogger.info(
        '[CronosWebhookService]',
        `Processando webhook - id: ${dto.id}, amount: ${dto.amount}, EndToEnd: ${dto.EndToEnd}`,
      );

      // 1. Verificar se já existe transação com este cronosId (idempotência)
      const existingTransaction = await this.prisma.transactions.findFirst({
        where: {
          cronosId: dto.id,
        },
      });

      if (existingTransaction) {
        ColoredLogger.warning(
          '[CronosWebhookService]',
          `Transação já existe para cronosId ${dto.id} (idempotência) - transactionId: ${existingTransaction.id}`,
        );
        return {
          success: true,
          message: 'transaction_already_exists',
          transactionId: existingTransaction.id,
        };
      }

      // 2. Tentar encontrar transação pelo EndToEnd (mais confiável)
      if (dto.EndToEnd) {
        const transactionByEndToEnd =
          await this.prisma.transactions.findFirst({
            where: {
              reference: dto.EndToEnd,
              status: {
                in: ['pending', 'process'],
              },
            },
          });

        if (transactionByEndToEnd) {
          // Atualizar transação existente
          const updatedTransaction = await this.prisma.transactions.update({
            where: {
              id: transactionByEndToEnd.id,
            },
            data: {
              status: 'confirm',
              cronosId: dto.id,
              updatedAt: new Date(),
            },
          });

          // Creditar saldo se necessário
          if (transactionByEndToEnd.targetAccountId) {
            await this.prisma.usersAccounts.update({
              where: {
                id: transactionByEndToEnd.targetAccountId,
              },
              data: {
                balance: {
                  increment: parseFloat(dto.amount),
                },
              },
            });
          }

          ColoredLogger.success(
            '[CronosWebhookService]',
            `Transação atualizada - transactionId: ${updatedTransaction.id}`,
          );

          return {
            success: true,
            message: 'transaction_updated',
            transactionId: updatedTransaction.id,
          };
        }
      }

      // 3. Se não encontrou transação existente, criar nova cashin_cronos
      // Primeiro, encontrar a identidade do destinatário pelo customer_document
      if (!dto.customer_document) {
        throw new Error('customer_document is required to create new transaction');
      }

      const targetIdentity = await this.prisma.usersIdentities.findFirst({
        where: {
          taxDocumentNumber: dto.customer_document,
          country: 'br',
          status: 'enable',
        },
      });

      if (!targetIdentity) {
        ColoredLogger.warning(
          '[CronosWebhookService]',
          `Identidade não encontrada para customer_document: ${dto.customer_document}`,
        );
        // Por enquanto, apenas logar - em produção pode precisar criar transação para tesouraria
        return {
          success: false,
          message: 'target_identity_not_found',
        };
      }

      // Encontrar conta Cronos do destinatário
      const targetAccount = await this.prisma.usersAccounts.findFirst({
        where: {
          userIdentityId: targetIdentity.id,
          type: 'cronos',
          status: 'enable',
        },
      });

      if (!targetAccount) {
        throw new Error(
          `Target account not found for userIdentityId: ${targetIdentity.id}`,
        );
      }

      // Criar transação cashin_cronos
      const now = new Date();
      const newTransaction = await this.prisma.transactions.create({
        data: {
          id: randomUUID(),
          date: now,
          userId: targetIdentity.userId, // Usuário que recebeu o PIX
          type: 'cashin_cronos',
          status: 'confirm',
          amount: parseFloat(dto.amount),
          currency: 'BRL',
          sourceUserId: null, // PIX recebido de terceiro
          targetUserId: targetIdentity.userId,
          sourceAccountId: null,
          targetAccountId: targetAccount.id,
          sourceIdentityId: null,
          targetIdentityId: targetIdentity.id,
          reason: dto.description || 'Recebimento PIX via Cronos',
          reference: dto.EndToEnd || dto.id,
          cronosId: dto.id,
          createdAt: now,
          updatedAt: now,
        },
      });

      // Creditar saldo
      await this.prisma.usersAccounts.update({
        where: {
          id: targetAccount.id,
        },
        data: {
          balance: {
            increment: parseFloat(dto.amount),
          },
        },
      });

      ColoredLogger.success(
        '[CronosWebhookService]',
        `Nova transação criada - transactionId: ${newTransaction.id}`,
      );

      return {
        success: true,
        message: 'transaction_created',
        transactionId: newTransaction.id,
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[CronosWebhookService]',
        'Erro ao processar webhook',
        error,
      );
      throw error;
    }
  }
}
