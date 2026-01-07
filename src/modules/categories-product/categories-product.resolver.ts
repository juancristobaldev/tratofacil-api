import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CategoriesProductService } from './categories-product.service';
import {
  CategoryProduct,
  CreateCategoryProductInput,
  UpdateCategoryProductInput,
} from '../../graphql/entities/category-product';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../graphql/enums/role.enum';

@Resolver(() => CategoryProduct)
export class CategoriesProductResolver {
  constructor(
    private readonly categoriesProductService: CategoriesProductService,
  ) {}

  @Mutation(() => CategoryProduct)
  @UseGuards(JwtAuthGuard)
  async createCategoryProduct(
    @Args('input') input: CreateCategoryProductInput,
  ) {
    return this.categoriesProductService.create(input);
  }

  @Query(() => [CategoryProduct], { name: 'categoriesProducts' })
  async findAll() {
    return this.categoriesProductService.findAll();
  }

  @Query(() => CategoryProduct, { name: 'categoryProduct' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.categoriesProductService.findOne(id);
  }

  @Query(() => [CategoryProduct], { name: 'mainCategoryProducts' })
  async findMainCategories() {
    return this.categoriesProductService.findMainCategories();
  }

  @Mutation(() => CategoryProduct)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCategoryProduct(
    @Args('input') input: UpdateCategoryProductInput,
  ) {
    return this.categoriesProductService.update(input);
  }

  @Mutation(() => CategoryProduct)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeCategoryProduct(@Args('id', { type: () => Int }) id: number) {
    return this.categoriesProductService.remove(id);
  }
}
