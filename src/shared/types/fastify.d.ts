import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
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
}

