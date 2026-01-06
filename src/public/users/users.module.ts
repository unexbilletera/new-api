import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ExchangeModule } from '../../shared/exchange/exchange.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { AppConfigModule } from '../../shared/config/config.module';
import { ValidaModule } from '../../shared/valida/valida.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { AccessLogModule } from '../../shared/access-log/access-log.module';
import { EmailModule } from '../../shared/email/email.module';
import { SystemVersionService } from '../../shared/helpers/system-version.service';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ExchangeModule,
    LoggerModule,
    AppConfigModule,
    ValidaModule,
    JwtModule,
    AccessLogModule,
    EmailModule,
  ],
  controllers: [UserController],
  providers: [UserService, SystemVersionService],
  exports: [UserService],
})
export class PublicUsersModule {}

