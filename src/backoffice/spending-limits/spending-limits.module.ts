import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SpendingLimitsController } from './controllers/spending-limits.controller';
import { SpendingLimitsService } from './services/spending-limits.service';

@Module({
  imports: [PrismaModule],
  controllers: [SpendingLimitsController],
  providers: [SpendingLimitsService],
  exports: [SpendingLimitsService],
})
export class BackofficeSpendingLimitsModule {}
