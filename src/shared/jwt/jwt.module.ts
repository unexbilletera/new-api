import { Global, Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { JwtService } from './jwt.service';

@Global()
@Module({
  imports: [
    NestJwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as StringValue,
      },
    }),
  ],
  providers: [JwtService],
  exports: [JwtService, NestJwtModule],
})
export class JwtModule {}

