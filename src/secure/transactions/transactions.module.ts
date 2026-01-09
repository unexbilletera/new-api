import { Module } from '@nestjs/common';
import { PixCronosModule } from './pix-cronos/pix-cronos.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
@Module({
  imports: [PrismaModule, PixCronosModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureTransactionsModule {}

