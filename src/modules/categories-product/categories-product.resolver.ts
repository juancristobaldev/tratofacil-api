import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import {
  CategoryProduct,
  CreateCategoryProductInput,
  UpdateCategoryProductInput,
} from 'src/graphql/entities/category-product';
import { CategoriesProductService } from './categories-product.service';

@Resolver(() => CategoryProduct)
export class CategoriesProductResolver {
  constructor(
    private readonly categoriesProductService: CategoriesProductService,
  ) {}

  // =========================================================
  // QUERIES (Consultas)
  // =========================================================

  /**
   * Obtiene todas las categorías de productos disponibles.
   */
  @Query(() => [CategoryProduct], { name: 'categoriesProducts' })
  async findAll() {
    return this.categoriesProductService.findAll();
  }

  /**
   * Obtiene una categoría específica por su ID.
   */
  @Query(() => CategoryProduct, { name: 'categoryProduct' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.categoriesProductService.findOne(id);
  }

  /**
   * Busca una categoría por su slug (útil para URLs dinámicas).
   */
  @Query(() => CategoryProduct, { name: 'categoryProductBySlug' })
  async findBySlug(@Args('slug', { type: () => String }) slug: string) {
    return this.categoriesProductService.findBySlug(slug);
  }

  /**
   * Obtiene solo las categorías de nivel superior.
   */
  @Query(() => [CategoryProduct], { name: 'mainCategoryProducts' })
  async findMainCategories() {
    return this.categoriesProductService.findMainCategories();
  }

  // =========================================================
  // MUTATIONS (Modificaciones)
  // =========================================================

  /**
   * Crea una nueva categoría de producto.
   */
  @Mutation(() => CategoryProduct)
  async createCategoryProduct(
    @Args('createCategoryProductInput')
    createCategoryProductInput: CreateCategoryProductInput,
  ) {
    return this.categoriesProductService.create(createCategoryProductInput);
  }

  /**
   * Actualiza los datos de una categoría existente.
   */
  @Mutation(() => CategoryProduct)
  async updateCategoryProduct(
    @Args('updateCategoryProductInput')
    updateCategoryProductInput: UpdateCategoryProductInput,
  ) {
    return this.categoriesProductService.update(updateCategoryProductInput);
  }

  /**
   * Elimina una categoría del sistema.
   */
  @Mutation(() => CategoryProduct)
  async removeCategoryProduct(@Args('id', { type: () => Int }) id: number) {
    return this.categoriesProductService.remove(id);
  }
}
