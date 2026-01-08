import { Injectable } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SqsService {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION') || 'us-east-2';
    this.sqsClient = new SQSClient({ region });
    this.queueUrl =
      this.configService.get('SQS_TRANSACTIONS_QUEUE_URL') ||
      process.env.SQS_TRANSACTIONS_QUEUE_URL ||
      '';
  }

  async sendTransactionMessage(
    jobType: string,
    payload: Record<string, any>,
  ): Promise<{ messageId: string; requestId: string }> {
    if (!this.queueUrl) {
      throw new Error('SQS_TRANSACTIONS_QUEUE_URL não configurada');
    }

    const messageBody = JSON.stringify({
      jobType,
      payload,
      timestamp: new Date().toISOString(),
    });

    const params: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: messageBody,
      MessageAttributes: {
        JobType: {
          DataType: 'String',
          StringValue: jobType,
        },
      },
    };

    try {
      const command = new SendMessageCommand(params);
      const response = await this.sqsClient.send(command);

      return {
        messageId: response.MessageId || '',
        requestId: response.$metadata?.requestId || response.MessageId || '',
      };
    } catch (error) {
      throw new Error(
        `Erro ao enviar mensagem para SQS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

