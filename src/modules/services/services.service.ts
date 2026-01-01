import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WordpressService } from '../wordpress/wordpress.service';
import { CreateServiceInput } from 'src/graphql/entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wpService: WordpressService,
  ) {}

  async create(data: CreateServiceInput) {
    // 1. Crear producto en WooCommerce API
    const wpProduct = await this.wpService.createProduct({
      name: data.name,
      type: 'simple',
      regular_price: String(data.price),
      description: data.description,
      categories: [{ id: data.categoryId }],
      meta_data: [
        { key: 'provider_id', value: String(data.providerId) },
        { key: 'has_home_visit', value: String(data.hasHomeVisit) },
      ],
    });

    // 2. Retornar mapeado (Conversión de BigInt a Number)
    return {
      id: Number(wpProduct.id),
      name: wpProduct.name,
      price: data.price,
      commission: data.price * 0.1,
      netAmount: data.price * 0.9,
      hasHomeVisit: data.hasHomeVisit,
    };
  }

  async findAll() {
    const posts = await this.prisma.wpPost.findMany({
      where: { post_type: 'product', post_status: 'publish' },
      include: { postmeta: true },
    });

    return posts.map((post) => this.mapWpPostToService(post));
  }

  private mapWpPostToService(post: any) {
    const priceMeta = post.postmeta.find(
      (m: any) => m.meta_key === '_regular_price',
    );
    const visitMeta = post.postmeta.find(
      (m: any) => m.meta_key === 'has_home_visit',
    );
    const price = parseFloat(priceMeta?.meta_value || '0');

    return {
      id: Number(post.ID), // Casting BigInt
      name: post.post_title,
      description: post.post_content,
      price,
      commission: price * 0.1,
      netAmount: price * 0.9,
      hasHomeVisit: visitMeta?.meta_value === 'true',
      createdAt: post.post_date,
    };
  }
}
