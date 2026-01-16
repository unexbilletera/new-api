import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SocksProxyAgent } from 'socks-proxy-agent';
import * as https from 'https';
import FormData from 'form-data';
import { Pdf417ParserService } from './pdf417-parser.service';

interface RenaperConfig {
  enable: boolean;
  logging: boolean;
  proxy: boolean;
  baseUrl: string;
  credentials: {
    vigencia: { username: string; password: string };
    facial: { username: string; password: string };
    huella: { username: string; password: string };
  };
  minConfidence: number;
  timeout: number;
  validationMode: 'simple' | 'complete';
}

interface ValidityResult {
  success: boolean;
  valid: boolean;
  message: string;
}

interface FacialResult {
  success: boolean;
  match: boolean;
  similarity: number;
  message: string;
}

interface FingerprintResult {
  success: boolean;
  match: boolean;
  similarity: number;
  message: string;
}

interface DocumentValidationResult {
  success: boolean;
  valid: boolean;
  facial?: boolean;
  similarity?: number;
  message: string;
}

@Injectable()
export class RenaperService {
  private readonly logger = new Logger(RenaperService.name);
  private config: RenaperConfig;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private pdf417Parser: Pdf417ParserService,
  ) {
    this.loadConfig();
  }

  private loadConfig(): void {
    const enable =
      this.configService.get<string>('WALLET_RENAPER', '') === 'enable';
    const logging =
      this.configService.get<string>('WALLET_RENAPER_LOG', '') === 'enable';
    const proxy =
      this.configService.get<string>('WALLET_RENAPER_PROXY', '') === 'enable';

    this.config = {
      enable,
      logging,
      proxy,
      baseUrl: this.configService.get<string>('WALLET_RENAPER_URL', ''),
      credentials: {
        vigencia: {
          username: this.configService.get<string>(
            'WALLET_RENAPER_VIGENCIA_USER',
            '',
          ),
          password: this.configService.get<string>(
            'WALLET_RENAPER_VIGENCIA_PASSWORD',
            '',
          ),
        },
        facial: {
          username: this.configService.get<string>(
            'WALLET_RENAPER_FACIAL_USER',
            '',
          ),
          password: this.configService.get<string>(
            'WALLET_RENAPER_FACIAL_PASSWORD',
            '',
          ),
        },
        huella: {
          username: this.configService.get<string>(
            'WALLET_RENAPER_HUELLA_USER',
            '',
          ),
          password: this.configService.get<string>(
            'WALLET_RENAPER_HUELLA_PASSWORD',
            '',
          ),
        },
      },
      minConfidence: parseFloat(
        this.configService.get<string>('WALLET_RENAPER_MIN_CONFIDENCE', '0.85'),
      ),
      timeout: parseInt(
        this.configService.get<string>('WALLET_RENAPER_TIMEOUT', '60000'),
        10,
      ),
      validationMode:
        (this.configService
          .get<string>('RENAPER_VALIDATION_MODE', 'simple')
          .toLowerCase() as 'simple' | 'complete') || 'simple',
    };

    // Increase timeout when using SOCKS proxy (slower connections)
    if (this.config.proxy && this.config.timeout < 60000) {
      this.config.timeout = 60000;
      if (this.config.logging) {
        this.logger.log(
          'RENAPER: Timeout increased to 60000ms for SOCKS proxy connection',
        );
      }
    }
  }

  private createRenaperAgent(): https.Agent | SocksProxyAgent {
    const shouldUseProxy =
      this.config.proxy || process.env.USE_SOCKS_PROXY === 'true';

    if (shouldUseProxy) {
      const proxyPort = process.env.SOCKS_PROXY_PORT || '8080';
      this.logger.debug(
        `RENAPER: Using SOCKS Proxy (socks5h://localhost:${proxyPort})`,
      );
      return new SocksProxyAgent(`socks5h://localhost:${proxyPort}`);
    } else {
      return new https.Agent();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getToken(service: 'vigencia' | 'facial' | 'huella'): Promise<string> {
    if (!this.config.enable) {
      throw new Error('RENAPER not enabled');
    }

    const credentials = this.config.credentials[service];
    if (!credentials) {
      throw new Error(`Service not supported: ${service}`);
    }

    if (this.config.logging) {
      this.logger.log(`RENAPER: Generating token for service ${service}`);
    }

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            `${this.config.baseUrl}/API_ABIS/Autorizacion/token.php`,
            new URLSearchParams({
              username: credentials.username,
              password: credentials.password,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              httpsAgent: this.createRenaperAgent(),
              timeout: this.config.timeout,
            },
          ),
        );

        if (this.config.logging) {
          this.logger.log(
            `RENAPER: Token generated successfully for ${service}`,
          );
        }

        if (
          response.data.codigo_http === 200 &&
          response.data.data.codigo === 0
        ) {
          return response.data.data.token;
        } else {
          throw new Error(
            `Error generating token: ${response.data.data?.message || 'Unknown error'}`,
          );
        }
      } catch (error: any) {
        lastError = error;

        if (
          error.response?.status === 403 ||
          error.response?.data === 'FORBIDDEN - REMOTE ADDRESS NOT ALLOWED'
        ) {
          const forbiddenError: any = new Error(
            'RENAPER API: IP not authorized. The IP address is not on the RENAPER API whitelist.',
          );
          forbiddenError.code = 'RENAPER_FORBIDDEN';
          forbiddenError.statusCode = 403;
          forbiddenError.isForbidden = true;
          throw forbiddenError;
        }

        // Non-retryable errors
        if (
          error.message?.includes('not enabled') ||
          error.message?.includes('SOCKS5 proxy not available')
        ) {
          throw error;
        }

        // Retryable errors (network, timeout, etc)
        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          this.logger.warn(
            `RENAPER: Token generation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms. Error: ${error.message}`,
          );
          await this.delay(delayMs);
          continue;
        }

        this.logger.error(
          `RENAPER: Token generation failed after ${maxRetries} attempts`,
          error,
        );
        throw error;
      }
    }

    throw lastError;
  }

  async verifyValidity(params: {
    documentNumber: string;
    gender: string;
    tramiteId: string;
  }): Promise<ValidityResult> {
    if (!this.config.enable) {
      throw new Error('RENAPER not enabled');
    }

    const { documentNumber, gender, tramiteId } = params;

    if (!documentNumber || !gender || !tramiteId) {
      throw new Error('Required parameters: documentNumber, gender, tramiteId');
    }

    const token = await this.getToken('vigencia');
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.config.baseUrl}/apidatos/verificaVigencia.php`,
            {
              params: {
                dni: documentNumber,
                sexo: gender,
                id_tramite: tramiteId,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
              httpsAgent: this.createRenaperAgent(),
              timeout: this.config.timeout,
            },
          ),
        );

        const code = response.data.codigo;
        const message = String(response.data.mensaje || '').toUpperCase();
        const valid = response.data.vigente;
        const deceased = String(response.data.fallecido || '').toUpperCase();

        let isValid = false;
        let success = false;

        if (code === 200) {
          if (message.includes('DNI VIGENTE') && deceased !== 'SI') {
            isValid = true;
            success = true;
          } else {
            isValid = false;
            success = false;
          }
        } else if (code === 0) {
          success = true;
          isValid = valid === true || valid !== false;
        } else {
          success = false;
          isValid = false;
        }

        if (success && isValid) {
          return {
            success: true,
            valid: true,
            message: response.data.mensaje || 'DNI valid',
          };
        } else {
          return {
            success: false,
            valid: false,
            message: response.data.mensaje || 'DNI not valid',
          };
        }
      } catch (error: any) {
        lastError = error;

        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          this.logger.warn(
            `RENAPER: Validity verification failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms. Error: ${error.message}`,
          );
          await this.delay(delayMs);
          continue;
        }

        this.logger.error('Error verifying RENAPER validity', error);
      }
    }

    throw lastError;
  }

  async validateFacial(params: {
    documentNumber: string;
    gender: string;
    image: string | Buffer;
  }): Promise<FacialResult> {
    if (!this.config.enable) {
      throw new Error('RENAPER not enabled');
    }

    const { documentNumber, gender, image } = params;

    if (!documentNumber || !gender || !image) {
      throw new Error('Required parameters: documentNumber, gender, image');
    }

    const token = await this.getToken('facial');
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('dni', documentNumber);
        formData.append('sexo', gender);

        if (typeof image === 'string' && image.startsWith('data:')) {
          const base64Data = image.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          formData.append('imagen', buffer, 'selfie.jpg');
        } else if (Buffer.isBuffer(image)) {
          formData.append('imagen', image, 'selfie.jpg');
        } else {
          formData.append('imagen', image);
        }

        const headers = {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'identity',
        };

        const response = await firstValueFrom(
          this.httpService.post(
            `${this.config.baseUrl}/API_ABIS/ValidacionFacialSincronico.php`,
            formData,
            {
              headers,
              httpsAgent: this.createRenaperAgent(),
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              timeout: this.config.timeout,
            },
          ),
        );

        if (response.data.codigo === 0) {
          const similarity = response.data.similitud || 0;
          const match = similarity >= this.config.minConfidence;

          return {
            success: true,
            match,
            similarity,
            message: response.data.mensaje,
          };
        } else {
          return {
            success: false,
            match: false,
            similarity: 0,
            message: response.data.mensaje || 'Facial validation error',
          };
        }
      } catch (error: any) {
        lastError = error;

        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          this.logger.warn(
            `RENAPER: Facial validation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms. Error: ${error.message}`,
          );
          await this.delay(delayMs);
          continue;
        }

        this.logger.error('Error validating RENAPER facial', error);
      }
    }

    throw lastError;
  }

  async validateFingerprint(params: {
    documentNumber: string;
    gender: string;
    fingerprint: string;
  }): Promise<FingerprintResult> {
    if (!this.config.enable) {
      throw new Error('RENAPER not enabled');
    }

    const { documentNumber, gender, fingerprint } = params;

    if (!documentNumber || !gender || !fingerprint) {
      throw new Error(
        'Required parameters: documentNumber, gender, fingerprint',
      );
    }

    const token = await this.getToken('huella');
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('dni', documentNumber);
        formData.append('sexo', gender);
        formData.append('huella', fingerprint);

        const headers = {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'identity',
        };

        const response = await firstValueFrom(
          this.httpService.post(
            `${this.config.baseUrl}/API_ABIS/ValidacionHuella.php`,
            formData,
            {
              headers,
              httpsAgent: this.createRenaperAgent(),
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              timeout: this.config.timeout,
            },
          ),
        );

        if (response.data.codigo === 0) {
          const similarity = response.data.similitud || 0;
          const match = similarity >= this.config.minConfidence;

          return {
            success: true,
            match,
            similarity,
            message: response.data.mensaje,
          };
        } else {
          return {
            success: false,
            match: false,
            similarity: 0,
            message: response.data.mensaje || 'Fingerprint validation error',
          };
        }
      } catch (error: any) {
        lastError = error;

        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          this.logger.warn(
            `RENAPER: Fingerprint validation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms. Error: ${error.message}`,
          );
          await this.delay(delayMs);
          continue;
        }

        this.logger.error('Error validating RENAPER fingerprint', error);
      }
    }

    throw lastError;
  }

  async validateDocument(params: {
    documentNumber: string;
    gender: string;
    tramite: string;
    userId?: string;
    userImage?: string;
  }): Promise<DocumentValidationResult> {
    if (!this.config.enable) {
      throw new Error('RENAPER not enabled');
    }

    const documentNumber = params.documentNumber;
    const gender = params.gender.toLowerCase() === 'female' ? 'F' : 'M';
    const tramiteId = params.tramite;

    if (!documentNumber || !gender || !tramiteId) {
      throw new Error('Required parameters: documentNumber, gender, tramite');
    }

    if (this.config.logging) {
      this.logger.log('RENAPER.validateDocument: params', {
        documentNumber,
        gender,
        tramiteId,
        hasUserId: !!params.userId,
        hasUserImage: !!params.userImage,
      });
    }

    const validity = await this.verifyValidity({
      documentNumber,
      gender,
      tramiteId,
    });

    if (this.config.logging) {
      this.logger.log('RENAPER.validateDocument: validity result', validity);
    }

    if (!validity.success || !validity.valid) {
      return {
        success: false,
        valid: false,
        facial: false,
        message: validity.message || 'Invalid DNI',
      };
    }

    const mode = this.config.validationMode;
    if (this.config.logging) {
      this.logger.log(`RENAPER.validateDocument: validation mode = ${mode}`);
    }

    if (mode === 'simple') {
      return {
        success: true,
        valid: true,
        message: 'Document validated by validity',
      };
    }

    let userImageBuffer: Buffer | null = null;
    if (params.userImage && typeof params.userImage === 'string') {
      if (params.userImage.startsWith('http')) {
        try {
          const resp = await firstValueFrom(
            this.httpService.get(params.userImage, {
              responseType: 'arraybuffer',
              httpsAgent: this.createRenaperAgent(),
            }),
          );
          userImageBuffer = Buffer.from(resp.data);
          if (this.config.logging) {
            this.logger.log(
              'RENAPER.validateDocument: user image downloaded from URL',
            );
          }
        } catch (e) {
          return {
            success: false,
            valid: true,
            facial: false,
            message: 'Could not download user image',
          };
        }
      } else if (params.userImage.startsWith('data:')) {
        const base64Data = params.userImage.split(',')[1];
        userImageBuffer = Buffer.from(base64Data, 'base64');
        if (this.config.logging) {
          this.logger.log(
            'RENAPER.validateDocument: user image parsed from base64',
          );
        }
      }
    }

    if (!userImageBuffer) {
      return {
        success: false,
        valid: true,
        facial: false,
        message: 'User image not available',
      };
    }

    if (this.config.logging) {
      this.logger.log('RENAPER.validateDocument: calling validateFacial');
    }

    const facial = await this.validateFacial({
      documentNumber,
      gender,
      image: userImageBuffer,
    });

    if (this.config.logging) {
      this.logger.log('RENAPER.validateDocument: facial result', facial);
    }

    if (!facial.success || !facial.match) {
      return {
        success: false,
        valid: true,
        facial: false,
        similarity: facial.similarity || 0,
        message: facial.message || 'Facial validation failed',
      };
    }

    return {
      success: true,
      valid: true,
      facial: true,
      similarity: facial.similarity,
      message: 'Document validated successfully',
    };
  }

  async extractPDF417Data(
    pdf417Data: string,
  ): Promise<{ success: boolean; data: any; validation: any }> {
    try {
      const data = await this.pdf417Parser.parsePDF417(pdf417Data);
      const validation = this.pdf417Parser.validateData(data);

      if (!validation.valid) {
        throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
      }

      return {
        success: true,
        data,
        validation,
      };
    } catch (error) {
      this.logger.error('Error extracting PDF417 data', error);
      throw error;
    }
  }
}
