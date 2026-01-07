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
import { PrismaService } from 'src/prisma/prisma.service';

@Resolver(() => CategoryProduct)
export class CategoriesProductResolver {
  constructor(
    private readonly categoriesProductService: CategoriesProductService,
    private readonly prisma: PrismaService,
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
    const products = await this.prisma.product.findMany();
    console.log(products);
    const categories = await this.categoriesProductService.findAll({
      products: {
        some: {
          stock: {
            not: 0,
          },
        },
      },
    });

    const categoriesFilter = categories.map((cat) => {
      const productsCat = cat.products.filter((product) => product.stock !== 0);

      return {
        ...cat,
        products: productsCat,
      };
    });

    return categoriesFilter;
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
