import { Injectable } from '@nestjs/common';
import { SqsService } from '../../../../shared/sqs/sqs.service';
import { CronosService } from '../../../../shared/cronos/cronos.service';
import { BilletCronosTransactionModel } from '../models/billet-cronos-transaction.model';
import { CreateBilletCronosDto } from '../dto/create-billet-cronos.dto';
import { ErrorCodes, ErrorHelper } from '../../../../shared/errors/app-error';
import { LoggerService } from '../../../../shared/logger/logger.service';
import { TransactionalPasswordService } from '../../../transactional-password/services/transactional-password.service';

@Injectable()
export class BilletCronosService {
  constructor(
    private transactionModel: BilletCronosTransactionModel,
    private sqsService: SqsService,
    private cronosService: CronosService,
    private logger: LoggerService,
    private transactionalPasswordService: TransactionalPasswordService,
  ) {}

  async createTransaction(
    userId: string,
    dto: CreateBilletCronosDto,
    idempotencyKey?: string,
  ): Promise<{
    id: string;
    status: string;
    amount: number;
    createdAt: Date;
    barcode: string;
    beneficiaryName?: string;
    beneficiaryDocument?: string;
    dueDate?: Date;
  }> {
    try {
      if (idempotencyKey) {
        const existingTransaction =
          await this.transactionModel.findByIdempotencyKey(
            userId,
            idempotencyKey,
          );

        if (existingTransaction) {
          this.logger.info(
            '[BilletCronosService]',
            `Returning existing transaction for idempotencyKey: ${idempotencyKey}`,
          );
          return {
            id: existingTransaction.id,
            status: existingTransaction.status,
            amount: existingTransaction.amount
              ? Number(existingTransaction.amount)
              : 0,
            createdAt: existingTransaction.createdAt,
            barcode: existingTransaction.reference || '',
            beneficiaryName: existingTransaction.targetName || undefined,
            beneficiaryDocument:
              existingTransaction.targetTaxDocumentNumber || undefined,
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

      if (!this.validateBarcode(dto.barcode)) {
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONS_INVALID_BILLET_BARCODE,
        );
      }

      let billetInfo: {
        amount: number;
        beneficiaryName?: string;
        beneficiaryDocument?: string;
        dueDate?: Date;
        cronosId?: string;
      } = {
        amount: dto.amount || 0,
      };

      try {
        const cronosResponse = await this.cronosService.consultBillet({
          document: identity.taxDocumentNumber || '',
          barcode: dto.barcode,
        });

        if (cronosResponse) {
          billetInfo = {
            amount: dto.amount || cronosResponse.valor || 0,
            beneficiaryName: cronosResponse.beneficiario?.nome,
            beneficiaryDocument: cronosResponse.beneficiario?.documento,
            dueDate: cronosResponse.vencimento
              ? new Date(cronosResponse.vencimento)
              : undefined,
            cronosId: cronosResponse.id_pagamento,
          };
        }
      } catch (cronosError) {
        this.logger.warn(
          '[BilletCronosService] WARNING',
          `Failed to consult billet in Cronos: ${cronosError instanceof Error ? cronosError.message : String(cronosError)}`,
        );
      }

      if (!billetInfo.amount || billetInfo.amount <= 0) {
        throw ErrorHelper.badRequest(ErrorCodes.TRANSACTIONS_INVALID_AMOUNT);
      }

      const transaction = await this.transactionModel.create({
        userId,
        amount: billetInfo.amount,
        sourceAccountId: dto.sourceAccountId,
        sourceIdentityId: identity.id,
        sourceTaxDocumentNumber: identity.taxDocumentNumber || '',
        barcode: dto.barcode,
        description: dto.description,
        beneficiaryName: billetInfo.beneficiaryName,
        beneficiaryDocument: billetInfo.beneficiaryDocument,
        dueDate: billetInfo.dueDate,
        cronosId: billetInfo.cronosId,
        idempotencyKey,
      });

      this.logger.info(
        '[BilletCronosService]',
        `Transaction created - id: ${transaction.id}, amount: ${billetInfo.amount}`,
      );

      return {
        id: transaction.id,
        status: transaction.status,
        amount: Number(transaction.amount),
        createdAt: transaction.createdAt,
        barcode: dto.barcode,
        beneficiaryName: billetInfo.beneficiaryName,
        beneficiaryDocument: billetInfo.beneficiaryDocument,
        dueDate: billetInfo.dueDate,
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[BilletCronosService] CRITICAL',
        'Failed to create billet transaction',
        error,
      );
      throw error;
    }
  }

  async confirmTransaction(
    userId: string,
    transactionId: string,
    transactionalPassword: string,
  ): Promise<{ id: string; status: string }> {
    try {
      const transaction = await this.transactionModel.findPendingById(
        transactionId,
        userId,
      );

      const sourceAccount = await this.transactionModel.findSourceAccount(
        userId,
        transaction.sourceAccountId || '',
      );

      await this.transactionalPasswordService.validatePassword(
        userId,
        transactionalPassword,
      );

      await this.transactionModel.updateStatus(transaction.id, 'process');

      await this.sqsService.sendTransactionMessage('BILLET_CRONOS_PAYMENT', {
        transactionId: transaction.id,
        userId,
        document: sourceAccount.identity.taxDocumentNumber || '',
        barcode: transaction.reference || '',
        amount: Number(transaction.amount),
        cronosId: transaction.cronosId || undefined,
      });

      this.logger.success(
        '[BilletCronosService] SUCCESS',
        `Transaction confirmed and sent to SQS - id: ${transaction.id}`,
      );

      return {
        id: transaction.id,
        status: 'process',
      };
    } catch (error) {
      this.logger.errorWithStack(
        '[BilletCronosService] CRITICAL',
        'Failed to confirm billet transaction',
        error,
      );
      throw error;
    }
  }

  private validateBarcode(barcode: string): boolean {
    if (!barcode || typeof barcode !== 'string') {
      return false;
    }

    const cleanBarcode = barcode.replace(/\D/g, '');

    // Boleto bancário: 47 dígitos (linha digitável) ou 44 dígitos (código de barras)
    // Boleto de concessionária: 48 dígitos (linha digitável) ou 44 dígitos (código de barras)
    if (![44, 47, 48].includes(cleanBarcode.length)) {
      return false;
    }

    return true;
  }
}
