import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/prisma/prisma.module';
import { BoletoGireController } from './controllers/boleto-gire.controller';
import { BoletoGireService } from './services/boleto-gire.service';

@Module({
  imports: [PrismaModule],
  controllers: [BoletoGireController],
  providers: [BoletoGireService],
  exports: [BoletoGireService],
})
export class BoletoGireModule {}
