import { ApiProperty } from '@nestjs/swagger';

export class AccountClosureResponseDto {
  @ApiProperty({
    description: 'Access token (null after closure)',
    example: null,
    type: 'null',
    nullable: true,
  })
  accessToken: null;
}
