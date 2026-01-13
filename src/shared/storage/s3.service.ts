import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('WALLET_FILES_KEY', '');
    const secretAccessKey = this.configService.get<string>(
      'WALLET_FILES_PASSWORD',
      '',
    );
    const region = this.configService.get<string>(
      'WALLET_FILES_REGION',
      'us-east-2',
    );

    this.s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    this.bucket = this.configService.get<string>('WALLET_FILES_BUCKET', '');
    this.publicUrl = this.configService.get<string>(
      'WALLET_FILES_PUBLIC_URL',
      '',
    );
  }

  async uploadBase64(params: {
    base64: string;
    name: string;
  }): Promise<string> {
    if (!params.base64) {
      throw new Error('Missing base64 parameter');
    }
    if (!params.name) {
      throw new Error('Missing name parameter');
    }

    const base64Data = Buffer.from(
      params.base64.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: params.name,
          Body: base64Data,
        }),
      );

      const result = `${this.publicUrl}/${params.name}`;
      this.logger.log(`S3 upload successful: ${result}`);
      return result;
    } catch (error) {
      this.logger.error('S3 upload error', error);
      throw error;
    }
  }
}
