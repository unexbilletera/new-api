import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VersionValidationResult {
  isValid: boolean;
  currentVersion?: string;
  minimumVersion?: string;
  message?: string;
}

@Injectable()
export class SystemVersionService {

  private readonly DEFAULT_MINIMUM_VERSION = '1.0.0';

  constructor(private configService: ConfigService) {}  getMinimumVersion(): string {
    return (
      this.configService.get<string>('MINIMUM_CLIENT_VERSION') ||
      this.DEFAULT_MINIMUM_VERSION
    );
  }  private versionToNumber(version: string): number {

    const cleaned = version.replace(/\./g, '');
    return parseInt(cleaned, 10) || 0;
  }  validateVersion(systemVersion?: string): VersionValidationResult {

    if (!systemVersion) {
      return { isValid: true };
    }

    const minimumVersion = this.getMinimumVersion();
    const currentVersionNum = this.versionToNumber(systemVersion);
    const minimumVersionNum = this.versionToNumber(minimumVersion);

    if (currentVersionNum < minimumVersionNum) {
      return {
        isValid: false,
        currentVersion: systemVersion,
        minimumVersion: minimumVersion,
        message: `Version obsoleta. Version mínima ${minimumVersion}`,
      };
    }

    return {
      isValid: true,
      currentVersion: systemVersion,
      minimumVersion: minimumVersion,
    };
  }  assertVersionValid(systemVersion?: string): void {
    const result = this.validateVersion(systemVersion);
    
    if (!result.isValid) {
      throw new BadRequestException(
        `Version obsoleta. Version mínima ${result.minimumVersion}`
      );
    }
  }
}
