import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

export interface ValidaEnrollment {
  url?: string;
  enrollment_id?: string;
  id?: string;
  enrollment?: {
    id?: string;
    status?: string;
  };
  status?: string;
}

export interface ValidaEnrollmentInfo {
  enrollment?: {
    status?: string;
  };
  images?: {
    selfie?: string;
  };
}

@Injectable()
export class ValidaService {
  private token: { token: string; expires_at: Date } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly appConfigService: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  isEnabled(): boolean {
    return this.appConfigService.isValidaEnabled();
  }

  private async getToken(): Promise<string> {
    const validaConfig = this.appConfigService.getValidaConfig();

    if (!validaConfig.enable) {
      throw new Error('Valida not available');
    }

    if (!validaConfig.apiUrl) {
      throw new Error('Missing apiUrl. Invalid config');
    }

    if (!validaConfig.username || !validaConfig.password) {
      throw new Error('Missing username or password. Invalid config');
    }

    if (this.token && this.token.expires_at > new Date()) {
      return this.token.token;
    }

    const body = {
      email: validaConfig.username,
      password: validaConfig.password,
    };

    const response = await fetch(`${validaConfig.apiUrl}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Valida token request failed: ${response.status}`);
      this.logger.error('[VALIDA] Token request failed', error, {
        status: response.status,
        errorData,
      });
      throw error;
    }

    const data = await response.json();
    const token = data.authorisation;

    const expiresAt = new Date(
      Date.now() + (validaConfig.tokenTimeoutMin * 60 - 60) * 1000,
    );

    this.token = { token, expires_at: expiresAt };

    if (validaConfig.logging) {
      this.logger.info('[VALIDA] Token obtained successfully', {
        expiresAt: expiresAt.toISOString(),
      });
    }

    return token;
  }

  private async request<T>(params: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    action: string;
    body?: any;
  }): Promise<T> {
    const validaConfig = this.appConfigService.getValidaConfig();

    if (!validaConfig.enable) {
      throw new Error('Valida not available');
    }

    if (!validaConfig.apiUrl) {
      throw new Error('Missing apiUrl. Invalid config');
    }

    const token = await this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
    };

    if (validaConfig.logging) {
      this.logger.info('[VALIDA] Request', {
        url: `${validaConfig.apiUrl}${params.action}`,
        method: params.method,
        body: params.body,
      });
    }

    const response = await fetch(`${validaConfig.apiUrl}${params.action}`, {
      method: params.method,
      headers,
      body: params.body ? JSON.stringify(params.body) : undefined,
    });

    const responseData = await response.json().catch(() => ({}));

    if (response.status > 299) {
      const errorObj = new Error(
        responseData?.error_message?.message ||
          responseData?.error ||
          response.statusText ||
          'Valida API error',
      );
      (errorObj as any).statusCode = response.status;
      (errorObj as any).errorCode = responseData?.error_code;
      (errorObj as any).fullResponse = responseData;

      this.logger.error('[VALIDA] Request failed', errorObj, {
        statusCode: response.status,
        statusText: response.statusText,
        error: responseData?.error || responseData?.error_message,
        errorCode: responseData?.error_code,
        fullResponse: responseData,
      });

      throw errorObj;
    }

    if (validaConfig.logging) {
      this.logger.info('[VALIDA] Request success', responseData);
    }

    return responseData as T;
  }

  async createEnrollment(params: {
    refId: string;
    enrollmentFlow?: string;
    dni?: string;
    gender?: string;
    baseUrl?: string;
    apiPath?: string;
  }): Promise<ValidaEnrollment> {
    const validaConfig = this.appConfigService.getValidaConfig();

    if (!params.refId) {
      throw new Error('refId is required');
    }

    const baseUrl = params.baseUrl || this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
    const apiPath = params.apiPath || '/api';
    const validaEndpoint = `${baseUrl}${apiPath}/valida/`;

    const body = {
      external_ref_id: String(params.refId),
      dni: params.dni,
      gender: params.gender,
      enrollment_flow: params.enrollmentFlow || validaConfig.enrollmentFlow,
      config: JSON.stringify({
        cancel_url: validaEndpoint + 'redirection/cancel',
        redirect_url: validaEndpoint + 'redirection/redirect',
        webhook_url: validaEndpoint + 'webhook',
        theme: validaConfig.theme,
        hide_qr: validaConfig.hideQr,
        disable_file_upload: validaConfig.disableFileUpload,
        allow_id_recovery: validaConfig.allowIdRecovery,
      }),
    };

    this.logger.info('[VALIDA] Creating enrollment', {
      refId: params.refId,
      enrollmentFlow: body.enrollment_flow,
    });

    const result = await this.request<ValidaEnrollment>({
      method: 'POST',
      action: '/enrollment/create',
      body,
    });

    if (result && result.url) {
      const urlParts = result.url.split('/').filter(Boolean);
      const extractedId = urlParts[urlParts.length - 1];
      this.logger.info('[VALIDA] Enrollment created', {
        refId: params.refId,
        url: result.url,
        extractedId,
      });
    }

    return result;
  }

  async getEnrollmentInfo(params: {
    refId: string;
    hideImages?: boolean;
  }): Promise<ValidaEnrollmentInfo> {
    return this.request<ValidaEnrollmentInfo>({
      method: 'GET',
      action: `/enrollment/info?external_ref_id=${params.refId}${params.hideImages ? '&hide_images=true' : ''}`,
    });
  }

  async getEnrollmentStatus(params: {
    refId: string;
  }): Promise<ValidaEnrollment> {
    return this.request<ValidaEnrollment>({
      method: 'GET',
      action: `/enrollment/status?external_ref_id=${params.refId}`,
    });
  }
}
