import { Module } from '@nestjs/common';
import { TermsController } from './controllers/terms.controller';
import { TermsService } from './services/terms.service';
import { TermsModel } from './models/terms.model';
import { TermsMapper } from './mappers/terms.mapper';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [TermsController],
  providers: [TermsService, TermsModel, TermsMapper],
  exports: [TermsService, TermsModel, TermsMapper],
})
export class TermsModule {}
