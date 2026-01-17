import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BoletoGireService } from '../services/boleto-gire.service';

@ApiTags('transactions')
@Controller('transactions/boleto/gire')
export class BoletoGireController {
  constructor(private readonly boletoGireService: BoletoGireService) {}
}
