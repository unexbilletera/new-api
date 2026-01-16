import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SandboxService } from '../services/sandbox.service';

@ApiTags('18. Sandbox')
@Controller('sandbox')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) {}

  @Post('cashin')
  @ApiOperation({ summary: 'Sandbox cashin' })
  @ApiResponse({ status: 200, description: 'Sandbox cashin result' })
  async cashin(@Body() body: any) {
    return this.sandboxService.cashin(body);
  }

  @Post('cashout')
  @ApiOperation({ summary: 'Sandbox cashout' })
  @ApiResponse({ status: 200, description: 'Sandbox cashout result' })
  async cashout(@Body() body: any) {
    return this.sandboxService.cashout(body);
  }

  @Post('process')
  @ApiOperation({ summary: 'Sandbox process transaction' })
  @ApiResponse({ status: 200, description: 'Sandbox process result' })
  async process(@Body() body: any) {
    return this.sandboxService.processTransaction(body);
  }

  @Post('push')
  @ApiOperation({ summary: 'Sandbox send push notification' })
  @ApiResponse({ status: 200, description: 'Sandbox push result' })
  async push(@Body() body: any) {
    return this.sandboxService.sendPush(body);
  }

  @Post('mail')
  @ApiOperation({ summary: 'Sandbox send email' })
  @ApiResponse({ status: 200, description: 'Sandbox mail result' })
  async mail(@Body() body: any) {
    return this.sandboxService.sendMail(body);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Sandbox verify' })
  @ApiResponse({ status: 200, description: 'Sandbox verify result' })
  async verify(@Body() body: any) {
    return this.sandboxService.verify(body);
  }

  @Post('bind')
  @ApiOperation({ summary: 'Sandbox bind' })
  @ApiResponse({ status: 200, description: 'Sandbox bind result' })
  async bind(@Body() body: any) {
    return this.sandboxService.bind(body);
  }

  @Post('unex/:method/:action')
  @ApiOperation({ summary: 'Sandbox unex webhook' })
  @ApiParam({ name: 'method', description: 'Webhook method' })
  @ApiParam({ name: 'action', description: 'Webhook action' })
  @ApiResponse({ status: 200, description: 'Sandbox unex webhook result' })
  async unexWebhook(
    @Param('method') method: string,
    @Param('action') action: string,
    @Body() body: any,
  ) {
    return this.sandboxService.unexWebhook(method, action, body);
  }

  @Post('micronauta')
  @ApiOperation({ summary: 'Sandbox micronauta' })
  @ApiResponse({ status: 200, description: 'Sandbox micronauta result' })
  async micronauta(@Body() body: any) {
    return this.sandboxService.micronauta(body);
  }
}
