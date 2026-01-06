import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class TermsModel {
  constructor(private prisma: PrismaService) {}

  async getTerms(termsId: string) {
    return this.prisma.terms.findUnique({
      where: { id: termsId },
    });
  }

  async listTerms(where: any = {}) {
    return this.prisma.terms.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLatestTerms(type: string) {
    return this.prisma.terms.findFirst({
      where: { type, isActive: true },
      orderBy: { version: 'desc' },
    });
  }

  async createTerms(data: any) {
    return this.prisma.terms.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async updateTerms(termsId: string, data: any) {
    return this.prisma.terms.update({
      where: { id: termsId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deactivateTerms(termsId: string) {
    return this.prisma.terms.update({
      where: { id: termsId },
      data: { isActive: false, updatedAt: new Date() },
    });
  }
}
