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
      this.logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Worker started. Waiting for SQS queue messages...');

    while (this.isRunning) {
      try {
        await this.processMessages();
      } catch (error) {
        this.logger.error(
          `Error in worker main loop: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        await this.sleep(5000);
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    this.logger.info('Worker stopped');
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
        this.logger.error(
          `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  private async processMessage(message: {
    ReceiptHandle?: string;
  }): Promise<void> {
    const parsed = this.sqsReceiver.parseMessage(message);

    if (!parsed) {
      this.logger.warn('Invalid or non-parseable message');
      if (message.ReceiptHandle) {
        await this.sqsReceiver.deleteMessage(message.ReceiptHandle);
      }
      return;
    }

    this.logger.info(
      `Processing job: ${parsed.jobType} (MessageId: ${parsed.messageId})`,
    );

    try {
      await this.routeJob(parsed.jobType, parsed.payload);

      await this.sqsReceiver.deleteMessage(parsed.receiptHandle);
      this.logger.info(`Job ${parsed.jobType} processed successfully`);
    } catch (error) {
      this.logger.error(
        `Error processing job ${parsed.jobType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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
        this.logger.warn(`Unknown job type: ${jobType}`);
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
