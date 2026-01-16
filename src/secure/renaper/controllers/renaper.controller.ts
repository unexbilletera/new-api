import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RenaperService } from '../services/renaper.service';

@ApiTags('14. Renaper')
@ApiBearerAuth('JWT-auth')
@Controller('renaper')
@UseGuards(JwtAuthGuard)
export class RenaperController {
  constructor(private readonly renaperService: RenaperService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test RENAPER connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection() {
    return this.renaperService.testConnection();
  }

  @Get('verificar-vigencia')
  @ApiOperation({ summary: 'Verify DNI validity' })
  @ApiQuery({ name: 'dni', description: 'DNI number' })
  @ApiQuery({ name: 'sexo', description: 'Gender (M/F)' })
  @ApiQuery({ name: 'id_tramite', description: 'Tramite ID' })
  @ApiResponse({ status: 200, description: 'Vigencia verification result' })
  async verificarVigencia(
    @Query('dni') dni: string,
    @Query('sexo') sexo: string,
    @Query('id_tramite') idTramite: string,
  ) {
    return this.renaperService.verificarVigencia(dni, sexo, idTramite);
  }

  @Post('validar-facial')
  @ApiOperation({ summary: 'Validate facial identity' })
  @ApiResponse({ status: 200, description: 'Facial validation result' })
  async validarFacial(@Body() body: { dni: string; sexo: string; imagen: string }) {
    return this.renaperService.validarFacial(body.dni, body.sexo, body.imagen);
  }

  @Post('validar-huella')
  @ApiOperation({ summary: 'Validate fingerprint identity' })
  @ApiResponse({ status: 200, description: 'Huella validation result' })
  async validarHuella(@Body() body: { dni: string; sexo: string; huella: string }) {
    return this.renaperService.validarHuella(body.dni, body.sexo, body.huella);
  }

  @Post('validar-documento')
  @ApiOperation({ summary: 'Validate complete document (vigencia + facial)' })
  @ApiResponse({ status: 200, description: 'Document validation result' })
  async validarDocumento(
    @Body() body: { dni: string; sexo: string; id_tramite: string; imagen: string },
  ) {
    return this.renaperService.validarDocumento(
      body.dni,
      body.sexo,
      body.id_tramite,
      body.imagen,
    );
  }

  @Post('extrair-pdf417')
  @ApiOperation({ summary: 'Extract data from PDF417' })
  @ApiResponse({ status: 200, description: 'PDF417 extraction result' })
  async extrairPDF417(@Body() body: { pdf417Data: string }) {
    return this.renaperService.extrairPDF417(body.pdf417Data);
  }

  @Post('validar-dni-completo')
  @ApiOperation({ summary: 'Validate complete DNI (PDF417 + RENAPER)' })
  @ApiResponse({ status: 200, description: 'Complete DNI validation result' })
  async validarDNICompleto(@Body() body: { pdf417Data: string; imagen: string }) {
    return this.renaperService.validarDNICompleto(body.pdf417Data, body.imagen);
  }
}
