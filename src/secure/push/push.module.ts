import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PushTokenController } from './controllers/push-token.controller';
import { PushDebugController } from './controllers/push-debug.controller';
import { PushService } from './services/push.service';

@Module({
  imports: [PrismaModule],
  controllers: [PushTokenController, PushDebugController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
