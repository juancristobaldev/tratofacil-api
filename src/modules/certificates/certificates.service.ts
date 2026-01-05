import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateCertificateInput,
  UpdateCertificateInput,
} from 'src/graphql/entities/provider.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}
  async findAllByUser(userId: number) {
    // Primero encontramos al proveedor asociado a ese usuario
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) return [];

    // Retornamos sus certificados
    return this.prisma.providerCertificate.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
    });
  }
  /**
   * Crea un nuevo certificado vinculado al perfil de proveedor del usuario
   */
  async createCertificate(userId: number, input: CreateCertificateInput) {
    // 1. Buscamos el proveedor asociado al usuario
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new ForbiddenException(
        'El usuario no tiene un perfil de proveedor asociado.',
      );
    }

    // 2. Creamos el certificado
    return this.prisma.providerCertificate.create({
      data: {
        ...input,
        providerId: provider.id,
        verified: false, // Por defecto no verificado hasta revisión administrativa
      },
    });
  }

  /**
   * Actualiza un certificado existente verificando propiedad
   */
  async updateCertificate(userId: number, input: UpdateCertificateInput) {
    const { id, ...data } = input;

    // 1. Verificamos que el certificado exista y pertenezca al usuario
    const certificate = await this.prisma.providerCertificate.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado.`);
    }

    if (certificate.provider.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para editar este certificado.',
      );
    }

    // 2. Actualizamos
    return this.prisma.providerCertificate.update({
      where: { id },
      data: {
        ...data,
        verified: false, // Si edita el contenido, se pierde la verificación previa
      },
    });
  }

  /**
   * Elimina un certificado verificando propiedad
   */
  async deleteCertificate(userId: number, id: number): Promise<boolean> {
    // 1. Verificamos propiedad
    const certificate = await this.prisma.providerCertificate.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado.`);
    }

    if (certificate.provider.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este certificado.',
      );
    }

    // 2. Eliminamos
    await this.prisma.providerCertificate.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Obtiene todos los certificados de un proveedor específico
   */
  async findByProvider(providerId: number) {
    return this.prisma.providerCertificate.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
