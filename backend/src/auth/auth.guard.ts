import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

type TokenPayload = {
  userId: string;
  email: string;
};

const isTokenPayload = (payload: unknown): payload is TokenPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<TokenPayload>;
  return typeof candidate.userId === 'string' && typeof candidate.email === 'string';
};

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
      });

      if (!isTokenPayload(payload)) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = {
        userId: payload.userId,
        email: payload.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
