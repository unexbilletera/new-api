import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../../shared/logger/logger.service';

@Injectable()
export class BilletGireService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}
}
