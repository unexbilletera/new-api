import { IsEmail, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ValidationOptions } from 'src/common/validators';

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
    example: '12345678',
  })
  @IsString()
  @Matches(...ValidationOptions.CODE_8_DIGITS)
  code: string;
}
