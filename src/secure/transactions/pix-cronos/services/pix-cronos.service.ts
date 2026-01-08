import { Injectable } from '@nestjs/common';
import { SqsService } from '../../../../shared/sqs/sqs.service';
import { PixCronosTransactionModel } from '../models/pix-cronos-transaction.model';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import { ErrorCodes, ErrorHelper } from '../../../../shared/errors/app-error';

@Injectable()
export class PixCronosService {
  constructor(
    private transactionModel: PixCronosTransactionModel,
    private sqsService: SqsService,
  ) {}

  async createTransaction(
    userId: string,
    dto: CreatePixCronosDto,
  ): Promise<{
    id: string;
    status: string;
    amount: number;
    createdAt: Date;
  }> {
    const { identity } = await this.transactionModel.findSourceAccount(
      userId,
      dto.sourceAccountId,
    );

    const transaction = await this.transactionModel.create({
      userId,
      amount: dto.amount,
      sourceAccountId: dto.sourceAccountId,
      sourceIdentityId: identity.id,
      sourceTaxDocumentNumber: identity.taxDocumentNumber || '',
      targetKeyType: dto.targetKeyType,
      targetKeyValue: dto.targetKeyValue,
      description: dto.description,
    });

    try {
      await this.sqsService.sendTransactionMessage('pix_cronos_create', {
        transactionId: transaction.id,
        userId: userId,
        sourceAccountId: dto.sourceAccountId,
        sourceIdentityId: identity.id,
        amount: dto.amount,
        targetKeyType: dto.targetKeyType,
        targetKeyValue: dto.targetKeyValue,
        description: dto.description,
      });
    } catch {
      await this.transactionModel.updateStatus(transaction.id, 'error');

      throw ErrorHelper.internalServerError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Erro ao enviar transação para processamento',
      );
    }

    return {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount ? Number(transaction.amount) : 0,
      createdAt: transaction.createdAt,
    };
  }

  async confirmTransaction(
    userId: string,
    transactionId: string,
  ): Promise<{
    id: string;
    status: string;
    message: string;
  }> {
    const transaction = await this.transactionModel.findPendingById(
      transactionId,
      userId,
    );

    await this.transactionModel.updateStatus(transaction.id, 'process');

    try {
      await this.sqsService.sendTransactionMessage('pix_cronos_confirm', {
        transactionId: transactionId,
        userId: userId,
      });
    } catch {
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
  }
}
