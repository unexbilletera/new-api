import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { StoresController } from './controllers/stores.controller';
import { StoresService } from './services/stores.service';

@Module({
  imports: [PrismaModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
