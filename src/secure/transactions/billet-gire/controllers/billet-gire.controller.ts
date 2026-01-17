import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { BilletGireService } from '../services/billet-gire.service';

@ApiTags('2.1 Secure - Transactions')
@Controller('transactions/billet/gire')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BilletGireController {
  constructor(private billetGireService: BilletGireService) {}
}
