import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CrudModule } from '../../shared/crud/crud.module';
import { CardsController } from './controllers/cards.controller';
import { CardsService } from './services/cards.service';

@Module({
  imports: [PrismaModule, CrudModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
