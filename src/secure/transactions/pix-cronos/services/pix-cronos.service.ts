import { Injectable } from '@nestjs/common';
import { SqsService } from '../../../../shared/sqs/sqs.service';
import { CronosService } from '../../../../shared/cronos/cronos.service';
import { PixCronosTransactionModel } from '../models/pix-cronos-transaction.model';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import { ErrorCodes, ErrorHelper } from '../../../../shared/errors/app-error';
import { LoggerService } from '../../../../shared/logger/logger.service';
import { TransactionalPasswordService } from '../../../transactional-password/services/transactional-password.service';

@Injectable()
export class PixCronosService {
  constructor(
    private transactionModel: PixCronosTransactionModel,
    private sqsService: SqsService,
    private cronosService: CronosService,
    private logger: LoggerService,
    private transactionalPasswordService: TransactionalPasswordService,
  ) {}

  async createTransaction(
    userId: string,
    dto: CreatePixCronosDto,
    idempotencyKey?: string,
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
      // Check for existing transaction with same idempotency key
      if (idempotencyKey) {
        const existingTransaction =
          await this.transactionModel.findByIdempotencyKey(
            userId,
            idempotencyKey,
          );

        if (existingTransaction) {
          this.logger.info(
            '[PixCronosService]',
            `Returning existing transaction for idempotencyKey: ${idempotencyKey}`,
          );
          return {
            id: existingTransaction.id,
            status: existingTransaction.status,
            amount: existingTransaction.amount
              ? Number(existingTransaction.amount)
              : 0,
            createdAt: existingTransaction.createdAt,
            targetName: existingTransaction.targetName || undefined,
            targetAlias: existingTransaction.targetAlias || undefined,
            targetTaxDocumentNumber:
              existingTransaction.targetTaxDocumentNumber || undefined,
            targetTaxDocumentType:
              existingTransaction.targetTaxDocumentType || undefined,
            targetBank: existingTransaction.targetBank || undefined,
            targetAccountNumber:
              existingTransaction.targetAccountNumber || undefined,
          };
        }
      }

      const { identity } = await this.transactionModel.findSourceAccount(
        userId,
        dto.sourceAccountId,
      );

      if (!identity || !identity.id) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_SOURCE_IDENTITY,
        );
      }

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
        this.logger.errorWithStack(
          '[PixCronosService] CRITICAL',
          'Failed to fetch recipient info from Cronos API',
          error,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_TARGET_USER_ACCOUNT,
          'Error fetching recipient information from Cronos API',
        );
      }

      const transaction = await this.transactionModel.create({
        userId,
        amount: dto.amount,
        sourceAccountId: dto.sourceAccountId,
        sourceIdentityId: identity.id,
        sourceTaxDocumentNumber: identity.taxDocumentNumber || '',
        targetKeyType: dto.targetKeyType,
        targetKeyValue: dto.targetKeyValue,
        description: dto.description,
        idempotencyKey,
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
      this.logger.errorWithStack(
        '[PixCronosService] CRITICAL',
        'Failed to create PIX transaction',
        error,
      );
      throw error;
    }
  }

  async confirmTransaction(
    userId: string,
    transactionId: string,
    transactionalPassword?: string,
  ): Promise<{
    id: string;
    status: string;
    message: string;
  }> {
    try {
      const transaction = await this.transactionModel.findPendingById(
        transactionId,
        userId,
      );

      const userHasPassword =
        await this.transactionalPasswordService.hasPassword(userId);
      if (userHasPassword) {
        if (!transactionalPassword) {
          this.logger.warn(
            `[PixCronosService] Transaction confirmation attempted without transactional password - userId: ${userId}`,
            'confirmTransaction',
          );
          throw ErrorHelper.badRequest(
            ErrorCodes.TRANSACTIONAL_PASSWORD_NOT_PROVIDED,
            'Transactional password is required to confirm this transaction',
          );
        }

        const isPasswordValid =
          await this.transactionalPasswordService.validatePassword(
            userId,
            transactionalPassword,
          );

        if (!isPasswordValid) {
          this.logger.warn(
            `[PixCronosService] Transaction confirmation failed - invalid transactional password - userId: ${userId}`,
            'confirmTransaction',
          );
          throw ErrorHelper.badRequest(
            ErrorCodes.TRANSACTIONAL_PASSWORD_INCORRECT,
            'Invalid transactional password',
          );
        }
      } else {
        this.logger.warn(
          `[PixCronosService] Transaction confirmation attempted without transactional password configured - userId: ${userId}`,
          'confirmTransaction',
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONAL_PASSWORD_NOT_CREATED,
          'You must create a transactional password first. Please use the transactional password creation endpoint.',
        );
      }

      await this.transactionModel.updateStatus(transaction.id, 'process');

      try {
        await this.sqsService.sendTransactionMessage('pix_cronos_confirm', {
          transactionId: transactionId,
          userId: userId,
        });
      } catch (error) {
        this.logger.errorWithStack(
          '[PixCronosService] CRITICAL',
          'Failed to send confirmation to SQS',
          error,
        );

        await this.transactionModel.updateStatus(transactionId, 'pending');

        throw ErrorHelper.internalServerError(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Error sending confirmation for processing',
        );
      }

      return {
        id: transactionId,
        status: 'process',
        message: 'Transaction sent for processing',
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[PixCronosService] CRITICAL',
        'Failed to confirm PIX transaction',
        error,
      );
      throw error;
    }
  }
}
