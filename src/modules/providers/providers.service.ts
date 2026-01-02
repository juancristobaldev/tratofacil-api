import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from '../users/users.service'; // Necesario para guardar el teléfono en usermeta
import {
  ProviderRegistrationInput,
  UpdateBankInput,
} from 'src/graphql/entities/register-provider';
import { UpdateProviderInput } from 'src/graphql/entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  // Generador de slug auxiliar
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
  }

  // Lógica de Registro Complejo (Identity + Provider + Bank)
  async register(userId: number, input: ProviderRegistrationInput) {
    const { identity, bank } = input;

    // 1. Actualizar teléfono del usuario (Va a wp_usermeta, no a wp_users)
    await this.userService.updateProfile(userId, {
      id: userId,
      phone: identity.phone,
      // Opcional: Podrías actualizar el displayName aquí también
      displayName: `${identity.firstName} ${identity.lastName}`,
    });

    // 2. Verificar si ya existe proveedor
    const existing = await this.prisma.provider.findUnique({
      where: { userId },
    });
    if (existing) throw new BadRequestException('El usuario ya es proveedor');

    // 3. Crear Proveedor y Banco en transacción
    const fullName = `${identity.firstName} ${identity.lastName}`;
    let slug = this.generateSlug(fullName);

    // Pequeña validación de slug único
    const slugCheck = await this.prisma.provider.findUnique({
      where: { slug },
    });
    if (slugCheck) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

    return this.prisma.provider.create({
      data: {
        userId,
        name: fullName,
        slug,
        location: 'Chile', // Default según tu código anterior
        phone: identity.phone, // Guardamos teléfono también en Provider si lo deseas
        bank: {
          create: {
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            accountType: bank.accountType,
          },
        },
      },
      include: { bank: true },
    });
  }

  // Actualizar solo datos del Proveedor
  async updateProviderData(input: UpdateProviderInput) {
    return this.prisma.provider.update({
      where: { id: input.id },
      data: {
        name: input.name,
        location: input.location,
        logoUrl: input.logoUrl,
        bio: input.bio,
      },
      include: { bank: true },
    });
  }

  // Actualizar solo Banco
  async updateBankData(input: UpdateBankInput) {
    return this.prisma.bankAccount.update({
      where: { id: input.bankId },
      data: {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountType: input.accountType,
      },
    });
  }

  // Utilidad para queries
  async findByUserId(userId: number) {
    return this.prisma.provider.findUnique({
      where: { userId },
      include: { bank: true },
    });
  }

  async findAll() {
    return this.prisma.provider.findMany({ include: { bank: true } });
  }

  async findOne(id: number) {
    return this.prisma.provider.findUnique({
      where: { id },
      include: { bank: true },
    });
  }
}
