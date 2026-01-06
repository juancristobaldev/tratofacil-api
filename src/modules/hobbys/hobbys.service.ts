import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateHobbyInput,
  UpdateHobbyInput,
} from 'src/graphql/entities/hobbys.entity';

@Injectable()
export class HobbyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createHobbyInput: CreateHobbyInput) {
    const { providerId, name } = createHobbyInput;

    // Verificar si el proveedor existe
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException(
        `Provider con ID ${providerId} no encontrado`,
      );
    }

    return this.prisma.hobby.create({
      data: {
        name,
        provider: {
          connect: { id: providerId },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.hobby.findMany({
      include: { provider: true },
    });
  }

  async findOne(id: number) {
    const hobby = await this.prisma.hobby.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!hobby) {
      throw new NotFoundException(`Hobby con ID ${id} no encontrado`);
    }

    return hobby;
  }

  async findByProvider(providerId: number) {
    return this.prisma.hobby.findMany({
      where: { providerId },
    });
  }

  async update(id: number, updateHobbyInput: UpdateHobbyInput) {
    const { id: _, ...data } = updateHobbyInput;

    // Validar existencia antes de actualizar
    await this.findOne(id);

    return this.prisma.hobby.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    // Validar existencia antes de borrar
    await this.findOne(id);

    return this.prisma.hobby.delete({
      where: { id },
    });
  }
}
