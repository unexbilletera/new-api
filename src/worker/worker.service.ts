import { Injectable } from '@nestjs/common';
import { SqsReceiverService } from '../shared/sqs/sqs-receiver.service';
import { LoggerService } from '../shared/logger/logger.service';
import { PixCronosHandler } from './handlers/pix-cronos.handler';

/**
 * Service principal do worker
 * Responsável por processar mensagens da fila SQS
 */
@Injectable()
export class WorkerService {
  private isRunning = false;

  constructor(
    private sqsReceiver: SqsReceiverService,
    private logger: LoggerService,
    private pixCronosHandler: PixCronosHandler,
  ) {}

  /**
   * Inicia o worker para processar mensagens
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Worker já está rodando');
      return;
    }

    this.isRunning = true;
    this.logger.info('Worker iniciado. Aguardando mensagens da fila SQS...');

    // Loop principal do worker
    while (this.isRunning) {
      try {
        await this.processMessages();
      } catch (error) {
        this.logger.error(`Erro no loop principal do worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Aguardar antes de tentar novamente
        await this.sleep(5000);
      }
    }
  }

  /**
   * Para o worker
   */
  stop(): void {
    this.isRunning = false;
    this.logger.info('Worker parado');
  }

  /**
   * Processa mensagens da fila SQS
   */
  private async processMessages(): Promise<void> {
    // Receber mensagens da fila (long polling)
    const messages = await this.sqsReceiver.receiveMessages(1, 20);

    if (messages.length === 0) {
      // Nenhuma mensagem disponível, aguardar um pouco antes de tentar novamente
      await this.sleep(1000);
      return;
    }

    // Processar cada mensagem
    for (const message of messages) {
      try {
        await this.processMessage(message);
      } catch (error) {
        this.logger.error(`Erro ao processar mensagem: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Não deletar a mensagem em caso de erro, ela ficará na fila para retry
      }
    }
  }

  /**
   * Processa uma mensagem individual
   */
  private async processMessage(message: { ReceiptHandle?: string }): Promise<void> {
    const parsed = this.sqsReceiver.parseMessage(message);

    if (!parsed) {
      this.logger.warn('Mensagem inválida ou não parseável');
      // Deletar mensagem inválida para não ficar na fila
      if (message.ReceiptHandle) {
        await this.sqsReceiver.deleteMessage(message.ReceiptHandle);
      }
      return;
    }

    this.logger.info(`Processando job: ${parsed.jobType} (MessageId: ${parsed.messageId})`);

    try {
      // Rotear para o handler apropriado
      await this.routeJob(parsed.jobType, parsed.payload);

      // Deletar mensagem após processamento bem-sucedido
      await this.sqsReceiver.deleteMessage(parsed.receiptHandle);
      this.logger.info(`Job ${parsed.jobType} processado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao processar job ${parsed.jobType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Não deletar mensagem em caso de erro - ela ficará na fila para retry
      throw error;
    }
  }

  /**
   * Roteia jobs para os handlers apropriados
   */
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

  /**
   * Aguarda um tempo em milissegundos
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

