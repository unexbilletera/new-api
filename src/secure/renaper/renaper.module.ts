import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { RenaperController } from './controllers/renaper.controller';
import { RenaperService } from './services/renaper.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [RenaperController],
  providers: [RenaperService],
  exports: [RenaperService],
})
export class RenaperModule {}
