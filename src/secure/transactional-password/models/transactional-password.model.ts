import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class TransactionalPasswordModel {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has transactional password configured
   */
  async hasPassword(userId: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { transactionalPassword: true },
    });

    return user ? !!user.transactionalPassword : false;
  }

  /**
   * Create transactional password for user
   */
  async create(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { transactionalPassword: hashedPassword },
    });
  }

  /**
   * Find hashed password by userId for validation
   */
  async findByUserId(userId: string): Promise<string | null> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { transactionalPassword: true },
    });

    return user?.transactionalPassword || null;
  }

  /**
   * Update transactional password
   */
  async update(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { transactionalPassword: hashedPassword },
    });
  }

  /**
   * Delete transactional password (for password reset if needed)
   */
  async delete(userId: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { transactionalPassword: null },
    });
  }
}
