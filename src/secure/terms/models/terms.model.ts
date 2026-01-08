import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class TermsModel {
  constructor(private prisma: PrismaService) {}
}
