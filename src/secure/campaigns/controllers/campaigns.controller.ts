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
import {
  CampaignValidationResponseDto,
  UseCampaignResponseDto,
  ListUserCampaignsResponseDto,
} from '../dto/response';

@Controller('campaigns')
@UseGuards(AuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('validate/:code')
  async validateByParam(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ): Promise<CampaignValidationResponseDto> {
    return this.campaignsService.validateCode(userId, code);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateByBody(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCampaignCodeDto,
  ): Promise<CampaignValidationResponseDto> {
    return this.campaignsService.validateCode(userId, dto.code);
  }

  @Post('use')
  @HttpCode(HttpStatus.OK)
  async useCode(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCampaignCodeDto,
  ): Promise<UseCampaignResponseDto> {
    return this.campaignsService.useCode(userId, dto.code);
  }

  @Get('my')
  async myUsedCampaigns(@CurrentUser('id') userId: string): Promise<ListUserCampaignsResponseDto> {
    return this.campaignsService.listUserCampaigns(userId);
  }
}
