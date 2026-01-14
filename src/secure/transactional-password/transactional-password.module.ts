import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LoggerModule } from '../../shared/logger/logger.module';
import { TransactionalPasswordController } from './controllers/transactional-password.controller';
import { TransactionalPasswordService } from './services/transactional-password.service';
import { TransactionalPasswordModel } from './models/transactional-password.model';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [TransactionalPasswordController],
  providers: [TransactionalPasswordService, TransactionalPasswordModel],
  exports: [TransactionalPasswordService],
})
export class TransactionalPasswordModule {}
