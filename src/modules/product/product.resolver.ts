import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from 'src/graphql/entities/product.entity';
import { ProductService } from './product.service';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productsService: ProductService) {}

  // =========================================================
  // CONSULTAS (QUERIES)
  // =========================================================

  /**
   * Obtiene la lista completa de productos físicos.
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
   * Busca un producto por su slug (ideal para SEO y URLs amigables).
   */
  @Query(() => Product, { name: 'productBySlug' })
  async findBySlug(@Args('slug', { type: () => String }) slug: string) {
    return this.productsService.findBySlug(slug);
  }

  /**
   * Filtra los productos pertenecientes a un proveedor específico.
   */
  @Query(() => [Product], { name: 'productsByProvider' })
  async findByProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    return this.productsService.findByProvider(providerId);
  }

  /**
   * Filtra los productos por su categoría de producto.
   */
  @Query(() => [Product], { name: 'productsByCategory' })
  async findByCategory(
    @Args('categoryProductId', { type: () => Int }) categoryProductId: number,
  ) {
    return this.productsService.findByCategory(categoryProductId);
  }

  // =========================================================
  // MUTACIONES (MUTATIONS)
  // =========================================================

  /**
   * Crea un nuevo producto en el catálogo.
   */
  @Mutation(() => Product)
  async createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    return this.productsService.create(createProductInput);
  }

  /**
   * Actualiza la información de un producto existente.
   */
  @Mutation(() => Product)
  async updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ) {
    return this.productsService.update(updateProductInput);
  }

  /**
   * Elimina un producto del sistema.
   */
  @Mutation(() => Product)
  async removeProduct(@Args('id', { type: () => Int }) id: number) {
    return this.productsService.remove(id);
  }

  /**
   * Ajusta el stock de un producto (suma o resta cantidades).
   */
  @Mutation(() => Product)
  async updateProductStock(
    @Args('id', { type: () => Int }) id: number,
    @Args('quantity', {
      type: () => Int,
      description: 'Cantidad a añadir (positivo) o quitar (negativo)',
    })
    quantity: number,
  ) {
    return this.productsService.updateStock(id, quantity);
  }
}
