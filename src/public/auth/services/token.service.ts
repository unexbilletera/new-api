import { Injectable } from '@nestjs/common';
import { JwtService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { AuthMapper } from '../mappers/auth.mapper';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private authMapper: AuthMapper,
  ) {}

  async getToken() {
    const payload: JwtPayload = {
      userId: 'anonymous',
      email: 'anonymous@system.local',
      roleId: 'anonymous',
    };

    const token = await this.jwtService.generateToken(payload);

    return this.authMapper.toTokenResponseDto(token);
  }
}
