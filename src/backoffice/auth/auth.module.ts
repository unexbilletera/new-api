import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { BackofficeUserModel } from './models/backoffice-user.model';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { BackofficeAuthGuard } from '../../shared/guards/backoffice-auth.guard';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService, BackofficeUserModel, BackofficeAuthGuard],
  exports: [AuthService],
})
export class BackofficeAuthModule {}

