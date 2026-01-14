import { Module } from '@nestjs/common';
import { PixCronosModule } from './pix-cronos/pix-cronos.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { TransactionalPasswordModule } from '../transactional-password/transactional-password.module';
@Module({
  imports: [PrismaModule, PixCronosModule, TransactionalPasswordModule],
  controllers: [],
  providers: [],
  exports: [TransactionalPasswordModule],
})
export class SecureTransactionsModule {}
