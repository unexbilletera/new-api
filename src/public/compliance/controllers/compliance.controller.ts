import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ComplianceService } from '../services/compliance.service';

@ApiTags('23. Compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('cvu-summary')
  @ApiOperation({ summary: 'Get CVU summary for BCRA compliance' })
  @ApiHeader({ name: 'x-passphrase', description: 'Compliance passphrase' })
  @ApiHeader({ name: 'x-secret', description: 'Compliance secret' })
  @ApiResponse({ status: 200, description: 'CVU summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCvuSummary(
    @Headers('x-passphrase') passphrase: string,
    @Headers('x-secret') secret: string,
  ) {
    return this.complianceService.getCvuSummary(passphrase, secret);
  }

  @Get('cvu-history')
  @ApiOperation({ summary: 'Get CVU history for BCRA compliance' })
  @ApiHeader({ name: 'x-passphrase', description: 'Compliance passphrase' })
  @ApiHeader({ name: 'x-secret', description: 'Compliance secret' })
  @ApiResponse({ status: 200, description: 'CVU history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCvuHistory(
    @Headers('x-passphrase') passphrase: string,
    @Headers('x-secret') secret: string,
  ) {
    return this.complianceService.getCvuHistory(passphrase, secret);
  }
}
