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
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // Utils
  // ===============================
  private async safeUnlink(fileUrl?: string) {
    if (!fileUrl) return;

    try {
      const filePath = path.join(process.cwd(), fileUrl);
      await fs.unlink(filePath);
    } catch (error: any) {
      // Si no existe, no rompemos el flujo
      if (error.code !== 'ENOENT') {
        console.error('Error eliminando archivo:', error);
      }
    }
  }

  // ===============================
  // Queries
  // ===============================
  async findAllByUser(userId: number) {
    const provider = await this.prisma.provider.findFirst({
      where: { userId },
    });

    if (!provider) return [];

    return this.prisma.providerCertificate.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProvider(providerId: number) {
    return this.prisma.providerCertificate.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===============================
  // Mutations
  // ===============================
  async createCertificate(userId: number, input: CreateCertificateInput) {
    const provider = await this.prisma.provider.findFirst({
      where: { userId },
    });

    if (!provider) {
      throw new ForbiddenException(
        'El usuario no tiene un perfil de proveedor asociado.',
      );
    }

    return this.prisma.providerCertificate.create({
      data: {
        ...input,
        providerId: provider.id,
        verified: false,
      },
    });
  }

  async updateCertificate(userId: number, input: UpdateCertificateInput) {
    const { id, ...data } = input;

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

    // 🧠 Si cambia el archivo, borramos el anterior
    if (
      data.fileUrl &&
      certificate.fileUrl &&
      data.fileUrl !== certificate.fileUrl
    ) {
      await this.safeUnlink(certificate.fileUrl);
    }

    return this.prisma.providerCertificate.update({
      where: { id },
      data: {
        ...data,
        verified: false, // pierde verificación al editar
      },
    });
  }

  async deleteCertificate(userId: number, id: number): Promise<boolean> {
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

    // 🧹 Borramos el archivo físico
    await this.safeUnlink(certificate.fileUrl);

    await this.prisma.providerCertificate.delete({
      where: { id },
    });

    return true;
  }
}
