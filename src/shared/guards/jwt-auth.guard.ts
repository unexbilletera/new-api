import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtService } from '../jwt/jwt.service';
import { ErrorCodes, ErrorHelper } from '../errors/app-error';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: any }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw ErrorHelper.unauthorized(ErrorCodes.USERS_MISSING_TOKEN);
    }

    try {
      const payload = await this.jwtService.verifyToken(token);
      // Provide both `id` and `userId` for backward compatibility with controllers/decorators
      request.user = {
        id: payload.userId,
        userId: payload.userId,
        email: payload.email,
        roleId: payload.roleId,
      };
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        throw ErrorHelper.unauthorized(ErrorCodes.USERS_EXPIRED_TOKEN);
      }
      throw ErrorHelper.unauthorized(ErrorCodes.USERS_INVALID_TOKEN);
    }
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] =
      request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

