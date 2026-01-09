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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CampaignsService } from '../services/campaigns.service';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ValidateCampaignCodeDto } from '../dto/campaigns.dto';
import {
  CampaignValidationResponseDto,
  UseCampaignResponseDto,
  ListUserCampaignsResponseDto,
} from '../dto/response';

@ApiTags('campaigns')
@ApiBearerAuth('JWT-auth')
@Controller('campaigns')
@UseGuards(AuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('validate/:code')
  @ApiOperation({
    summary: 'Validate campaign code via parameter',
    description: 'Validates a campaign code through the route parameter and checks if it is available for the user',
  })
  @ApiParam({
    name: 'code',
    description: 'Campaign code to be validated',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Code validated successfully',
    type: CampaignValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or unavailable code',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async validateByParam(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ): Promise<CampaignValidationResponseDto> {
    return this.campaignsService.validateCode(userId, code);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate campaign code via body',
    description: 'Validates a campaign code through the request body and checks if it is available for the user',
  })
  @ApiBody({
    type: ValidateCampaignCodeDto,
    description: 'Campaign code data to be validated',
  })
  @ApiResponse({
    status: 200,
    description: 'Code validated successfully',
    type: CampaignValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or unavailable code',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async validateByBody(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCampaignCodeDto,
  ): Promise<CampaignValidationResponseDto> {
    return this.campaignsService.validateCode(userId, dto.code);
  }

  @Post('use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Use campaign code',
    description: 'Applies a valid campaign code for the user, activating its benefits',
  })
  @ApiBody({
    type: ValidateCampaignCodeDto,
    description: 'Campaign code data to be used',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign code applied successfully',
    type: UseCampaignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid, already used or unavailable code',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async useCode(
    @CurrentUser('id') userId: string,
    @Body() dto: ValidateCampaignCodeDto,
  ): Promise<UseCampaignResponseDto> {
    return this.campaignsService.useCode(userId, dto.code);
  }

  @Get('my')
  @ApiOperation({
    summary: 'List my campaigns',
    description: 'Returns the list of campaigns that the user has already used',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaigns list retrieved successfully',
    type: ListUserCampaignsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async myUsedCampaigns(@CurrentUser('id') userId: string): Promise<ListUserCampaignsResponseDto> {
    return this.campaignsService.listUserCampaigns(userId);
  }
}
