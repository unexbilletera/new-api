import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AlertReviewStatus {
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class ReviewAlertDto {
  @ApiProperty({
    description: 'Review status',
    enum: AlertReviewStatus,
  })
  @IsEnum(AlertReviewStatus, {
    message: 'Status must be reviewed, approved, or rejected',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: AlertReviewStatus;

  @ApiPropertyOptional({ description: 'Review notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
