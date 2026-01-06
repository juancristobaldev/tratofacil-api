import { Module } from '@nestjs/common';
import { OrderProductService } from './order-product.service';
import { OrderProductResolver } from './order-product.resolver';

@Module({
  providers: [OrderProductService, OrderProductResolver]
})
export class OrderProductModule {}
