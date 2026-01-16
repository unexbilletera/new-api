import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CrudBaseService } from './crud-base.service';

@Module({
  imports: [PrismaModule],
  providers: [CrudBaseService],
  exports: [CrudBaseService],
})
export class CrudModule {}
