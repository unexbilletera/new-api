import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Old password',
    example: 'SenhaAtual123!',
  })
  @IsString({ message: 'Senha atual deve ser uma string' })
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NovaSenha456!',
    minLength: 8,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @MinLength(8, { message: 'Nova senha deve ter no mínimo 8 caracteres' })
  newPassword: string;
}
