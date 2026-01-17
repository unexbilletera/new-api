import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { SqsModule } from '../../../shared/sqs/sqs.module';
import { CronosModule } from '../../../shared/cronos/cronos.module';
import { JwtModule } from '../../../shared/jwt/jwt.module';
import { BilletCronosController } from './controllers/billet-cronos.controller';
import { BilletCronosService } from './services/billet-cronos.service';
import { BilletCronosTransactionModel } from './models/billet-cronos-transaction.model';
import { TransactionalPasswordModule } from '../../transactional-password/transactional-password.module';

@Module({
  imports: [
    PrismaModule,
    SqsModule,
    CronosModule,
    JwtModule,
    TransactionalPasswordModule,
  ],
  controllers: [BilletCronosController],
  providers: [BilletCronosService, BilletCronosTransactionModel],
  exports: [BilletCronosService],
})
export class BilletCronosModule {}
