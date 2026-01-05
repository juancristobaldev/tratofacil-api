import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/modules/auth/auth.service';
import { EmailModule } from 'src/modules/email/email.module';
import { EmailService } from 'src/modules/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Global()
@Module({
  imports: [
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    PrismaService, // Nest se encargará de instanciarlo
    AuthService,
  ],
  exports: [PrismaService, AuthService, JwtModule],
})
export class CoreModule {}
