import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { PixCronosService } from '../services/pix-cronos.service';
import { CreatePixCronosDto } from '../dto/create-pix-cronos.dto';
import { ConfirmPixCronosDto } from '../dto/confirm-pix-cronos.dto';
import { SuccessCodes } from '../../../../shared/errors/app-error';

interface CurrentUserPayload {
  userId: string;
  email: string;
  roleId: string;
}

/**
 * Controller para transações PIX Cronos
 */
@Controller('transactions/pix/cronos')
@UseGuards(JwtAuthGuard)
export class PixCronosController {
  constructor(private pixCronosService: PixCronosService) {}

  /**
   * Cria uma transação PIX Cronos
   * POST /transactions/pix/cronos/create
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePixCronosDto,
  ) {
    const transaction = await this.pixCronosService.createTransaction(
      user.userId,
      dto,
    );

    return {
      ...transaction,
      message: SuccessCodes.TRANSACTIONS_CREATED,
      code: SuccessCodes.TRANSACTIONS_CREATED,
    };
  }

  /**
   * Confirma uma transação PIX Cronos
   * POST /transactions/pix/cronos/confirm
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ConfirmPixCronosDto,
  ) {
    const result = await this.pixCronosService.confirmTransaction(
      user.userId,
      dto.transactionId,
    );

    return {
      ...result,
      message: SuccessCodes.TRANSACTIONS_CONFIRMED,
      code: SuccessCodes.TRANSACTIONS_CONFIRMED,
    };
  }
}
