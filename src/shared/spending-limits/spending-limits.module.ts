import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpendingLimitsService } from './spending-limits.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SpendingLimitsService],
  exports: [SpendingLimitsService],
})
export class SpendingLimitsModule {}
