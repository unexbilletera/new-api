import { ApiProperty } from '@nestjs/swagger';

export class MessagingResponseDto {
  @ApiProperty({
    description: 'Informational message returned by the operation',
    example: 'Operation completed successfully',
  })
  message: string;
}
