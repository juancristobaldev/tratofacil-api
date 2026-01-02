import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Utilidad para manejar BigInt de Prisma (convertir a number/string seguro)
   */
  private toInt(value: bigint | number): number {
    return Number(value);
  }

  /**
   * Obtiene las subcategorías (Servicios) de una categoría padre,
   * incluyendo los proveedores que tienen productos publicados en ellas.
   */
  async findByCategory(categorySlug: string) {
    // 1. Buscar el término padre (Categoría Principal)
    const parentTerm = await this.prisma.wpTerm.findFirst({
      where: { slug: categorySlug },
    });

    if (!parentTerm) return [];

    const parentTermId = parentTerm.term_id;

    // 2. Buscar taxonomías hijas (Subcategorías -> Servicios)
    const childTaxonomies = await this.prisma.wpTermTaxonomy.findMany({
      where: {
        parent: parentTermId,
        taxonomy: 'product_cat',
      },
      include: {
        term: true,
      },
    });

    // 3. Procesar cada subcategoría para encontrar productos y proveedores
    const services = await Promise.all(
      childTaxonomies.map(async (tax) => {
        // Buscar relaciones: IDs de productos en esta subcategoría
        const relationships = await this.prisma.wpTermRelationship.findMany({
          where: { term_taxonomy_id: tax.term_taxonomy_id },
        });

        const productIds = relationships.map((r) => r.object_id);

        if (productIds.length === 0) {
          return {
            id: this.toInt(tax.term_id),
            name: tax.term.name,
            slug: tax.term.slug,
            description: tax.description,
            price: 0,
            providers: [],
            hasHomeVisit: false,
          };
        }

        // Buscar los productos PUBLICADOS
        const products = await this.prisma.wpPost.findMany({
          where: {
            ID: { in: productIds },
            post_status: 'publish',
            post_type: 'product',
          },
          include: {
            postmeta: true,
          },
        });

        // Agrupar proveedores y calcular precio mínimo ("Desde $...")
        let minPrice = Infinity;
        let hasHomeVisit = false;
        const providersMap = new Map<number, any>();

        for (const product of products) {
          // -- Lógica de Precio --
          const priceMeta = product.postmeta.find(
            (m) => m.meta_key === '_price',
          );

          // CORRECCIÓN TS(2345): Aseguramos que pasamos un string o '0' si es null
          const priceVal = priceMeta?.meta_value ?? '0';
          const price = parseFloat(priceVal);

          if (price > 0 && price < minPrice) {
            minPrice = price;
          }

          // -- Lógica de Visita a Domicilio --
          const homeVisitMeta = product.postmeta.find(
            (m) => m.meta_key === 'has_home_visit',
          );
          if (homeVisitMeta?.meta_value === 'true') hasHomeVisit = true;

          // -- Lógica de Proveedor (Autor) --
          const userId = this.toInt(product.post_author);

          if (userId && !providersMap.has(userId)) {
            providersMap.set(userId, { price });
          }
        }

        // CORRECCIÓN TS(7005): Inicializamos explícitamente con tipo
        let providers: any[] = [];

        if (providersMap.size > 0) {
          const userIds = Array.from(providersMap.keys());

          const dbProviders = await this.prisma.provider.findMany({
            where: { userId: { in: userIds } },
          });

          providers = dbProviders.map((p) => ({
            ...p,
            price: providersMap.get(p.userId)?.price || 0,
          }));
        }

        return {
          id: this.toInt(tax.term_id),
          name: tax.term.name,
          slug: tax.term.slug,
          description: tax.description,
          price: minPrice === Infinity ? 0 : minPrice,
          hasHomeVisit,
          providers: providers,
        };
      }),
    );

    return services;
  }

  /**
   * Detalle de un servicio específico (Producto) para un proveedor
   */
  async findServiceDetail(serviceId: string, providerId: string) {
    const termId = parseInt(serviceId, 10);
    const provId = parseInt(providerId, 10);

    const provider = await this.prisma.provider.findUnique({
      where: { id: provId },
      include: { user: true },
    });

    if (!provider) return null;

    const taxonomy = await this.prisma.wpTermTaxonomy.findFirst({
      where: { term_id: termId, taxonomy: 'product_cat' },
    });
    if (!taxonomy) return null;

    const relations = await this.prisma.wpTermRelationship.findMany({
      where: { term_taxonomy_id: taxonomy.term_taxonomy_id },
    });
    const postIds = relations.map((r) => r.object_id);

    const product = await this.prisma.wpPost.findFirst({
      where: {
        ID: { in: postIds },
        post_author: provider.user.id,
        post_type: 'product',
        post_status: 'publish',
      },
      include: { postmeta: true },
    });

    if (!product) return null;

    const priceMeta = product.postmeta.find((m) => m.meta_key === '_price');
    const homeVisitMeta = product.postmeta.find(
      (m) => m.meta_key === 'has_home_visit',
    );

    // CORRECCIÓN TS(2345): Safe parse float
    const priceVal = priceMeta?.meta_value ?? '0';
    const price = parseFloat(priceVal);

    return {
      id: this.toInt(product.ID),
      name: product.post_title,
      description: product.post_content,
      price: price,
      hasHomeVisit: homeVisitMeta?.meta_value === 'true',
      provider: provider,
      netAmount: 0,
      commission: 0,
    };
  }

  async findAll() {
    return [];
  }
}
