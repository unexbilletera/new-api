import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ValidaController } from './controllers/valida.controller';
import { ValidaService } from './services/valida.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [ValidaController],
  providers: [ValidaService],
  exports: [ValidaService],
})
export class ValidaModule {}
