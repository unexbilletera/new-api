import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationModel } from './models/notification.model';
import { NotificationsMapper } from './mappers/notifications.mapper';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { JwtModule } from '../../shared/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationModel, NotificationsMapper],
  exports: [NotificationsService, NotificationModel, NotificationsMapper],
})
export class SecureNotificationsModule {}

