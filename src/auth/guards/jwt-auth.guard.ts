import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from 'src/modules/auth/auth.service';

  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const ctx = GqlExecutionContext.create(context);
      const req = ctx.getContext().req;
  
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Token requerido');
      }
  
      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException('Formato de token inválido');
      }
  
      const user = await this.authService.validateToken(token);
      if (!user) {
        throw new UnauthorizedException('Token inválido');
      }
  
      // 🔑 Inyectamos el usuario en el context
      req.user = user;
  
      return true;
    }
  }