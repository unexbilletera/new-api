import {
  Controller,
  Get,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { AppInfoService } from '../services/app-info.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CheckVersionQueryDto } from '../dto/app-info.dto';
import {
  FullAppInfoResponseDto,
  AppInfoResponseDto,
  VersionCheckResponseDto,
  NewsResponseDto,
  FeaturesResponseDto,
} from '../dto/response';

@ApiTags('2.3 Secure - App Info')
@ApiBearerAuth('JWT-auth')
@Controller('app-info')
@UseGuards(JwtAuthGuard)
export class AppInfoController {
  constructor(private readonly appInfoService: AppInfoService) {}

  @Get()
  @ApiOperation({
    summary: 'Get complete application information',
    description: 'Returns all application information including version, news and features',
  })
  @ApiHeader({
    name: 'x-app-version',
    description: 'Current application version',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete information retrieved successfully',
    type: FullAppInfoResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getFullInfo(@Headers('x-app-version') appVersion?: string): Promise<FullAppInfoResponseDto> {
    return this.appInfoService.getFullInfo(appVersion);
  }

  @Get('basic')
  @ApiOperation({
    summary: 'Get basic application information',
    description: 'Returns basic application information without news and features',
  })
  @ApiHeader({
    name: 'x-app-version',
    description: 'Current application version',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Basic information retrieved successfully',
    type: AppInfoResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getBasicInfo(@Headers('x-app-version') appVersion?: string): Promise<AppInfoResponseDto> {
    return this.appInfoService.getAppInfo(appVersion);
  }

  @Get('version')
  @ApiOperation({
    summary: 'Check application version',
    description: 'Checks if the current application version is up to date and returns information about available updates',
  })
  @ApiQuery({
    name: 'version',
    description: 'Application version to be checked',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'platform',
    description: 'Application platform (ios, android, etc)',
    required: false,
    type: String,
  })
  @ApiHeader({
    name: 'x-app-version',
    description: 'Current application version (alternative to query param)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Version check performed successfully',
    type: VersionCheckResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async checkVersion(
    @Query() query: CheckVersionQueryDto,
    @Headers('x-app-version') headerVersion?: string,
  ): Promise<VersionCheckResponseDto> {
    const version = query.version || headerVersion || '1.0.0';
    return this.appInfoService.checkVersion(version, query.platform);
  }

  @Get('news')
  @ApiOperation({
    summary: 'Get application news',
    description: 'Returns the list of news and updates available in the application',
  })
  @ApiResponse({
    status: 200,
    description: 'News list retrieved successfully',
    type: [NewsResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getNews(): Promise<NewsResponseDto[]> {
    return this.appInfoService.getNews();
  }

  @Get('features')
  @ApiOperation({
    summary: 'Get available features',
    description: 'Returns the list of available and enabled features in the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Features list retrieved successfully',
    type: FeaturesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getFeatures(): Promise<FeaturesResponseDto> {
    return this.appInfoService.getFeatures();
  }
}
