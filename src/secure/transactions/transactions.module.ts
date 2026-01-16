import { Module } from '@nestjs/common';
import { PixCronosModule } from './cronos/pix-cronos/pix-cronos.module';
import { BoletoCronosModule } from './cronos/boleto/boleto-cronos.module';
import { BoletoGireModule } from './gire/boleto/boleto-gire.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { TransactionalPasswordModule } from '../transactional-password/transactional-password.module';
import { SpendingLimitsModule } from '../../shared/spending-limits/spending-limits.module';
import { SecureExchangeModule } from '../exchange/exchange.module';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TransactionCreationController } from './controllers/transaction-creation.controller';
import { TransactionCreationService } from './services/transaction-creation.service';

@Module({
  imports: [
    PrismaModule,
    PixCronosModule,
    TransactionalPasswordModule,
    SpendingLimitsModule,
    SecureExchangeModule,
    BoletoCronosModule,
    BoletoGireModule,
  ],
  controllers: [TransactionsController, TransactionCreationController],
  providers: [TransactionsService, TransactionCreationService],
  exports: [
    TransactionalPasswordModule,
    TransactionsService,
    TransactionCreationService,
  ],
})
export class SecureTransactionsModule {}
