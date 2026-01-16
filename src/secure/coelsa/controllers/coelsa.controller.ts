import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CoelsaService } from '../services/coelsa.service';
import {
  CoelsaProxyDto,
  CoelsaOperationDto,
  CoelsaMerchantDto,
} from '../dto/coelsa.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('5.7 COELSA (Argentina)')
@ApiBearerAuth('JWT-auth')
@Controller('coelsa')
@UseGuards(JwtAuthGuard)
export class CoelsaController {
  constructor(private readonly coelsaService: CoelsaService) {}

  @Get('operations/:id')
  @ApiOperation({ summary: 'Get operation status' })
  @ApiParam({ name: 'id', description: 'Operation ID' })
  @ApiResponse({
    status: 200,
    description: 'Operation status',
    type: CoelsaOperationDto,
  })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async getOperationStatus(@Param('id') id: string) {
    return this.coelsaService.getOperationStatus(id);
  }

  @Get('merchants/:cuit')
  @ApiOperation({ summary: 'Search merchant by CUIT' })
  @ApiParam({ name: 'cuit', description: 'CUIT number' })
  @ApiResponse({
    status: 200,
    description: 'Merchant details',
    type: CoelsaMerchantDto,
  })
  async getMerchantByCuit(@Param('cuit') cuit: string) {
    return this.coelsaService.getMerchantByCuit(cuit);
  }

  @Post('proxy/:api')
  @ApiOperation({ summary: 'Proxy request to COELSA API (admin)' })
  @ApiParam({ name: 'api', description: 'API endpoint' })
  @ApiResponse({ status: 200, description: 'Proxy response' })
  async proxy(@Param('api') api: string, @Body() body: any) {
    return this.coelsaService.proxyRequest(api, body);
  }

  @Get(':api/:type?')
  @ApiOperation({ summary: 'Echo/test endpoint' })
  @ApiParam({ name: 'api', description: 'API name' })
  @ApiParam({ name: 'type', required: false, description: 'Type' })
  @ApiResponse({ status: 200, description: 'Echo response' })
  async echo(@Param('api') api: string, @Param('type') type?: string) {
    return this.coelsaService.echo(api, type);
  }
}
