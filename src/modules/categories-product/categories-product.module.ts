import { Module } from '@nestjs/common';
import { CategoriesProductService } from './categories-product.service';
import { CategoriesProductResolver } from './categories-product.resolver';

@Module({
  providers: [CategoriesProductService, CategoriesProductResolver]
})
export class CategoriesProductModule {}
