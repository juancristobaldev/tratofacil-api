import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WordpressService } from '../wordpress/wordpress.service';
import {
  CreateProviderInput,
  UpdateProviderInput,
  UpdateBankInput,
} from 'src/graphql/entities/provider.entity';
import slugify from 'slugify';

@Injectable()
export class ProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wpService: WordpressService,
  ) {}

  /**
   * Crea un proveedor, su categoría en WooCommerce y su cuenta bancaria inicial
   */
  async create(userId: number, data: CreateProviderInput) {
    // 1. Validar si el usuario ya es proveedor
    const exists = await this.prisma.provider.findUnique({
      where: { userId },
    });
    if (exists) {
      throw new ConflictException('El usuario ya tiene un perfil de proveedor');
    }

    // 2. Crear categoría en WordPress para agrupar sus servicios
    let wpCategoryId: number | undefined;
    try {
      const wpCategory = await this.wpService.createCategory({
        name: data.name,
        description: `Servicios de ${data.name}`,
        image: data.logoUrl ? { src: data.logoUrl } : undefined,
      });
      wpCategoryId = wpCategory.id;
    } catch (error) {
      // Logeamos pero permitimos continuar o fallar según prefieras
      console.error('Error creando categoría en WP:', error);
    }

    // 3. Crear el proveedor y su cuenta bancaria vacía en una transacción
    const slug = slugify(data.name, { lower: true, strict: true });

    return this.prisma.provider.create({
      data: {
        name: data.name,
        location: data.location,
        logoUrl: data.logoUrl,
        bio: data.bio,
        phone: data.phone,
        slug: slug,
        userId: userId,
        wcCategoryId: wpCategoryId,
        bank: {
          create: {
            bankName: '',
            accountNumber: '',
            accountType: '',
          },
        },
      },
      include: { bank: true },
    });
  }

  /**
   * Actualiza los datos del perfil del proveedor
   */
  async update(id: number, data: UpdateProviderInput) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    return this.prisma.provider.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        bio: data.bio,
        logoUrl: data.logoUrl,
        // Si cambia el nombre, podrías querer actualizar el slug aquí también
      },
    });
  }

  /**
   * Actualiza o crea la información bancaria (Upsert)
   */
  async updateBank(providerId: number, data: UpdateBankInput) {
    return this.prisma.bankAccount.upsert({
      where: { providerId },
      update: {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        rut: data.rut,
        email: data.email,
      },
      create: {
        providerId,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        rut: data.rut,
        email: data.email,
      },
    });
  }

  /**
   * Obtener proveedor por su ID interno
   */
  async findById(id: number) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        user: true,
        bank: true,
      },
    });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    return provider;
  }

  /**
   * Obtener proveedor por el ID del usuario de WordPress
   */
  async findByUser(userId: number) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        user: true,
        bank: true,
      },
    });
    if (!provider)
      throw new NotFoundException('Perfil de proveedor no encontrado');
    return provider;
  }

  /**
   * Listar todos los proveedores
   */
  async list() {
    return this.prisma.provider.findMany({
      include: {
        user: true,
        bank: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
