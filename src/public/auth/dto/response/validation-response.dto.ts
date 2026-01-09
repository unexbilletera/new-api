import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailValidationResponseDto {
  @ApiProperty({
    description: 'Informational message',
    example: 'Validation code sent to email',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Validation data',
    example: 'Email sent successfully to usuario@exemplo.com',
  })
  debug?: string;
}

export class EmailCodeVerificationResponseDto {
  @ApiProperty({
    description: 'Informational message',
    example: 'Email verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Validation data',
    example: 'complete_profile',
  })
  nextStep: string;
}

export class PhoneValidationResponseDto {
  @ApiProperty({
    description: 'Informational message',
    example: 'Validation code sent by SMS',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Validation data',
    example: 'SMS sent successfully to +5511987654321',
  })
  debug?: string;
}

export class PhoneCodeVerificationResponseDto {
  @ApiProperty({
    description: 'Informational message',
    example: 'Phone verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+5511987654321',
  })
  phone: string;

  @ApiProperty({
    description: 'Validation data',
    example: 'complete_profile',
  })
  nextStep: string;
}
