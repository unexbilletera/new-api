import { Global, Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { JwtService } from './jwt.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Global()
@Module({
  imports: [
    ConfigModule, // Importa ConfigModule para ter acesso ao ConfigService
    NestJwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: configService.jwtExpiresIn as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtService],
  exports: [JwtService, NestJwtModule],
})
export class JwtModule {}

