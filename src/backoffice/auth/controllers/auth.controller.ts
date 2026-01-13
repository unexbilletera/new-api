import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { BackofficeAuthGuard } from '../../../shared/guards/backoffice-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

interface CurrentUserPayload {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    level: number;
  };
}

@ApiTags('3. Backoffice - Authentication')
@Controller('backoffice/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Backoffice login',
    description: 'Authenticates a backoffice user and returns JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login performed successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials or user not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid username or password',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(BackofficeAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get authenticated user data',
    description: 'Returns the data of the currently authenticated backoffice user',
  })
  @ApiResponse({
    status: 200,
    description: 'User data retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async getMe(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserResponseDto> {
    return await this.authService.getUserById(user.id);
  }
}
