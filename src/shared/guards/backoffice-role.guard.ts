import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const MIN_LEVEL_KEY = 'minLevel';
export const MinLevel = (level: number) => SetMetadata(MIN_LEVEL_KEY, level);
@Injectable()
export class BackofficeRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const minLevel = this.reflector.getAllAndOverride<number>(MIN_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!minLevel) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userLevel = user.role?.level || user.level || 0;

    if (userLevel < minLevel) {
      throw new ForbiddenException('Insufficient permission for this action');
    }

    return true;
  }
}
