import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SandboxController } from './controllers/sandbox.controller';
import { SandboxService } from './services/sandbox.service';

@Module({
  imports: [PrismaModule],
  controllers: [SandboxController],
  providers: [SandboxService],
  exports: [SandboxService],
})
export class SandboxModule {}
