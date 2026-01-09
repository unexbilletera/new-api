import { ApiProperty } from '@nestjs/swagger';

export class MessagingResponseDto {
  @ApiProperty({
    description: 'Informational message returned by the operation',
    example: 'Operação realizada com sucesso',
  })
  message: string;
}
