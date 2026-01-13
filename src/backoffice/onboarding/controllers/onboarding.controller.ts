import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import {
  BackofficeRoleGuard,
  MinLevel,
} from '../../../shared/guards/backoffice-role.guard';
import { OnboardingService } from '../services/onboarding.service';
import {
  ListOnboardingQueryDto,
  RejectUserDto,
  ApproveUserDto,
  RequestCorrectionDto,
} from '../dto/onboarding.dto';

@ApiTags('3.3 Backoffice - Onboarding')
@ApiBearerAuth()
@UseGuards(BackofficeAuthGuard, BackofficeRoleGuard)
@Controller('backoffice/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users in onboarding' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Status do onboarding',
  })
  @ApiQuery({ name: 'country', required: false, description: 'Country' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome ou email',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit per page' })
  @MinLevel(1)
  async listUsers(@Query() query: ListOnboardingQueryDto) {
    return this.onboardingService.listUsers(query);
  }

  @Get('pending')
  @ApiOperation({ summary: 'List users pending approval' })
  @MinLevel(1)
  async getPendingUsers(@Query() query: ListOnboardingQueryDto) {
    return this.onboardingService.getPendingUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'User details in onboarding' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @MinLevel(1)
  async getUserDetails(@Param('id') id: string) {
    return this.onboardingService.getUserDetails(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @MinLevel(2)
  async updateUserInfo(@Param('id') id: string, @Body() data: any) {
    return this.onboardingService.updateUserInfo(id, data);
  }

  @Post('users/:id/approve')
  @ApiOperation({ summary: 'Approve user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @MinLevel(2)
  async approveUser(@Param('id') id: string, @Body() dto: ApproveUserDto) {
    return this.onboardingService.approveUser(id, dto);
  }

  @Post('users/:id/reject')
  @ApiOperation({ summary: 'Reject user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @MinLevel(2)
  async rejectUser(@Param('id') id: string, @Body() dto: RejectUserDto) {
    return this.onboardingService.rejectUser(id, dto);
  }

  @Post('users/:id/request-correction')
  @ApiOperation({ summary: 'Request information correction' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @MinLevel(2)
  async requestCorrection(
    @Param('id') id: string,
    @Body() dto: RequestCorrectionDto,
  ) {
    return this.onboardingService.requestCorrection(id, dto);
  }
}
