import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  LoginInput,
  RegisterInput,
  CredentialsInput,
} from 'src/graphql/inputs/auth.input';
import { AuthType } from 'src/graphql/entities/auth.entity';
import { Role } from 'src/graphql/enums/role.enum';
import * as bcrypt from 'bcrypt';
import { RegisterUserInput } from 'src/graphql/entities/user.entity';
import { IdentityInput } from 'src/graphql/entities/register-provider';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private email: EmailService,
  ) {}

  /**
   * LOGIN: Autenticación nativa con Bcrypt
   */
  async login(loginInput: LoginInput): Promise<AuthType> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginInput.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validación de contraseña con bcrypt (Reemplaza wpHash)
    const isMatch = await bcrypt.compare(loginInput.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: user as any,
    };
  }

  /**
   * REGISTER: Registro limpio en tabla User
   */
  async register(registerInput: RegisterUserInput): Promise<AuthType> {
    const { email, password, role, displayName } = registerInput;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const username =
      email.split('@')[0] + Math.floor(1000 + Math.random() * 9000);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        nicename: username.toLowerCase(),
        displayName: displayName || username,
        role: role || Role.CLIENT, // Uso directo del Enum en la columna de la tabla
        status: 1, // 1 = Activo
        registered: new Date(),
        url: '',
        activationKey: '',
      },
    });

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      accessToken,
      user: newUser as any,
    };
  }

  /**
   * GET ME: Obtiene el usuario actual con sus relaciones de negocio
   */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        provider: true, // Si es proveedor, trae su perfil
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /**
   * VALIDATE TOKEN: Para Guards y Sesiones
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return this.getMe(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * VERIFICACIÓN: Lógica de negocio para registro de proveedores
   */
  async checkAndSendVerification(input: CredentialsInput): Promise<boolean> {
    const { email } = input;

    // 1. Validar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado.');
    }

    // 2. Generar código de 6 dígitos y expiración (15 minutos)
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    try {
      // 3. Guardar o actualizar el código en la base de datos
      // Usamos upsert para manejar re-intentos sobre el mismo email
      const emailVerification = await this.prisma.emailVerification.upsert({
        where: { email },
        update: {
          code: verificationCode,
          expiresAt,
        },
        create: {
          email,
          code: verificationCode,
          expiresAt,
        },
      });

      /*
     
      // 4. Enviar el correo mediante Resend
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Verifica tu cuenta</h2>
          <p>Tu código de verificación para Trato Fácil es:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${verificationCode}
          </div>
          <p>Este código expirará en 15 minutos.</p>
          <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
        </div>
      `;

      await this.email.sendEmail(
        email,
        'Código de verificación - Trato Fácil',
        emailHtml,
      );
     
     */

      console.log({ emailVerification });

      return true;
    } catch (error) {
      console.error('Error en el proceso de verificación:', error);
      // No revelamos detalles técnicos al cliente, pero logueamos el error
      throw new InternalServerErrorException(
        'No se pudo enviar el código de verificación.',
      );
    }
  }

  /**
   * CONFIRM AND CREATE: Registro atómico de proveedores (Sin UserMeta)
   */
  async confirmAndCreateUser(
    code: string,
    credentials: CredentialsInput,
    identity: IdentityInput,
  ): Promise<AuthType> {
    const emailCode = await this.prisma.emailVerification.findFirst({
      where: {
        email: credentials.email,
      },
    });

    if (emailCode?.code !== code) {
      throw new BadRequestException('Código inválido');
    }

    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    const username =
      credentials.email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Creamos el usuario y el perfil de proveedor en una sola transacción
    const newUser = await this.prisma.user.create({
      data: {
        email: credentials.email,
        username,
        password: hashedPassword,
        displayName:
          identity.company || `${identity.firstName} ${identity.lastName}`,
        nicename: username.toLowerCase(),
        role: Role.PROVIDER,
        status: 1,
        registered: new Date(),
        // Los datos de nombre y teléfono se guardan directamente en la tabla Provider
      },
    });

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      accessToken,
      user: newUser as any,
    };
  }
}
