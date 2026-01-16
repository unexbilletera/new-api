import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { BenefitsController } from './controllers/benefits.controller';
import { BenefitsService } from './services/benefits.service';

@Module({
  imports: [PrismaModule],
  controllers: [BenefitsController],
  providers: [BenefitsService],
  exports: [BenefitsService],
})
export class BenefitsModule {}
