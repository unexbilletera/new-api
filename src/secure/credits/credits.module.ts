import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CreditsController } from './controllers/credits.controller';
import { CreditsTypesController } from './controllers/credits-types.controller';
import { CreditsService } from './services/credits.service';
import { CreditsTypesService } from './services/credits-types.service';

@Module({
  imports: [PrismaModule],
  controllers: [CreditsController, CreditsTypesController],
  providers: [CreditsService, CreditsTypesService],
  exports: [CreditsService, CreditsTypesService],
})
export class CreditsModule {}
