import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CategoryService } from './categories.service';
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from 'src/graphql/entities/category.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/graphql/enums/role.enum';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Obtener todas las categorías y rubros
   */
  @Query(() => [Category], { name: 'categories' })
  async getCategories() {
    return this.categoryService.list();
  }

  /**
   * Obtener solo categorías principales (Rubros)
   */
  @Query(() => [Category], { name: 'mainCategories' })
  async getMainCategories() {
    return this.categoryService.listMainCategories();
  }

  /**
   * Obtener solo subcategorías (Servicios del catálogo)
   */
  @Query(() => [Category], { name: 'subCategories' })
  async getSubcategories() {
    return this.categoryService.listSubcategories();
  }

  /**
   * Obtener una categoría específica por ID
   */
  @Query(() => Category, { name: 'category' })
  async getCategory(@Args('id', { type: () => Int }) id: number) {
    return this.categoryService.findById(id);
  }

  /**
   * Crear una nueva categoría
   * Protegido: Solo administradores pueden crear categorías en el catálogo
   */
  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCategory(@Args('input') input: CreateCategoryInput) {
    return this.categoryService.create(input);
  }

  /**
   * Actualizar una categoría existente
   */
  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCategory(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCategoryInput,
  ) {
    return this.categoryService.update(id, input);
  }

  /**
   * Eliminar una categoría
   */
  @Mutation(() => Category)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCategory(@Args('id', { type: () => Int }) id: number) {
    return this.categoryService.delete(id);
  }
}
