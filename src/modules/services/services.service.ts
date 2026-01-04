import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateServiceInput,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Utilidad para manejar BigInt de Prisma (convertir a number/string seguro)
   */

  async create(input: CreateServiceInput, userId: number) {
    // 1. Buscar la SUBCATEGORÍA REAL
    const taxonomy = await this.prisma.wpTermTaxonomy.findFirst({
      where: {
        term_id: input.subCategoryId,
        taxonomy: 'product_cat',
      },
      include: {
        term: true,
      },
    });

    if (!taxonomy) {
      throw new NotFoundException('La subcategoría no existe');
    }

    const provider = await this.prisma.provider.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!provider) return;
    // 2. Crear producto (wp_posts)
    const now = new Date();

    const product = await this.prisma.wpPost.create({
      data: {
        post_author: BigInt(provider.id),

        post_date: now,
        post_date_gmt: now,

        post_content: input.description ?? '',
        post_title: taxonomy.term.name,
        post_excerpt: '',

        post_status: 'publish',
        comment_status: 'closed',
        ping_status: 'closed',

        post_password: '',
        post_name: taxonomy.term.slug,

        to_ping: '',
        pinged: '',

        post_modified: now,
        post_modified_gmt: now,

        post_content_filtered: '',
        post_parent: BigInt(0),

        guid: '',

        menu_order: 0,
        post_type: 'product',
        post_mime_type: '',

        comment_count: BigInt(0),
      },
    });

    // 3. Vincular SOLO a la subcategoría
    await this.prisma.wpTermRelationship.create({
      data: {
        object_id: product.ID,
        term_taxonomy_id: taxonomy.term_taxonomy_id,
      },
    });

    // 4. Metas del producto
    await this.prisma.wpPostMeta.createMany({
      data: [
        {
          post_id: product.ID,
          meta_key: '_price',
          meta_value: String(input.price),
        },
        {
          post_id: product.ID,
          meta_key: 'has_home_visit',
          meta_value: input.hasHomeVisit ? 'true' : 'false',
        },
      ],
    });

    return {
      id: Number(product.ID),
      name: product.post_title,
      slug: product.post_name,
      description: product.post_content,
      price: input.price,
      hasHomeVisit: input.hasHomeVisit ?? false,
    };
  }

  private toInt(value: bigint | number): number {
    return Number(value);
  }

  /**c
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
            where: { id: { in: userIds } },
          });

          providers = dbProviders.map((p) => ({
            ...p,
            price: providersMap.get(p.id)?.price || 0,
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

    console.log({ provider });
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
        post_author: provider.id,
        post_type: 'product',
        post_status: 'publish',
      },
      include: { postmeta: true },
    });

    console.log({ product });

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

  async findByProvider(userId: number) {
    const provider = await this.prisma.provider.findFirst({
      where: {
        userId,
      },
    });

    if (!provider) return;

    const posts = await this.prisma.wpPost.findMany({
      where: {
        post_author: BigInt(provider.id),
        post_type: 'product',
        post_status: 'publish',
      },
      include: {
        postmeta: true,
        termRelationships: {
          include: {
            taxonomy: true,
          },
        },
      },
    });

    return posts.map((post) => {
      const priceMeta = post.postmeta.find((m) => m.meta_key === '_price');

      const taxonomy = post.termRelationships[0]?.taxonomy;

      return {
        id: Number(post.ID),
        name: post.post_title,
        description: post.post_content,
        price: Number(priceMeta?.meta_value ?? 0),
        categoryId: taxonomy ? Number(taxonomy.parent) : null,
        subCategoryId: taxonomy ? Number(taxonomy.term_id) : null,
      };
    });
  }

  /* =========================
     ACTUALIZAR SERVICIO
  ========================= */

  async update(serviceId: number, input: UpdateServiceInput, userId: number) {
    const post = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(serviceId) },
    });

    const provider = await this.prisma.provider.findFirst({
      where: {
        userId,
      },
    });

    if (!provider) return;
    if (!post || Number(post.post_author) !== provider.id) {
      throw new ForbiddenException('No autorizado');
    }

    await this.prisma.wpPost.update({
      where: { ID: BigInt(serviceId) },
      data: {
        post_content: input.description ?? post.post_content,
      },
    });

    if (input.price !== undefined) {
      const existingPrice = await this.prisma.wpPostMeta.findFirst({
        where: {
          post_id: BigInt(serviceId),
          meta_key: '_price',
        },
      });

      if (existingPrice) {
        await this.prisma.wpPostMeta.update({
          where: {
            meta_id: existingPrice.meta_id,
          },
          data: {
            meta_value: String(input.price),
          },
        });
      } else {
        await this.prisma.wpPostMeta.create({
          data: {
            post_id: BigInt(serviceId),
            meta_key: '_price',
            meta_value: String(input.price),
          },
        });
      }
    }

    return {
      id: serviceId,
      price: input.price,
      description: input.description,
    };
  }

  /* =========================
     ELIMINAR SERVICIO
  ========================= */

  async delete(serviceId: number, userId: number) {
    const post = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(serviceId) },
    });

    const provider = await this.prisma.provider.findFirst({
      where: {
        userId,
      },
    });

    if (!provider) return;

    if (!post || Number(post.post_author) !== provider.id) {
      throw new ForbiddenException('No autorizado');
    }

    await this.prisma.wpPost.delete({
      where: { ID: BigInt(serviceId) },
    });
  }
}
