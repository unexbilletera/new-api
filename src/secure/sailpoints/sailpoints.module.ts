import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SailpointsController } from './controllers/sailpoints.controller';
import { SailpointsService } from './services/sailpoints.service';

@Module({
  imports: [PrismaModule],
  controllers: [SailpointsController],
  providers: [SailpointsService],
  exports: [SailpointsService],
})
export class SailpointsModule {}
