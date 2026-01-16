import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async usersCheck() {
    this.logger.log('Executing users.check task via API');

    try {
      const users = await this.prisma.users.findMany({
        where: {
          deletedAt: null,
          status: 'pending',
        },
        take: 100,
      });

      this.logger.log(`Found ${users.length} pending users to check`);

      return {
        success: true,
        task: 'users.check',
        checked: users.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error('users.check task failed', error.message);
      return {
        success: false,
        task: 'users.check',
        error: error.message,
      };
    }
  }
}
