import { IsString } from 'class-validator';

export class ConfirmPixCronosDto {
  @IsString()
  transactionId: string;
}
