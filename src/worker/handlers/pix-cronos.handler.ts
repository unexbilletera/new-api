import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoggerService } from '../../shared/logger/logger.service';
import type { transactions_status } from '../../../generated/prisma';

/**
 * Handler para processar jobs PIX Cronos
 */
@Injectable()
export class PixCronosHandler {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
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

      // Aqui você deve:
      // 1. Buscar dados necessários (conta, identidade, chave PIX)
      // 2. Chamar API da Cronos para criar a transferência PIX
      // 3. Atualizar transação com cronosId retornado
      // 4. Atualizar status para 'confirm' ou 'error'

      // TODO: Implementar integração com API da Cronos
      // Por enquanto, apenas simulamos sucesso após 2 segundos
      this.logger.info(`Simulating PIX transfer to Cronos API...`);

      // Simulação: aguardar um pouco (simular chamada à API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Substituir por chamada real à API da Cronos
      const cronosId = `cronos-${Date.now()}`;

      // Atualizar transação com cronosId e status
      await this.prisma.transactions.update({
        where: { id: payload.transactionId },
        data: {
          cronosId,
          status: 'confirm' as transactions_status,
          updatedAt: new Date(),
        },
      });

      this.logger.info(`PIX Cronos confirm job processed successfully for transaction: ${payload.transactionId}. CronosId: ${cronosId}`);
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

