import {
  Controller,
  Get,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { AppInfoService } from '../services/app-info.service';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { CheckVersionQueryDto } from '../dto/app-info.dto';
import {
  FullAppInfoResponseDto,
  AppInfoResponseDto,
  VersionCheckResponseDto,
  NewsResponseDto,
  FeaturesResponseDto,
} from '../dto/response';

@Controller('app-info')
@UseGuards(AuthGuard)
export class AppInfoController {
  constructor(private readonly appInfoService: AppInfoService) {}

  @Get()
  async getFullInfo(@Headers('x-app-version') appVersion?: string): Promise<FullAppInfoResponseDto> {
    return this.appInfoService.getFullInfo(appVersion);
  }

  @Get('basic')
  async getBasicInfo(@Headers('x-app-version') appVersion?: string): Promise<AppInfoResponseDto> {
    return this.appInfoService.getAppInfo(appVersion);
  }

  @Get('version')
  async checkVersion(
    @Query() query: CheckVersionQueryDto,
    @Headers('x-app-version') headerVersion?: string,
  ): Promise<VersionCheckResponseDto> {
    const version = query.version || headerVersion || '1.0.0';
    return this.appInfoService.checkVersion(version, query.platform);
  }

  @Get('news')
  async getNews(): Promise<NewsResponseDto[]> {
    return this.appInfoService.getNews();
  }

  @Get('features')
  async getFeatures(): Promise<FeaturesResponseDto> {
    return this.appInfoService.getFeatures();
  }
}
