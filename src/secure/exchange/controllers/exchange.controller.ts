import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ExchangeService } from '../services/exchange.service';
import {
  ConvertDto,
  BulkRatesDto,
  PreviewDto,
  ConfirmDto,
  ExchangeRatesResponseDto,
  ConvertResponseDto,
  PreviewResponseDto,
  ConfirmResponseDto,
} from '../dto/exchange.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('5.2 Exchange')
@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get current exchange rates (public)' })
  @ApiResponse({
    status: 200,
    description: 'Current exchange rates',
    type: ExchangeRatesResponseDto,
  })
  async getRates() {
    return this.exchangeService.getRates();
  }

  @Post('convert')
  @ApiOperation({ summary: 'Calculate conversion (public)' })
  @ApiResponse({
    status: 200,
    description: 'Conversion calculation',
    type: ConvertResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async convert(@Body() dto: ConvertDto) {
    return this.exchangeService.convert(dto);
  }

  @Post('bulk-rates')
  @ApiOperation({ summary: 'Get rates for multiple amounts (public)' })
  @ApiResponse({ status: 200, description: 'Bulk rates calculation' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async bulkRates(@Body() dto: BulkRatesDto) {
    return this.exchangeService.getBulkRates(dto);
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create exchange preview with rate code (authenticated)',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange preview with rate code',
    type: PreviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async preview(@Body() dto: PreviewDto, @Request() req: any) {
    return this.exchangeService.preview(dto, req.user.id);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm exchange with rate code (authenticated)' })
  @ApiResponse({
    status: 200,
    description: 'Exchange confirmed',
    type: ConfirmResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid rate code or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async confirm(@Body() dto: ConfirmDto, @Request() req: any) {
    return this.exchangeService.confirm({
      rateCode: dto.rateCode,
      userId: req.user.id,
      userIdentityId: req.user.defaultUserIdentityId,
      sourceAccountId: dto.sourceAccountId || req.user.defaultUserAccountId,
      targetAccountId: dto.targetAccountId,
    });
  }
}
