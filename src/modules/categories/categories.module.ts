import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoryService } from './categories.service';
import { CategoriesResolver } from './categories.resolver';


@Module({
  controllers: [CategoriesController],
  providers: [CategoryService, CategoriesResolver]
})
export class CategoriesModule {}
