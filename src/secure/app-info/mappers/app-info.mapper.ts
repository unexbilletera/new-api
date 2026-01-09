import { Injectable } from '@nestjs/common';
import {
  AppInfoResponseDto,
  NewsResponseDto,
  VersionCheckResponseDto,
  FeaturesResponseDto,
  FullAppInfoResponseDto,
} from '../dto/response';

@Injectable()
export class AppInfoMapper {
  toAppInfoResponseDto(
    minVersion: string,
    currentVersion: string,
    updateRequired: boolean,
    updateUrl: string | undefined,
    maintenanceMode: boolean,
    maintenanceMessage: string | undefined,
    features: Record<string, boolean>,
  ): AppInfoResponseDto {
    return {
      minVersion,
      currentVersion,
      updateRequired,
      updateUrl,
      maintenanceMode,
      maintenanceMessage,
      features,
    };
  }

  toNewsResponseDto(news: any): NewsResponseDto {
    return {
      id: news.id,
      title: news.title,
      message: news.message,
      imageUrl: news.imageUrl || undefined,
      actionUrl: news.actionUrl || undefined,
      actionLabel: news.actionLabel || undefined,
      priority: news.priority || 0,
      startDate: news.startDate || undefined,
      endDate: news.endDate || undefined,
      active: news.active,
      createdAt: news.createdAt,
    };
  }

  toNewsListResponseDto(newsList: any[]): NewsResponseDto[] {
    return newsList.map((n) => this.toNewsResponseDto(n));
  }

  toVersionCheckResponseDto(
    minVersion: string,
    currentVersion: string,
    userVersion: string,
    updateRequired: boolean,
    updateRecommended: boolean,
    updateUrl: string | undefined,
  ): VersionCheckResponseDto {
    return {
      minVersion,
      currentVersion,
      userVersion,
      updateRequired,
      updateRecommended,
      updateUrl,
    };
  }

  toFeaturesResponseDto(features: Record<string, boolean>): FeaturesResponseDto {
    return { features };
  }

  toFullAppInfoResponseDto(
    info: AppInfoResponseDto,
    news: NewsResponseDto[],
    features: Record<string, boolean>,
  ): FullAppInfoResponseDto {
    return {
      info,
      news,
      features,
    };
  }
}
