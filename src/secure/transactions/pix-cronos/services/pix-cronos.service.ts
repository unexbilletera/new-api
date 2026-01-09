import { Injectable } from '@nestjs/common';
import { SqsService } from '../../../../shared/sqs/sqs.service';
import { CronosService } from '../../../../shared/cronos/cronos.service';
import { PixCronosTransactionModel } from '../models/pix-cronos-transaction.model';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import { ErrorCodes, ErrorHelper } from '../../../../shared/errors/app-error';
import { ColoredLogger } from '../../../../shared/utils/logger-colors';

/**
 * Service para lógica de negócio de transações PIX Cronos
 * Responsável por: validações, regras de negócio, integração com SQS
 *
 * Fluxo: Controller => Service => Model => Service => Controller
 */
@Injectable()
export class PixCronosService {
  constructor(
    private transactionModel: PixCronosTransactionModel,
    private sqsService: SqsService,
    private cronosService: CronosService,
  ) {}

  /**
   * Cria uma transação PIX Cronos
   * Busca informações do destinatário na API da Cronos e salva a transação como 'pending'
   * O envio para SQS só acontece quando o usuário confirmar através do endpoint /confirm
   *
   * Fluxo: Service => Model (criar) => Controller
   */
  async createTransaction(
    userId: string,
    dto: CreatePixCronosDto,
  ): Promise<{
    id: string;
    status: string;
    amount: number;
    createdAt: Date;
    targetName?: string;
    targetAlias?: string;
    targetTaxDocumentNumber?: string;
    targetTaxDocumentType?: string;
    targetBank?: string;
    targetAccountNumber?: string;
  }> {
    try {
      // 1. Validar conta de origem (usa Model)
      const { identity } = await this.transactionModel.findSourceAccount(
        userId,
        dto.sourceAccountId,
      );

      // Garantir que identity não é null (já validado no Model, mas TypeScript precisa de confirmação)
      if (!identity || !identity.id) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

      // 2. Buscar informações do destinatário na API da Cronos
      let targetInfo: {
        targetName?: string;
        targetAlias?: string;
        targetTaxDocumentNumber?: string;
        targetTaxDocumentType?: string;
        targetBank?: string;
        targetAccountNumber?: string;
        cronosId?: string;
      } = {};

      try {
        const cronosResponse = await this.cronosService.transferPix({
          document: identity.taxDocumentNumber || '',
          keyType: dto.targetKeyType,
          keyValue: dto.targetKeyValue,
        });

        if (cronosResponse && cronosResponse.recebedor) {
          const recebedor = cronosResponse.recebedor;
          targetInfo = {
            targetName: recebedor.pessoa.nome.toUpperCase(),
            targetTaxDocumentType: recebedor.pessoa.tipoDocumento,
            targetTaxDocumentNumber: recebedor.pessoa.documento,
            targetAlias: `${dto.targetKeyType} ${dto.targetKeyValue}`,
            targetBank: recebedor.conta.bancoNome,
            targetAccountNumber: JSON.stringify({
              bank: recebedor.conta.banco,
              agency: recebedor.conta.agencia,
              number: recebedor.conta.numero,
            }),
            cronosId: cronosResponse.id_pagamento,
          };
        }
      } catch (error) {
        // Se falhar ao buscar informações do destinatário, lançar erro
        ColoredLogger.errorWithStack(
          '[PixCronosService] ❌ ERRO CRÍTICO',
          'Erro ao buscar informações do destinatário na API da Cronos',
          error,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_TARGET_USER_ACCOUNT,
          'Erro ao buscar informações do destinatário na API da Cronos',
        );
      }

      // 3. Criar transação no banco (usa Model)
      // IMPORTANTE: Não envia para SQS aqui. O envio para SQS só acontece quando
      // o usuário confirmar a transação através do endpoint /confirm
      const transaction = await this.transactionModel.create({
        userId,
        amount: dto.amount,
        sourceAccountId: dto.sourceAccountId,
        sourceIdentityId: identity.id,
        sourceTaxDocumentNumber: identity.taxDocumentNumber || '',
        targetKeyType: dto.targetKeyType,
        targetKeyValue: dto.targetKeyValue,
        description: dto.description,
        ...targetInfo,
      });

      const response = {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount ? Number(transaction.amount) : 0,
        createdAt: transaction.createdAt,
        targetName: transaction.targetName || undefined,
        targetAlias: transaction.targetAlias || undefined,
        targetTaxDocumentNumber:
          transaction.targetTaxDocumentNumber || undefined,
        targetTaxDocumentType: transaction.targetTaxDocumentType || undefined,
        targetBank: transaction.targetBank || undefined,
        targetAccountNumber: transaction.targetAccountNumber || undefined,
      };

      return response;
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[PixCronosService] ❌ ERRO CRÍTICO',
        'Erro ao criar transação PIX',
        error,
      );
      throw error;
    }
  }

  /**
   * Confirma uma transação PIX Cronos e envia para processamento assíncrono
   *
   * Fluxo: Service => Model (buscar) => Model (atualizar) => Service (SQS) => Controller
   */
  async confirmTransaction(
    userId: string,
    transactionId: string,
  ): Promise<{
    id: string;
    status: string;
    message: string;
  }> {
    try {
      // 1. Buscar transação pendente (usa Model)
      const transaction = await this.transactionModel.findPendingById(
        transactionId,
        userId,
      );

      // 2. Atualizar status para 'process' (aguardando processamento) (usa Model)
      await this.transactionModel.updateStatus(transaction.id, 'process');

      // 3. Enviar mensagem para SQS para processamento assíncrono (lógica de negócio)
      try {
        await this.sqsService.sendTransactionMessage('pix_cronos_confirm', {
          transactionId: transactionId,
          userId: userId,
        });
      } catch (error) {
        // Se falhar ao enviar para SQS, reverter status para 'pending' (usa Model)
        ColoredLogger.errorWithStack(
          '[PixCronosService] ❌ ERRO CRÍTICO',
          'Erro ao enviar confirmação para SQS',
          error,
        );

        await this.transactionModel.updateStatus(transactionId, 'pending');

        throw ErrorHelper.internalServerError(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Erro ao enviar confirmação para processamento',
        );
      }

      return {
        id: transactionId,
        status: 'process',
        message: 'Transação enviada para processamento',
      };
    } catch (error) {
      ColoredLogger.errorWithStack(
        '[PixCronosService] ❌ ERRO CRÍTICO',
        'Erro ao confirmar transação PIX',
        error,
      );
      throw error;
    }
  }
}
