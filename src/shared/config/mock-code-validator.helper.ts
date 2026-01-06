import { Injectable } from '@nestjs/common';
import { AppConfigService } from './config.service';

const bcrypt = require('bcrypt');

@Injectable()
export class MockCodeValidatorHelper {
  constructor(private readonly configService: AppConfigService) {}

  isMockEnabled(): boolean {
    return this.configService.isMockCodesEnabled();
  }

  isMockCode(code: string | null | undefined): boolean {
    return this.configService.isMockCode(code);
  }

  validateCode(code: string, storedCodeHash: string | null = null): boolean {
    if (this.isMockEnabled() && this.isMockCode(code)) {
      return true;
    }

    if (!storedCodeHash) {
      return false;
    }

    return bcrypt.compareSync(code, storedCodeHash);
  }

  validateMockCodeOnly(code: string): boolean {
    if (!this.isMockEnabled()) {
      return false;
    }

    return this.isMockCode(code);
  }
}
