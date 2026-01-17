import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionValidationService } from './transaction-validation.service';

@Module({
  imports: [PrismaModule],
  providers: [TransactionValidationService],
  exports: [TransactionValidationService],
})
export class TransactionValidationModule {}
