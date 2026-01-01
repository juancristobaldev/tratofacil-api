import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateServiceInput,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper para mapear WpPost -> Service Entity
  private mapPostToService(post: any, priceMeta?: any) {
    const price = priceMeta ? parseFloat(priceMeta.meta_value) : 0;
    // Lógica de negocio simple (ejemplo: comisión del 10%)
    const commission = price * 0.1;
    const netAmount = price - commission;

    return {
      id: Number(post.ID), // Convertir BigInt a Number para GraphQL
      name: post.post_title,
      slug: post.post_name,
      description: post.post_content,
      price,
      commission,
      netAmount,
      hasHomeVisit: true, // Esto podría venir de otro meta
    };
  }

  async findAll() {
    const posts = await this.prisma.wpPost.findMany({
      where: { post_type: 'product', post_status: 'publish' },
      include: {
        postmeta: { where: { meta_key: '_price' } },
      },
    });

    return posts.map((post) => {
      const priceMeta = post.postmeta.find((m) => m.meta_key === '_price');
      return this.mapPostToService(post, priceMeta);
    });
  }

  async findOne(id: number) {
    const post = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(id) },
      include: {
        postmeta: { where: { meta_key: '_price' } },
      },
    });

    if (!post) throw new NotFoundException('Servicio no encontrado');
    const priceMeta = post.postmeta.find((m) => m.meta_key === '_price');
    return this.mapPostToService(post, priceMeta);
  }

  async findByCategory(categorySlug: string) {
    // Buscar posts que tengan una relación con el término de esa taxonomía
    const posts = await this.prisma.wpPost.findMany({
      where: {
        post_type: 'product',
        post_status: 'publish',
        termRelationships: {
          some: {
            taxonomy: {
              taxonomy: 'product_cat',
              term: { slug: categorySlug },
            },
          },
        },
      },
      include: {
        postmeta: { where: { meta_key: '_price' } },
      },
    });

    return posts.map((post) => {
      const priceMeta = post.postmeta.find((m) => m.meta_key === '_price');
      return this.mapPostToService(post, priceMeta);
    });
  }

  async findServiceDetail(serviceId: number, providerId: number) {
    // 1. Obtener el servicio (Producto WP)
    const service = await this.findOne(serviceId);

    // 2. Obtener el proveedor (Tabla Provider)
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { bank: true },
    });

    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    // Aquí podrías validar si el proveedor realmente ofrece este servicio
    // (ej. verificando si el provider.wcCategoryId coincide con la categoría del servicio)

    return {
      ...service,
      provider: provider,
    };
  }

  // --- MUTACIONES (Escribir en WordPress) ---

  async create(input: CreateServiceInput) {
    // Generar slug simple
    const slug = input.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    // Crear Post y Meta en transacción
    return this.prisma.$transaction(async (tx) => {
      const newPost = await tx.wpPost.create({
        data: {
          post_author: BigInt(1), // Admin por defecto
          post_date: new Date(),
          post_content: input.description || '',
          post_title: input.name,
          post_status: 'publish',
          post_type: 'product',
          post_name: slug,
          // Relación con categoría si viene en el input
          ...(input.categoryId && {
            termRelationships: {
              create: {
                term_taxonomy_id: BigInt(input.categoryId), // Asumiendo que el ID mapea directo a taxonomy_id
              },
            },
          }),
          // Crear precio como meta
          postmeta: {
            create: {
              meta_key: '_price',
              meta_value: input.price.toString(),
            },
          },
        },
        include: {
          postmeta: true,
        },
      });

      const priceMeta = newPost.postmeta.find((m) => m.meta_key === '_price');
      return this.mapPostToService(newPost, priceMeta);
    });
  }

  async update(id: number, input: UpdateServiceInput) {
    // Verificar existencia
    const exists = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(id) },
    });
    if (!exists) throw new NotFoundException('Servicio no encontrado');

    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar Post básico
      const updatedPost = await tx.wpPost.update({
        where: { ID: BigInt(id) },
        data: {
          post_title: input.name,
          post_content: input.description,
        },
      });

      // 2. Actualizar Precio (Meta)
      if (input.price !== undefined) {
        // Buscar si existe el meta
        const priceMeta = await tx.wpPostMeta.findFirst({
          where: { post_id: BigInt(id), meta_key: '_price' },
        });

        if (priceMeta) {
          await tx.wpPostMeta.update({
            where: { meta_id: priceMeta.meta_id },
            data: { meta_value: input.price.toString() },
          });
        } else {
          await tx.wpPostMeta.create({
            data: {
              post_id: BigInt(id),
              meta_key: '_price',
              meta_value: input.price.toString(),
            },
          });
        }
      }

      // 3. Retornar actualizado
      const finalPost = await tx.wpPost.findUnique({
        where: { ID: BigInt(id) },
        include: { postmeta: { where: { meta_key: '_price' } } },
      });

      const pMeta = finalPost?.postmeta.find((m) => m.meta_key === '_price');
      return this.mapPostToService(finalPost, pMeta);
    });
  }

  async remove(id: number) {
    const exists = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(id) },
    });
    if (!exists) throw new NotFoundException('Servicio no encontrado');

    // Eliminar (Cascade se encargará de los metas si está configurado en DB,
    // pero Prisma schema define onDelete: Cascade en WpPostMeta -> WpPost, así que es seguro)
    await this.prisma.wpPost.delete({
      where: { ID: BigInt(id) },
    });

    return {
      id,
      name: exists.post_title,
      hasHomeVisit: false,
      price: 0,
      slug: '',
      commission: 0,
      netAmount: 0,
    }; // Return dummy deleted object
  }
}
