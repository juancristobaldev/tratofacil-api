import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesProductResolver } from './categories-product.resolver';

describe('CategoriesProductResolver', () => {
  let resolver: CategoriesProductResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesProductResolver],
    }).compile();

    resolver = module.get<CategoriesProductResolver>(CategoriesProductResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
