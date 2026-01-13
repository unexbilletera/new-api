import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface MantecaConfig {
  enable: boolean;
  logging: boolean;
  apiUrl: string;
  apiKey: string;
}

@Injectable()
export class MantecaService implements OnModuleInit {
  private readonly logger = new Logger(MantecaService.name);
  private config: MantecaConfig;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.loadConfig();
  }

  onModuleInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.config = {
      enable: this.configService.get<string>('WALLET_MANTECA', '') === 'enable',
      logging:
        this.configService.get<string>('WALLET_MANTECA_LOG', '') === 'enable',
      apiUrl: this.configService.get<string>('WALLET_MANTECA_URL', ''),
      apiKey: this.configService.get<string>('WALLET_MANTECA_KEY', ''),
    };
  }

  private async request(params: {
    method: string;
    action: string;
    body?: any;
  }): Promise<any> {
    if (!this.config.enable) {
      throw new Error('Manteca not available');
    }

    if (!this.config.apiUrl) {
      throw new Error('Missing apiUrl. Invalid config');
    }

    if (!this.config.apiKey) {
      throw new Error('Missing apiKey. Invalid config');
    }

    if (!params.action) {
      throw new Error('Missing action. Invalid parameters');
    }

    if (!params.method) {
      throw new Error('Missing method. Invalid parameters');
    }

    if (this.config.logging) {
      this.logger.log(
        `MANTECA request: ${params.method} ${params.action}`,
        params.body,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: params.method as any,
          url: `${this.config.apiUrl}${params.action}`,
          data: params.body,
          headers: {
            'md-api-key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (this.config.logging) {
        this.logger.log('MANTECA request success', response.data);
      }

      if (response.data && response.data.internalStatus) {
        this.logger.error('MANTECA request error', response.data);
        throw response.data;
      }

      return response.data;
    } catch (error: any) {
      this.logger.error('MANTECA request error', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async addUser(params: {
    externalId: string;
    email: string;
    legalId: string;
    type?: string;
    exchange?: string;
    name: string;
    surname: string;
    sex: string;
    work?: string;
    birthDate: string;
    isPep?: boolean;
    isFacta?: boolean;
    isFep?: boolean;
    phoneNumber: string;
    nationality: string;
    maritalStatus: string;
    street: string;
    postalCode: string;
    locality: string;
    province: string;
    numeration: string;
    floor?: string;
    apartment?: string;
    cbu?: string;
    currency?: string;
    description?: string;
    documentFrontImage?: string;
    documentBackImage?: string;
    selfie?: string;
  }): Promise<any> {
    if (!params.externalId) {
      throw new Error('Missing externalId. Invalid parameters');
    }
    if (!params.email) {
      throw new Error('Missing email. Invalid parameters');
    }
    if (!params.legalId) {
      throw new Error('Missing legalId. Invalid parameters');
    }
    if (!params.name) {
      throw new Error('Missing name. Invalid parameters');
    }
    if (!params.surname) {
      throw new Error('Missing surname. Invalid parameters');
    }
    if (!params.sex) {
      throw new Error('Missing sex. Invalid parameters');
    }
    if (!params.birthDate) {
      throw new Error('Missing birthDate. Invalid parameters');
    }
    if (!params.phoneNumber) {
      throw new Error('Missing phoneNumber. Invalid parameters');
    }
    if (!params.nationality) {
      throw new Error('Missing nationality. Invalid parameters');
    }
    if (!params.maritalStatus) {
      throw new Error('Missing maritalStatus. Invalid parameters');
    }
    if (!params.street) {
      throw new Error('Missing street. Invalid parameters');
    }
    if (!params.postalCode) {
      throw new Error('Missing postalCode. Invalid parameters');
    }
    if (!params.locality) {
      throw new Error('Missing locality. Invalid parameters');
    }
    if (!params.province) {
      throw new Error('Missing province. Invalid parameters');
    }
    if (!params.numeration) {
      throw new Error('Missing numeration. Invalid parameters');
    }

    const body: any = {
      externalId: params.externalId,
      email: params.email,
      legalId: params.legalId,
      type: params.type || 'INDIVIDUAL',
      exchange: params.exchange,
      personalData: {
        name: params.name,
        surname: params.surname,
        sex: params.sex,
        work: params.work,
        birthDate: params.birthDate,
        isPep: params.isPep || false,
        isFacta: params.isFacta || false,
        isFep: params.isFep || false,
        phoneNumber: params.phoneNumber,
        nationality: params.nationality,
        maritalStatus: params.maritalStatus,
        address: {
          street: params.street,
          postalCode: params.postalCode,
          locality: params.locality,
          province: params.province,
          numeration: params.numeration,
          floor: params.floor || '0',
          apartment: params.apartment || '0',
        },
      },
    };

    if (params.cbu && params.currency) {
      body.banking = {
        accounts: [
          {
            cbu: params.cbu,
            currency: params.currency,
            description: params.description || `Cta ${params.currency}`,
          },
        ],
      };
    }

    if (
      params.documentFrontImage ||
      params.documentBackImage ||
      params.selfie
    ) {
      body.documents = {};
      if (params.documentFrontImage) {
        body.documents.documentFrontImage = params.documentFrontImage;
      }
      if (params.documentBackImage) {
        body.documents.documentBackImage = params.documentBackImage;
      }
      if (params.selfie) {
        body.documents.selfie = params.selfie;
      }
    }

    return this.request({
      method: 'POST',
      action: '/v2/onboarding-actions/initial',
      body,
    });
  }

  async getUserByLegalId(params: {
    legalId?: string;
    email?: string;
  }): Promise<any> {
    if (!params.legalId && !params.email) {
      throw new Error('Missing legalId or email. At least one is required');
    }

    let page = 1;
    const limit = 100;
    let foundUser = null;

    while (!foundUser) {
      try {
        const result = await this.request({
          method: 'GET',
          action: `/v2/users?page=${page}&limit=${limit}`,
        });

        const usersList = result?.users || result?.data || [];
        const pagination = result?.pagination || result;

        if (Array.isArray(usersList) && usersList.length > 0) {
          foundUser = usersList.find((user: any) => {
            const userLegalId = user.legalId || user.personalData?.legalId;
            if (params.legalId && userLegalId === params.legalId) {
              return true;
            }
            if (params.email && user.email === params.email) {
              return true;
            }
            return false;
          });

          if (foundUser) {
            return foundUser;
          }

          const totalPages =
            pagination?.totalPages || pagination?.lastPage || 1;
          if (page >= totalPages || usersList.length === 0) {
            return null;
          }

          page++;
        } else {
          return null;
        }
      } catch (error) {
        this.logger.error('Error searching user by legalId/email', error);
        throw error;
      }
    }

    return null;
  }
}
