import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SpendingLimitsService } from '../services/spending-limits.service';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AssignProfileDto } from '../dto/assign-profile.dto';
import { ReviewAlertDto } from '../dto/review-alert.dto';
import {
  ListProfilesQueryDto,
  ListIdentitiesQueryDto,
  ListAlertsQueryDto,
} from '../dto/list-query.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import {
  BackofficeRoleGuard,
  MinLevel,
} from '../../../shared/guards/backoffice-role.guard';

@ApiTags('4.7 Backoffice - Spending Limits')
@ApiBearerAuth('JWT-auth')
@Controller('backoffice/spending-limits')
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
export class SpendingLimitsController {
  constructor(private readonly spendingLimitsService: SpendingLimitsService) {}

  @Get('profiles')
  @MinLevel(2)
  @ApiOperation({ summary: 'List spending limit profiles' })
  @ApiResponse({ status: 200, description: 'Profiles list' })
  async listProfiles(@Query() query: ListProfilesQueryDto) {
    return this.spendingLimitsService.listProfiles(query);
  }

  @Get('profiles/:id')
  @MinLevel(2)
  @ApiOperation({ summary: 'Get spending limit profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile details' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Param('id') id: string) {
    return this.spendingLimitsService.getProfile(id);
  }

  @Post('profiles')
  @MinLevel(3)
  @ApiOperation({ summary: 'Create spending limit profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createProfile(@Body() dto: CreateProfileDto) {
    return this.spendingLimitsService.createProfile(dto);
  }

  @Put('profiles/:id')
  @MinLevel(3)
  @ApiOperation({ summary: 'Update spending limit profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.spendingLimitsService.updateProfile(id, dto);
  }

  @Put('profiles/:id/set-default')
  @MinLevel(4)
  @ApiOperation({ summary: 'Set profile as default' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile set as default' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async setDefaultProfile(@Param('id') id: string) {
    return this.spendingLimitsService.setDefaultProfile(id);
  }

  @Delete('profiles/:id')
  @MinLevel(4)
  @ApiOperation({ summary: 'Delete spending limit profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile deleted' })
  @ApiResponse({ status: 400, description: 'Profile is in use' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async deleteProfile(@Param('id') id: string) {
    return this.spendingLimitsService.deleteProfile(id);
  }

  @Get('identities')
  @MinLevel(2)
  @ApiOperation({ summary: 'List identities with spending limits' })
  @ApiResponse({ status: 200, description: 'Identities list' })
  async listIdentities(@Query() query: ListIdentitiesQueryDto) {
    return this.spendingLimitsService.listIdentities(query);
  }

  @Put('users/:userId/profile')
  @MinLevel(3)
  @ApiOperation({ summary: 'Update user profile assignment' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile assigned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() dto: AssignProfileDto,
  ) {
    return this.spendingLimitsService.updateUserProfile(userId, dto.profileId);
  }

  @Post('users/:userId/assign-profile')
  @MinLevel(3)
  @ApiOperation({ summary: 'Assign profile to user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile assigned' })
  @ApiResponse({ status: 404, description: 'User or profile not found' })
  async assignProfileToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignProfileDto,
  ) {
    return this.spendingLimitsService.updateUserProfile(userId, dto.profileId);
  }

  @Get('alerts')
  @MinLevel(2)
  @ApiOperation({ summary: 'List spending limit alerts' })
  @ApiResponse({ status: 200, description: 'Alerts list' })
  async listAlerts(@Query() query: ListAlertsQueryDto) {
    return this.spendingLimitsService.listAlerts(query);
  }

  @Get('alerts/pending')
  @MinLevel(2)
  @ApiOperation({ summary: 'Get pending alerts' })
  @ApiResponse({ status: 200, description: 'Pending alerts list' })
  async getPendingAlerts() {
    return this.spendingLimitsService.getPendingAlerts();
  }

  @Put('alerts/:id')
  @MinLevel(3)
  @ApiOperation({ summary: 'Review alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert reviewed' })
  @ApiResponse({ status: 400, description: 'Alert already reviewed' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async reviewAlert(
    @Param('id') id: string,
    @Body() dto: ReviewAlertDto,
    @Request() req: any,
  ) {
    const reviewerId = req.user?.id || req.backofficeUser?.id;
    return this.spendingLimitsService.reviewAlert(id, dto, reviewerId);
  }
}
