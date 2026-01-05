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
import { TermsService } from '../services/terms.service';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AcceptTermDto, ServiceType } from '../dto/terms.dto';

@Controller('terms')
@UseGuards(AuthGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}  @Get(':serviceType')
  async check(
    @CurrentUser('id') userId: string,
    @Param('serviceType') serviceType: ServiceType,
  ) {
    return this.termsService.check(userId, serviceType);
  }  @Get('acceptances/list')
  async listAcceptances(@CurrentUser('id') userId: string) {
    return this.termsService.listAcceptances(userId);
  }  @Get('required/check')
  async checkRequired(@CurrentUser('id') userId: string) {
    return this.termsService.checkAllRequired(userId);
  }  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser('id') userId: string,
    @Body() dto: AcceptTermDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.termsService.accept(userId, dto, ipAddress);
  }
}
