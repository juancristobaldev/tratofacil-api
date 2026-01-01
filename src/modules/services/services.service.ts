import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateServiceInput,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { WordpressService } from '../wordpress/wordpress.service';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wpService: WordpressService,
  ) {}

  /**
   * Crear Servicio -> Crea Producto en WP
   */
  async create(data: CreateServiceInput) {
    const categoryId = parseInt(data.categoryId, 10); // ID de la categoría del Rubro (ej. Plomería)

    // 1. Buscamos el proveedor en nuestra DB para obtener su nombre (que es su categoría en WP)
    // O mejor aún, si agregaste wpTermId al Provider, úsalo aquí.
    const provider = await this.prisma.provider.findUnique({
      where: { id: parseInt(data.providerId, 10) }, // Asumiendo que viene providerId
    });

    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    // 🧠 Lógica Jimmy Neutron:
    // Necesitamos el ID de WP de la categoría del Proveedor.
    // Si no lo guardamos en BD, tendremos que buscarlo o asumir que el providerId
    // de Prisma NO es el mismo que el term_id de WP.
    // *RECOMENDACIÓN URGENTE*: Agrega `wpTermId Int?` a tu modelo Provider.

    // Suponiendo que ya tienes el ID de la categoría del proveedor (digamos que lo buscaste o lo tienes):
    // const providerWpTermId = provider.wpTermId;

    // 2. Crear el Producto en WP via API
    const wpProduct = await this.wpService.createProduct({
      name: data.name,
      type: 'simple',
      regular_price: String(data.price),
      description: data.description,
      short_description: `Servicio ofrecido por ${provider.name}`,
      categories: [
        { id: categoryId }, // La categoría del Rubro (que ya debe existir en WP)
        // { id: providerWpTermId } // La subcategoría del Proveedor
      ],
      meta_data: [
        { key: 'has_home_visit', value: String(data.hasHomeVisit) },
        { key: 'provider_id_app', value: data.providerId }, // Referencia cruzada para seguridad
      ],
    });

    // 3. Prisma se actualiza solo (Magic!)
    // Como WP comparte la DB, Prisma verá el nuevo post en `wp_posts` eventualmente.
    // PERO, para devolver la respuesta inmediata a tu Frontend en GraphQL,
    // puedes devolver un objeto construido con los datos de `wpProduct`.

    // Si necesitas crear un registro espejo en una tabla personalizada (si la usas), hazlo aquí.
    // Si usas los modelos nativos `Product` (mapeado a wp_posts), ¡ya está listo!

    return {
      id: wpProduct.id,
      name: wpProduct.name,
      price: parseFloat(wpProduct.price),
      // ... mapea el resto
    };
  }

  /**
   * Busca el detalle de una oferta específica (Product) vinculada
   * a un servicio (Category) y un proveedor.
   */
  async findServiceDetail(serviceId: string, providerId: string) {
    const sId = parseInt(serviceId, 10);
    const pId = parseInt(providerId, 10);

    // Buscamos en la tabla Product (wp_posts) la oferta que cumpla ambos criterios
    const product = await this.prisma.product.findFirst({
      where: {
        serviceId: sId,
        // Buscamos el proveedor dentro de los metadatos del post
        postmeta: {
          some: {
            key: 'provider_id',
            value: providerId, // El ID del proveedor se guarda como string en wp_postmeta
          },
        },
      },
      include: {
        service: true,
        postmeta: true,
        // Traemos la info del proveedor para cumplir con la ServiceDetail Entity
        // Nota: En tu schema, el Product tiene una relación directa o vía postmeta con Provider
      },
    });

    if (!product) return null;

    // Extraer el valor de 'has_home_visit' desde el array de metadatos
    const hasHomeVisitMeta = product.postmeta.find(
      (m) => m.key === 'has_home_visit',
    );

    // Buscamos el objeto provider completo para el retorno
    const provider = await this.prisma.provider.findUnique({
      where: { id: pId },
      include: { user: true },
    });

    if (!provider) return null;

    // Retornamos un objeto alineado exactamente con la Entity ServiceDetail
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      commission: product.commission,
      netAmount: product.netAmount,
      hasHomeVisit: hasHomeVisitMeta?.value === 'true',
      provider: provider,
    };
  }

  /**
   * Crear una oferta (Producto en Prisma/WP) vinculada a una categoría (Service en Prisma/WP)
   */

  /**
   * Actualizar un producto/oferta existente
   */
  async update(id: string, data: UpdateServiceInput) {
    const productId = parseInt(id, 10);

    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
    };

    // Recalcular montos si el precio cambia
    if (data.price !== undefined) {
      updateData.price = data.price;
      updateData.commission = data.price * 0.1;
      updateData.netAmount = data.price * 0.9;
    }

    // Actualizar metadatos si es necesario
    if (data.hasHomeVisit !== undefined) {
      await this.prisma.postMeta.upsert({
        where: {
          // Nota: Esto requiere una lógica de búsqueda por postId y key específica
          // En WP se suele hacer un updateMany o buscar el ID del meta_id
          id:
            (
              await this.prisma.postMeta.findFirst({
                where: { postId: productId, key: 'has_home_visit' },
              })
            )?.id || 0,
        },
        update: { value: String(data.hasHomeVisit) },
        create: {
          postId: productId,
          key: 'has_home_visit',
          value: String(data.hasHomeVisit),
        },
      });
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        service: true,
        postmeta: true,
      },
    });
  }

  /**
   * Eliminar producto y sus metadatos
   */
  async remove(id: string) {
    const productId = parseInt(id, 10);

    // Primero eliminamos los metadatos relacionados para evitar errores de FK
    await this.prisma.postMeta.deleteMany({
      where: { postId: productId },
    });

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Listar todos los productos (ofertas) con sus relaciones
   */
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        service: {
          include: { category: true }, // Trae la categoría padre
        },
        postmeta: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener un producto específico por su ID (Int)
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        service: true,
        postmeta: true,
      },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  /**
   * Buscar productos por el slug de la subcategoría (Service)
   */
  async findByCategory(categorySlug: string) {
    return this.prisma.product.findMany({
      where: {
        service: {
          slug: categorySlug,
        },
      },
      include: {
        service: true,
        postmeta: true,
      },
    });
  }
}
