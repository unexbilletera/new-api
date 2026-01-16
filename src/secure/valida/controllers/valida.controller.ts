import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { ValidaService } from '../services/valida.service';

@ApiTags('16. Valida')
@Controller('valida')
export class ValidaController {
  constructor(private readonly validaService: ValidaService) {}

  @Get('getEnrollmentInfo/:refId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Valida enrollment info' })
  @ApiParam({ name: 'refId', description: 'Reference ID' })
  @ApiResponse({ status: 200, description: 'Enrollment info' })
  async getEnrollmentInfo(@Param('refId') refId: string) {
    return this.validaService.getEnrollmentInfo(refId);
  }

  @Get('cancelEnrollment/:refId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel Valida enrollment' })
  @ApiParam({ name: 'refId', description: 'Reference ID' })
  @ApiResponse({ status: 200, description: 'Enrollment cancelled' })
  async cancelEnrollment(@Param('refId') refId: string) {
    return this.validaService.cancelEnrollment(refId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Process Valida webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(@Body() body: any) {
    return this.validaService.processWebhook(body);
  }

  @Get('redirection/:action')
  @ApiOperation({ summary: 'Handle Valida redirection' })
  @ApiParam({ name: 'action', description: 'Redirection action' })
  @ApiResponse({ status: 200, description: 'Redirection handled' })
  async redirection(@Param('action') action: string) {
    return this.validaService.handleRedirection(action);
  }
}
