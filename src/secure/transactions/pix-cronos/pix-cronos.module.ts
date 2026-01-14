import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { SqsModule } from '../../../shared/sqs/sqs.module';
import { CronosModule } from '../../../shared/cronos/cronos.module';
import { JwtModule } from '../../../shared/jwt/jwt.module';
import { PixCronosController } from './controllers/pix-cronos.controller';
import { PixCronosService } from './services/pix-cronos.service';
import { PixCronosTransactionModel } from './models/pix-cronos-transaction.model';
import { TransactionalPasswordModule } from '../../transactional-password/transactional-password.module';

@Module({
  imports: [
    PrismaModule,
    SqsModule,
    CronosModule,
    JwtModule,
    TransactionalPasswordModule,
  ],
  controllers: [PixCronosController],
  providers: [PixCronosService, PixCronosTransactionModel],
  exports: [PixCronosService],
})
export class PixCronosModule {}
