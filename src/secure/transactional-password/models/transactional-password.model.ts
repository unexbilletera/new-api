import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * TODO: Remove 'as any' casts after running migration to add transactionalPassword field
 * Migration: ALTER TABLE users ADD COLUMN transactionalPassword VARCHAR(255) NULL;
 */
@Injectable()
export class TransactionalPasswordModel {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has transactional password configured
   */
  async hasPassword(userId: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { transactionalPassword: true } as any,
    });

    return user ? !!(user as any).transactionalPassword : false;
  }

  /**
   * Create transactional password for user
   */
  async create(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { transactionalPassword: hashedPassword } as any,
    });
  }

  /**
   * Find hashed password by userId for validation
   */
  async findByUserId(userId: string): Promise<string | null> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { transactionalPassword: true } as any,
    });

    return (user as any)?.transactionalPassword || null;
  }

  /**
   * Update transactional password
   */
  async update(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { transactionalPassword: hashedPassword } as any,
    });
  }

  /**
   * Delete transactional password (for password reset if needed)
   */
  async delete(userId: string): Promise<void> {
    await this.prisma.users.update({
      where: { id: userId },
      data: { transactionalPassword: null } as any,
    });
  }
}
