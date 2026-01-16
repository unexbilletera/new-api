import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignProfileDto {
  @ApiProperty({ description: 'Profile ID to assign to user' })
  @IsString()
  @IsNotEmpty({ message: 'Profile ID is required' })
  @IsUUID('4', { message: 'Invalid profile ID format' })
  profileId: string;
}
