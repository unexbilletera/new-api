import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AccreditationsController } from './controllers/accreditations.controller';
import { AccreditationsService } from './services/accreditations.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccreditationsController],
  providers: [AccreditationsService],
  exports: [AccreditationsService],
})
export class AccreditationsModule {}
