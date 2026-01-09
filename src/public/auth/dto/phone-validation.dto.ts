import { IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneValidationDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+5511987654321',
  })
  @IsPhoneNumber('BR')
  phone: string;
}

export class VerifyPhoneCodeDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+5511987654321',
  })
  @IsPhoneNumber('BR')
  phone: string;

  @ApiProperty({
    description: 'Verification code sent for phone validation',
    example: '123456',
  })
  @IsString()
  code: string;
}
