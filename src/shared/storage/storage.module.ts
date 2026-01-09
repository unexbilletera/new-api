import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { S3Service } from './s3.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class StorageModule {}
