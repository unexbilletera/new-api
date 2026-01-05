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

@Controller('app-info')
@UseGuards(AuthGuard)
export class AppInfoController {
  constructor(private readonly appInfoService: AppInfoService) {}  @Get()
  async getFullInfo(@Headers('x-app-version') appVersion?: string) {
    return this.appInfoService.getFullInfo(appVersion);
  }  @Get('basic')
  async getBasicInfo(@Headers('x-app-version') appVersion?: string) {
    return this.appInfoService.getAppInfo(appVersion);
  }  @Get('version')
  async checkVersion(
    @Query() query: CheckVersionQueryDto,
    @Headers('x-app-version') headerVersion?: string,
  ) {
    const version = query.version || headerVersion || '1.0.0';
    return this.appInfoService.checkVersion(version, query.platform);
  }  @Get('news')
  async getNews() {
    return this.appInfoService.getNews();
  }  @Get('features')
  async getFeatures() {
    return this.appInfoService.getFeatures();
  }
}
