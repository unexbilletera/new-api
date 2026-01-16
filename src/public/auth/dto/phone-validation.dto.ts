import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneValidationDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+5511987654321',
  })
  @Matches(/^\+\d{12,14}$/, {
    message:
      'Phone must start with + followed by 12-14 digits (e.g., +5512988870530 for BR or +541127564556 for AR)',
  })
  phone: string;
}

export class VerifyPhoneCodeDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+5511987654321',
  })
  @Matches(/^\+\d{12,14}$/, {
    message:
      'Phone must start with + followed by 12-14 digits (e.g., +5512988870530 for BR or +541127564556 for AR)',
  })
  phone: string;

  @ApiProperty({
    description: 'Verification code sent for phone validation',
    example: '123456',
  })
  @IsString()
  code: string;
}
