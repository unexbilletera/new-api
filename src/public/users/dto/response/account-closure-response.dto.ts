import { ApiProperty } from '@nestjs/swagger';

export class AccountClosureResponseDto {
  @ApiProperty({
    description: 'Access token (null after closure)',
    example: null,
  })
  accessToken: null;
}
