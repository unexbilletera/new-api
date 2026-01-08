import { Injectable } from '@nestjs/common';
import { SqsService } from '../../../../shared/sqs/sqs.service';
import { PixCronosTransactionModel } from '../models/pix-cronos-transaction.model';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import { ErrorCodes, ErrorHelper } from '../../../../shared/errors/app-error';

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
  ) {}

  /**
   * Cria uma transação PIX Cronos e envia para processamento assíncrono
   *
   * Fluxo: Service => Model (criar) => Service (SQS) => Controller
   */
  async createTransaction(
    userId: string,
    dto: CreatePixCronosDto,
  ): Promise<{
    id: string;
    status: string;
    amount: number;
    createdAt: Date;
  }> {
    // 1. Validar conta de origem (usa Model)
    const { identity } = await this.transactionModel.findSourceAccount(
      userId,
      dto.sourceAccountId,
    );

    // 2. Criar transação no banco (usa Model)
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

    // 3. Enviar mensagem para SQS para processamento assíncrono (lógica de negócio)
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
      // Se falhar ao enviar para SQS, atualizar transação com erro (usa Model)
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
    } catch {
      // Se falhar ao enviar para SQS, reverter status para 'pending' (usa Model)
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
