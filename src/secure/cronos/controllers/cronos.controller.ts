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
import { CronosOperationsService } from '../services/cronos-operations.service';
import {
  SetUserPixDto,
  RemoveUserPixDto,
  PaymentModesDto,
  SendTransactionalTokenDto,
  CronosProxyDto,
  PixKeyResponseDto,
} from '../dto/cronos.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('5.5 Cronos (Brasil)')
@Controller('cronos')
export class CronosController {
  constructor(
    private readonly cronosOperationsService: CronosOperationsService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Cronos health check' })
  @ApiResponse({ status: 200, description: 'Cronos service healthy' })
  async health() {
    return this.cronosOperationsService.getHealth();
  }

  @Post('sendTransactionalToken')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send transactional token to user' })
  @ApiResponse({ status: 200, description: 'Token sent' })
  async sendTransactionalToken(
    @Body() dto: SendTransactionalTokenDto,
    @Request() req: any,
  ) {
    return this.cronosOperationsService.sendTransactionalToken(
      req.user.id,
      req.user.defaultUserIdentityId,
      dto.document,
    );
  }

  @Get('rechargeCompanies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get recharge companies' })
  @ApiResponse({ status: 200, description: 'Recharge companies list' })
  async getRechargeCompanies() {
    return this.cronosOperationsService.getRechargeCompanies();
  }

  @Post('paymentModes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment modes for a company' })
  @ApiResponse({ status: 200, description: 'Payment modes' })
  async getPaymentModes(@Body() dto: PaymentModesDto) {
    return this.cronosOperationsService.getPaymentModes(dto);
  }

  @Post('setUserPix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Register user PIX key' })
  @ApiResponse({
    status: 200,
    description: 'PIX key registered',
    type: PixKeyResponseDto,
  })
  async setUserPix(@Body() dto: SetUserPixDto, @Request() req: any) {
    return this.cronosOperationsService.setUserPix(
      req.user.id,
      req.user.defaultUserIdentityId,
      dto,
    );
  }

  @Post('removeUserPix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove user PIX key' })
  @ApiResponse({ status: 200, description: 'PIX key removed' })
  async removeUserPix(@Body() dto: RemoveUserPixDto, @Request() req: any) {
    return this.cronosOperationsService.removeUserPix(
      req.user.id,
      req.user.defaultUserIdentityId,
      dto,
    );
  }

  @Post('proxy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Proxy request to Cronos API (admin)' })
  @ApiResponse({ status: 200, description: 'Proxy response' })
  async proxy(@Body() dto: CronosProxyDto) {
    return this.cronosOperationsService.proxyRequest(
      dto.endpoint,
      dto.method,
      dto.body,
    );
  }
}
