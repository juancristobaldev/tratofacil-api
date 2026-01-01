import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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
   * Crear una oferta -> Crea un PRODUCTO en WooCommerce
   */
  async create(data: CreateServiceInput) {
    const categoryId = parseInt(data.categoryId, 10);
    const providerId = parseInt(data.providerId, 10);

    // 1. Validaciones Locales (Rápidas)
    // Validamos que la categoría (Rubro) exista
    const serviceCategory = await this.prisma.service.findUnique({
      where: { id: categoryId },
    });
    if (!serviceCategory) {
      throw new NotFoundException(
        `La categoría con ID ${categoryId} no existe`,
      );
    }

    // Validamos que el proveedor exista
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // 2. Crear Producto en WooCommerce VÍA API
    try {
      const wpProduct = await this.wpService.createProduct({
        name: data.name,
        type: 'simple',
        regular_price: String(data.price),
        description: data.description,
        short_description: `Servicio ofrecido por ${provider.name}`,
        categories: [
          { id: categoryId }, // Categoría del Rubro (ej. Plomería)
        ],
        meta_data: [
          { key: 'provider_id', value: String(providerId) },
          { key: 'has_home_visit', value: String(data.hasHomeVisit) },
        ],
      });

      // 3. Retornamos el objeto alineado a lo que espera GraphQL
      // (No necesitamos crear en Prisma, WP lo hace en su DB y Prisma lo leerá después)
      return {
        id: wpProduct.id,
        name: wpProduct.name,
        description: wpProduct.description,
        price: parseFloat(wpProduct.price || 0),
        commission: parseFloat(wpProduct.price || 0) * 0.1,
        netAmount: parseFloat(wpProduct.price || 0) * 0.9,
        serviceId: categoryId, // Mapeo para el resolver
        // postmeta se resolverá en la lectura
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al crear el servicio en WordPress',
      );
    }
  }

  /**
   * Actualizar un producto -> Actualiza en WooCommerce
   */
  async update(id: string, data: UpdateServiceInput) {
    const productId = parseInt(id, 10);

    // Validar existencia
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    // Preparar Payload para WP
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.description) payload.description = data.description;
    if (data.price) payload.regular_price = String(data.price);

    // Metadatos
    if (data.hasHomeVisit !== undefined) {
      payload.meta_data = [
        { key: 'has_home_visit', value: String(data.hasHomeVisit) },
      ];
    }

    // Enviar a WP
    await this.wpService.postToWp(`wc/v3/products/${productId}`, payload);

    // Retornar la versión actualizada desde DB local para asegurar consistencia
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: { service: true, postmeta: true },
    });
  }

  /**
   * Eliminar producto -> Mueve a la papelera en WooCommerce
   */
  async remove(id: string) {
    const productId = parseInt(id, 10);

    // En WP REST API, delete force=false lo manda a la papelera
    await this.wpService.postToWp(`wc/v3/products/${productId}`, {
      status: 'trash', // Lo marcamos como borrador/papelera
    });

    // Opcional: Si quieres forzar borrado, usa ?force=true en la URL del servicio

    return { id: productId, success: true };
  }

  // ---------------------------------------------------------
  // MÉTODOS DE LECTURA (Se mantienen con Prisma para velocidad)
  // ---------------------------------------------------------

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        service: { include: { category: true } },
        postmeta: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: { service: true, postmeta: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async findByCategory(categorySlug: string) {
    return this.prisma.product.findMany({
      where: { service: { slug: categorySlug } },
      include: { service: true, postmeta: true },
    });
  }

  async findServiceDetail(serviceId: string, providerId: string) {
    // Mantenemos tu lógica de búsqueda detallada tal cual, ya que es lectura
    const sId = parseInt(serviceId, 10);
    // ... (El resto de tu código findServiceDetail original está perfecto)
    const product = await this.prisma.product.findFirst({
      where: {
        serviceId: sId,
        postmeta: { some: { key: 'provider_id', value: providerId } },
      },
      include: { service: true, postmeta: true },
    });

    if (!product) return null;

    const hasHomeVisitMeta = product.postmeta.find(
      (m) => m.key === 'has_home_visit',
    );
    const provider = await this.prisma.provider.findUnique({
      where: { id: parseInt(providerId) },
      include: { user: true },
    });

    if (!provider) return null;

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
}
