import { IsEmail, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailValidationDto {
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;
}

export class VerifyEmailCodeDto {
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Verification code sent for email validation',
    example: '123456',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Code must be exactly 6 digits',
  })
  code: string;
}
