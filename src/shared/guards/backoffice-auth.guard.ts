import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    roleId: string;
    role: {
      id: string;
      name: string;
      level: number;
    };
  };
}

@Injectable()
export class BackofficeAuthGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      // Valida e decodifica o token JWT
      const payload = await this.jwtService.verifyToken(token);

      // Busca o usuário no banco de dados
      const user = await this.prisma.backofficeUsers.findUnique({
        where: {
          id: payload.userId,
          deletedAt: null,
        },
        include: {
          backofficeRoles: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (user.status !== 'active') {
        throw new UnauthorizedException('Usuário inativo');
      }

      // Adiciona o usuário à requisição para uso nos controllers
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: user.backofficeRoles,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
