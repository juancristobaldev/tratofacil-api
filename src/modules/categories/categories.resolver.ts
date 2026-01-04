import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CategoryService } from './categories.service';
import {
  Category,
  CreateCategoryInput,
} from 'src/graphql/entities/category.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Query: Obtener todos los rubros/categorías
   * Mapea directamente a las taxonomías 'product_cat' de WP
   */
  @Query(() => [Category])
  async categoriesWithParent() {
    return this.categoryService.listWithParent();
  }

  @Query(() => [Category], { name: 'categories' })
  async getCategories() {
    return this.categoryService.list();
  }

  /**
   * Query: Obtener una categoría específica por su ID de Term
   */
  @Query(() => Category, { name: 'category' })
  async getCategory(@Args('id', { type: () => Int }) id: number) {
    return this.categoryService.findById(id);
  }

  /**
   * Mutation: Crear una nueva categoría (Rubro)
   * Solo accesible por administradores (puedes añadir roles más adelante)
   */
  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard)
  async createCategory(@Args('input') input: CreateCategoryInput) {
    return this.categoryService.create(input);
  }
}
