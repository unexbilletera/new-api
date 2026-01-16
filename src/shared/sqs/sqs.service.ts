import { Injectable } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SqsService {
  private sqsClient: SQSClient | null = null;
  private queueUrl: string;
  private isConfigured: boolean = false;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const region = this.configService.get('AWS_REGION') || 'us-east-2';
    this.queueUrl =
      this.configService.get('SQS_TRANSACTIONS_QUEUE_URL') ||
      process.env.SQS_TRANSACTIONS_QUEUE_URL ||
      '';

    const accessKeyId =
      this.configService.get('AWS_ACCESS_KEY_ID') ||
      process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      this.configService.get('AWS_SECRET_ACCESS_KEY') ||
      process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      this.sqsClient = new SQSClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
      this.logger.info(
        '[SqsService]',
        'SQS configured with explicit credentials (AWS_ACCESS_KEY_ID)',
      );
    } else if (this.queueUrl) {
      this.sqsClient = new SQSClient({ region });
      this.isConfigured = true;
      this.logger.info(
        '[SqsService]',
        'SQS configured. Trying IAM role or default AWS SDK credentials.',
      );
    }

    if (!this.queueUrl) {
      this.logger.warn(
        '[SqsService]',
        'SQS_TRANSACTIONS_QUEUE_URL not configured. SQS messages will not be sent.',
      );
    }
  }

  async sendTransactionMessage(
    jobType: string,
    payload: Record<string, any>,
  ): Promise<{ messageId: string; requestId: string }> {
    if (!this.queueUrl) {
      throw new Error(
        'SQS_TRANSACTIONS_QUEUE_URL is not configured. Set the SQS_TRANSACTIONS_QUEUE_URL environment variable.',
      );
    }

    if (!this.isConfigured || !this.sqsClient) {
      throw new Error(
        'SQS is not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY or use an IAM role. Message was not sent.',
      );
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (
        errorMessage.includes('credentials') ||
        errorMessage.includes('Could not load')
      ) {
        throw new Error(
          `Error sending message to SQS: AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY or use an IAM role. Details: ${errorMessage}`,
        );
      }

      throw new Error(`Error sending message to SQS: ${errorMessage}`);
    }
  }
}
