import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
export enum ServiceType {
  MANTECA_PIX = 'manteca_pix',
  MANTECA_EXCHANGE = 'manteca_exchange',
}
export class AcceptTermDto {
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;
}
export class CheckTermParamDto {
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;
}
export class TermAcceptanceResponseDto {
  id: string;
  userId: string;
  serviceType: string;
  acceptedAt: Date;
  ipAddress?: string;
}
export class TermCheckResponseDto {
  accepted: boolean;
  serviceType: string;
  acceptedAt?: Date;
}
