import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CampaignsService } from '../services/campaigns.service';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ValidateCampaignCodeDto } from '../dto/campaigns.dto';

@Controller('campaigns')
@UseGuards(AuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}  @Get('validate/:code')
  async validateByParam(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    return this.campaignsService.validateCode(userId, code);
  }  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateByBody(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCampaignCodeDto,
  ) {
    return this.campaignsService.validateCode(userId, dto.code);
  }  @Post('use')
  @HttpCode(HttpStatus.OK)
  async useCode(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCampaignCodeDto,
  ) {
    return this.campaignsService.useCode(userId, dto.code);
  }  @Get('my')
  async myUsedCampaigns(@CurrentUser('id') userId: string) {
    return this.campaignsService.listUserCampaigns(userId);
  }
}
