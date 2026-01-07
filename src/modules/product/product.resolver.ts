import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from 'src/graphql/entities/product.entity';
import { ProductService } from './product.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productsService: ProductService) {}

  // =========================================================
  // CONSULTAS (QUERIES)
  // =========================================================

  /**
   * Obtiene la lista completa de productos físicos con sus imágenes y condiciones.
   */
  @Query(() => [Product], { name: 'products' })
  async findAll() {
    return this.productsService.findAll();
  }

  /**
   * Busca un producto por su ID único.
   */
  @Query(() => Product, { name: 'product' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * Busca un producto por su slug (ideal para SEO).
   */
  @Query(() => Product, { name: 'productBySlug' })
  async findBySlug(@Args('slug', { type: () => String }) slug: string) {
    return this.productsService.findBySlug(slug);
  }

  /**
   * Filtra los productos de un proveedor específico.
   */
  @Query(() => [Product], { name: 'productsByProvider' })
  async findByProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    // Usamos el objeto de filtro de Prisma
    return this.productsService.findAll({ providerId });
  }

  /**
   * Filtra los productos por su categoría.
   */
  @Query(() => [Product], { name: 'productsByCategory' })
  async findByCategory(
    @Args('categoryProductId', { type: () => Int }) categoryProductId: number,
  ) {
    // ✅ CORRECCIÓN: Se cambió findOne por findAll con filtro para devolver un array
    return this.productsService.findAll({ categoryProductId });
  }

  // =========================================================
  // MUTACIONES (MUTATIONS)
  // =========================================================

  /**
   * Crea un nuevo producto, sus imágenes y sus condiciones de despacho.
   */
  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @Context() context: any,
  ) {
    const user = context.req.user;
    return this.productsService.create(input, user.id);
  }

  /**
   * Actualiza la información del producto, incluyendo fotos y condiciones de entrega.
   */
  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  async updateProduct(@Args('input') input: UpdateProductInput) {
    return this.productsService.update(input);
  }

  /**
   * Elimina un producto y sus archivos físicos asociados.
   */
  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  async removeProduct(@Args('id', { type: () => Int }) id: number) {
    return this.productsService.remove(id);
  }

  /**
   * Ajusta el stock de un producto.
   */
  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  async updateProductStock(
    @Args('id', { type: () => Int }) id: number,
    @Args('quantity', {
      type: () => Int,
      description: 'Cantidad a añadir (+) o quitar (-)',
    })
    quantity: number,
  ) {
    return this.productsService.updateStock(id, quantity);
  }
}
