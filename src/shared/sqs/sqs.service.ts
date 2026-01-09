import { Injectable } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '../config/config.service';
import { ColoredLogger } from '../utils/logger-colors';

/**
 * Service para enviar mensagens para filas SQS
 */
@Injectable()
export class SqsService {
  private sqsClient: SQSClient | null = null;
  private queueUrl: string;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION') || 'us-east-2';
    this.queueUrl =
      this.configService.get('SQS_TRANSACTIONS_QUEUE_URL') ||
      process.env.SQS_TRANSACTIONS_QUEUE_URL ||
      '';

    // Configurar credenciais AWS se disponíveis
    const accessKeyId =
      this.configService.get('AWS_ACCESS_KEY_ID') ||
      process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      this.configService.get('AWS_SECRET_ACCESS_KEY') ||
      process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      // Usar credenciais explícitas se fornecidas
      this.sqsClient = new SQSClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
      ColoredLogger.info(
        '[SqsService]',
        'SQS configurado com credenciais explícitas (AWS_ACCESS_KEY_ID)',
      );
    } else if (this.queueUrl) {
      // Tentar usar credenciais padrão do AWS SDK
      // Isso funciona com:
      // - IAM Role (se rodando em EC2/ECS/Lambda)
      // - ~/.aws/credentials (se configurado localmente)
      // - Variáveis de ambiente AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (se configuradas pelo sistema)
      this.sqsClient = new SQSClient({ region });
      this.isConfigured = true;
      ColoredLogger.info(
        '[SqsService]',
        'SQS configurado. Tentando usar IAM role ou credenciais padrão do AWS SDK.',
      );
    }

    if (!this.queueUrl) {
      ColoredLogger.warning(
        '[SqsService] ⚠️',
        'SQS_TRANSACTIONS_QUEUE_URL não configurada. Mensagens SQS não serão enviadas.',
      );
    }
  }

  /**
   * Envia mensagem para fila de transações
   */
  async sendTransactionMessage(
    jobType: string,
    payload: Record<string, any>,
  ): Promise<{ messageId: string; requestId: string }> {
    if (!this.queueUrl) {
      throw new Error(
        'SQS_TRANSACTIONS_QUEUE_URL não configurada. Configure a variável de ambiente SQS_TRANSACTIONS_QUEUE_URL.',
      );
    }

    if (!this.isConfigured || !this.sqsClient) {
      throw new Error(
        'SQS não configurado. Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY ou use IAM role. Mensagem não foi enviada.',
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

      // Melhorar mensagem de erro para credenciais
      if (
        errorMessage.includes('credentials') ||
        errorMessage.includes('Could not load')
      ) {
        throw new Error(
          `Erro ao enviar mensagem para SQS: Credenciais AWS não encontradas. Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY ou use IAM role. Detalhes: ${errorMessage}`,
        );
      }

      throw new Error(`Erro ao enviar mensagem para SQS: ${errorMessage}`);
    }
  }
}
