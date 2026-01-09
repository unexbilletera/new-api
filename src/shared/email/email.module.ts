import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../config/config.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    PrismaModule,
    AppConfigModule,
    NotificationsModule,
    LoggerModule,
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
