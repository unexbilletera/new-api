import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { SqsModule } from '../../../shared/sqs/sqs.module';
import { JwtModule } from '../../../shared/jwt/jwt.module';
import { PixCronosController } from './controllers/pix-cronos.controller';
import { PixCronosService } from './services/pix-cronos.service';
import { PixCronosTransactionModel } from './models/pix-cronos-transaction.model';

@Module({
  imports: [PrismaModule, SqsModule, JwtModule],
  controllers: [PixCronosController],
  providers: [PixCronosService, PixCronosTransactionModel],
  exports: [PixCronosService],
})
export class PixCronosModule {}
