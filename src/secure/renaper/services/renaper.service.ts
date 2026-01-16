import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RenaperService {
  private readonly logger = new Logger(RenaperService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('RENAPER_URL') || '';
    this.apiKey = this.configService.get<string>('RENAPER_API_KEY') || '';
  }

  async testConnection() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return { success: true, status: response.status };
    } catch (error: any) {
      this.logger.error('RENAPER connection test failed', error.message);
      return { success: false, error: error.message };
    }
  }

  async verificarVigencia(dni: string, sexo: string, idTramite: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/verificar-vigencia`, {
          params: { dni, sexo, id_tramite: idTramite },
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('verificarVigencia failed', error.message);
      throw error;
    }
  }

  async validarFacial(dni: string, sexo: string, imagen: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/validar-facial`,
          { dni, sexo, imagen },
          { headers: { 'x-api-key': this.apiKey } },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('validarFacial failed', error.message);
      throw error;
    }
  }

  async validarHuella(dni: string, sexo: string, huella: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/validar-huella`,
          { dni, sexo, huella },
          { headers: { 'x-api-key': this.apiKey } },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('validarHuella failed', error.message);
      throw error;
    }
  }

  async validarDocumento(
    dni: string,
    sexo: string,
    idTramite: string,
    imagen: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/validar-documento`,
          { dni, sexo, id_tramite: idTramite, imagen },
          { headers: { 'x-api-key': this.apiKey } },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('validarDocumento failed', error.message);
      throw error;
    }
  }

  async extrairPDF417(pdf417Data: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/extrair-pdf417`,
          { pdf417Data },
          { headers: { 'x-api-key': this.apiKey } },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('extrairPDF417 failed', error.message);
      throw error;
    }
  }

  async validarDNICompleto(pdf417Data: string, imagen: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/validar-dni-completo`,
          { pdf417Data, imagen },
          { headers: { 'x-api-key': this.apiKey } },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('validarDNICompleto failed', error.message);
      throw error;
    }
  }
}
