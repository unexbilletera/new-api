/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString } from 'class-validator';

/**
 * DTO para confirmar transação PIX Cronos
 */
export class ConfirmPixCronosDto {
  @IsString()
  transactionId: string;
}
