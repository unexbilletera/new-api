import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { MicronautaController } from './controllers/micronauta.controller';
import { MicronautaService } from './services/micronauta.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [MicronautaController],
  providers: [MicronautaService],
  exports: [MicronautaService],
})
export class MicronautaModule {}
