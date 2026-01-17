import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { BilletGireController } from './controllers/billet-gire.controller';
import { BilletGireService } from './services/billet-gire.service';

@Module({
  imports: [PrismaModule],
  controllers: [BilletGireController],
  providers: [BilletGireService],
  exports: [BilletGireService],
})
export class BilletGireModule {}
