import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ExchangeModule as SharedExchangeModule } from '../../shared/exchange/exchange.module';
import { SpendingLimitsModule } from '../../shared/spending-limits/spending-limits.module';
import { MantecaModule } from '../../shared/manteca/manteca.module';
import { ExchangeController } from './controllers/exchange.controller';
import { ExchangeService } from './services/exchange.service';
import { RateCodeService } from './services/rate-code.service';

@Module({
  imports: [
    PrismaModule,
    SharedExchangeModule,
    SpendingLimitsModule,
    MantecaModule,
  ],
  controllers: [ExchangeController],
  providers: [ExchangeService, RateCodeService],
  exports: [ExchangeService, RateCodeService],
})
export class SecureExchangeModule {}
