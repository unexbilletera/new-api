import { ApiProperty } from '@nestjs/swagger';

export class LivenessCheckDataDto {
  @ApiProperty({
    description: 'Text to be spoken during liveness verification',
    example: 'Hello, my name is John Silva',
  })
  text: string;

  @ApiProperty({
    description: 'URL to upload the verification video',
    example: 'https://api.example.com.br/upload/liveness/xyz123',
  })
  url: string;
}

export class LivenessCheckResponseDto {
  @ApiProperty({
    description: 'Data required for liveness verification',
    type: () => LivenessCheckDataDto,
  })
  data: LivenessCheckDataDto;

  @ApiProperty({
    description: 'Next onboarding step after verification',
    example: 'IDENTITY_VERIFICATION',
    nullable: true,
  })
  next: string | null;
}
