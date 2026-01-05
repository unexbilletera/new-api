import { Module } from '@nestjs/common';
import { TermsController } from './controllers/terms.controller';
import { TermsService } from './services/terms.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}
