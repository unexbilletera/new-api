import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SecureExchangeModule {}

