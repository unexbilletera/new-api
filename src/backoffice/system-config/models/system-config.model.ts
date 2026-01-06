import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class SystemConfigModel {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.system_config.findMany();
  }

  async findByKey(key: string) {
    return this.prisma.system_config.findFirst({
      where: { key },
    });
  }

  async update(key: string, value: string) {
    return this.prisma.system_config.update({
      where: { key },
      data: { value, updatedAt: new Date() },
    });
  }

  async create(key: string, value: string, description?: string) {
    return this.prisma.system_config.create({
      data: { key, value, description, createdAt: new Date(), updatedAt: new Date() },
    });
  }
}
