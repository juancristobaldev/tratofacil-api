import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/modules/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';


@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    PrismaService,
    AuthService,
  ],
  exports: [
    PrismaService,
    AuthService,
    JwtModule,
  ],
})
export class CoreModule {}