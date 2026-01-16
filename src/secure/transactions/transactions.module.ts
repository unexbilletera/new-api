import { Module } from '@nestjs/common';
import { PixCronosModule } from './cronos/pix-cronos/pix-cronos.module';
import { BoletoCronosModule } from './cronos/boleto/boleto-cronos.module';
import { BoletoGireModule } from './gire/boleto/boleto-gire.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
@Module({
  imports: [
    PrismaModule,
    PixCronosModule,
    BoletoCronosModule,
    BoletoGireModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureTransactionsModule {}

