import { Injectable } from '@nestjs/common';
import { SqsReceiverService } from '../shared/sqs/sqs-receiver.service';
import { LoggerService } from '../shared/logger/logger.service';
import { PixCronosHandler } from './handlers/pix-cronos.handler';

@Injectable()
export class WorkerService {
  private isRunning = false;

  constructor(
    private sqsReceiver: SqsReceiverService,
    private logger: LoggerService,
    private pixCronosHandler: PixCronosHandler,
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Worker já está rodando');
      return;
    }

    this.isRunning = true;
    this.logger.info('Worker iniciado. Aguardando mensagens da fila SQS...');

    while (this.isRunning) {
      try {
        await this.processMessages();
      } catch (error) {
        this.logger.error(`Erro no loop principal do worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await this.sleep(5000);
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    this.logger.info('Worker parado');
  }

  private async processMessages(): Promise<void> {
    const messages = await this.sqsReceiver.receiveMessages(1, 20);

    if (messages.length === 0) {
      await this.sleep(1000);
      return;
    }

    for (const message of messages) {
      try {
        await this.processMessage(message);
      } catch (error) {
        this.logger.error(`Erro ao processar mensagem: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async processMessage(message: { ReceiptHandle?: string }): Promise<void> {
    const parsed = this.sqsReceiver.parseMessage(message);

    if (!parsed) {
      this.logger.warn('Mensagem inválida ou não parseável');
      if (message.ReceiptHandle) {
        await this.sqsReceiver.deleteMessage(message.ReceiptHandle);
      }
      return;
    }

    this.logger.info(`Processando job: ${parsed.jobType} (MessageId: ${parsed.messageId})`);

    try {
      await this.routeJob(parsed.jobType, parsed.payload);

      await this.sqsReceiver.deleteMessage(parsed.receiptHandle);
      this.logger.info(`Job ${parsed.jobType} processado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar job ${parsed.jobType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async routeJob(jobType: string, payload: any): Promise<void> {
    switch (jobType) {
      case 'pix_cronos_create':
        await this.pixCronosHandler.handleCreate(payload);
        break;

      case 'pix_cronos_confirm':
        await this.pixCronosHandler.handleConfirm(payload);
        break;

      default:
        this.logger.warn(`Tipo de job desconhecido: ${jobType}`);
        throw new Error(`Tipo de job desconhecido: ${jobType}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

