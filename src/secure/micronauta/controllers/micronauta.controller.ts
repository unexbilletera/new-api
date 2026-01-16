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
import { MicronautaService } from '../services/micronauta.service';

@ApiTags('15. Micronauta')
@Controller('micronauta')
export class MicronautaController {
  constructor(private readonly micronautaService: MicronautaService) {}

  @Post('webhook/:action')
  @ApiOperation({ summary: 'Process Micronauta webhook' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(@Param('action') action: string, @Body() body: any) {
    return this.micronautaService.processWebhook(action, body);
  }

  @Get('cards/:userId/:cuit')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Micronauta cards for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'cuit', description: 'CUIT' })
  @ApiResponse({ status: 200, description: 'List of cards' })
  async getCards(
    @Param('userId') userId: string,
    @Param('cuit') cuit: string,
  ) {
    return this.micronautaService.getCards(userId, cuit);
  }

  @Get('cards/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Micronauta card by ID' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({ status: 200, description: 'Card details' })
  async getCard(@Param('id') id: string) {
    return this.micronautaService.getCard(id);
  }

  @Get('syncCards/:cuit')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync Micronauta cards' })
  @ApiParam({ name: 'cuit', description: 'CUIT' })
  @ApiResponse({ status: 200, description: 'Sync result' })
  async syncCards(@Param('cuit') cuit: string) {
    return this.micronautaService.syncCards(cuit);
  }
}
