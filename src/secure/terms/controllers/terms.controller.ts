import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TermsService } from '../services/terms.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AcceptTermDto, ServiceType } from '../dto/terms.dto';
import {
  TermCheckResponseDto,
  TermAcceptanceResponseDto,
  CheckAllRequiredResponseDto,
  AcceptTermResponseDto,
} from '../dto/response';

@ApiTags('2.3 Secure - Terms')
@ApiBearerAuth('JWT-auth')
@Controller('terms')
@UseGuards(JwtAuthGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get(':serviceType')
  @ApiOperation({
    summary: 'Check service terms',
    description: 'Checks if the user has accepted the terms of use for a specific service',
  })
  @ApiParam({
    name: 'serviceType',
    description: 'Service type for terms verification',
    enum: ServiceType,
  })
  @ApiResponse({
    status: 200,
    description: 'Verification performed successfully',
    type: TermCheckResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async check(
    @CurrentUser('id') userId: string,
    @Param('serviceType') serviceType: ServiceType,
  ): Promise<TermCheckResponseDto> {
    return this.termsService.check(userId, serviceType);
  }

  @Get('acceptances/list')
  @ApiOperation({
    summary: 'List term acceptances',
    description: 'Returns the list of all terms accepted by the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Acceptances list retrieved successfully',
    type: [TermAcceptanceResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async listAcceptances(@CurrentUser('id') userId: string): Promise<TermAcceptanceResponseDto[]> {
    return this.termsService.listAcceptances(userId);
  }

  @Get('required/check')
  @ApiOperation({
    summary: 'Check required terms',
    description: 'Checks if the user has accepted all required terms of the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification performed successfully',
    type: CheckAllRequiredResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async checkRequired(@CurrentUser('id') userId: string): Promise<CheckAllRequiredResponseDto> {
    return this.termsService.checkAllRequired(userId);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept terms',
    description: 'Marks the terms as accepted by the user',
  })
  @ApiBody({
    type: AcceptTermDto,
    description: 'Term acceptance data',
  })
  @ApiResponse({
    status: 200,
    description: 'Terms accepted successfully',
    type: AcceptTermResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async accept(
    @CurrentUser('id') userId: string,
    @Body() dto: AcceptTermDto,
    @Req() req: Request,
  ): Promise<AcceptTermResponseDto> {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.termsService.accept(userId, dto, ipAddress);
  }
}
