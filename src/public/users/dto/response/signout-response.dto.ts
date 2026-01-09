import { ApiProperty } from '@nestjs/swagger';

export class SignoutResponseDto {
  @ApiProperty({
    description: 'Access token (null after logout)',
    example: null,
    type: 'null',
    nullable: true,
  })
  accessToken: null;
}
