import { Injectable } from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

interface SqsMessageBody {
  jobType?: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

@Injectable()
export class SqsReceiverService {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const region = this.configService.get('AWS_REGION') || 'us-east-2';
    this.sqsClient = new SQSClient({ region });
    this.queueUrl =
      this.configService.get('SQS_TRANSACTIONS_QUEUE_URL') ||
      process.env.SQS_TRANSACTIONS_QUEUE_URL ||
      '';

    if (!this.queueUrl) {
      this.logger.warn(
        'SQS_TRANSACTIONS_QUEUE_URL não configurada. Worker não irá processar mensagens.',
      );
    }
  }

  async receiveMessages(
    maxMessages: number = 1,
    waitTimeSeconds: number = 20,
  ): Promise<Message[]> {
    if (!this.queueUrl) {
      return [];
    }

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: waitTimeSeconds,
        MessageAttributeNames: ['All'],
      });

      const response = await this.sqsClient.send(command);
      return response.Messages || [];
    } catch (error) {
      this.logger.error(
        `Erro ao receber mensagens do SQS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    if (!this.queueUrl) {
      return;
    }

    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.sqsClient.send(command);
      this.logger.debug('Mensagem deletada da fila SQS');
    } catch (error) {
      this.logger.error(
        `Erro ao deletar mensagem do SQS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  parseMessage(message: Message): {
    jobType: string;
    payload: Record<string, unknown>;
    receiptHandle: string;
    messageId: string;
  } | null {
    if (!message.Body) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(message.Body);

      if (typeof parsed !== 'object' || parsed === null) {
        this.logger.error('Body da mensagem não é um objeto válido');
        return null;
      }

      const body = parsed as SqsMessageBody;

      return {
        jobType:
          body.jobType ||
          (message.MessageAttributes?.JobType?.StringValue as string) ||
          '',
        payload: body.payload || {},
        receiptHandle: message.ReceiptHandle || '',
        messageId: message.MessageId || '',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao fazer parse da mensagem: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }
}
