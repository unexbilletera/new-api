import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ComplianceController } from './controllers/compliance.controller';
import { ComplianceService } from './services/compliance.service';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
