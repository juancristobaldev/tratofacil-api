import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { Request } from 'express';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { ServicesModule } from './modules/services/services.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ConfigModule } from '@nestjs/config';
import { WordpressModule } from './modules/wordpress/wordpress.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmailModule } from './modules/email/email.module';
import { HobbysModule } from './modules/hobbys/hobbys.module';
import { CategoriesProductModule } from './modules/categories-product/categories-product.module';
import { ProductModule } from './modules/product/product.module';
import { OrderProductModule } from './modules/order-product/order-product.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      // no más playground, Apollo Studio lo reemplaza
      playground: false,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProvidersModule,
    ServicesModule,
    CoreModule,
    PaymentsModule,
    WordpressModule,
    CertificatesModule,
    AdminModule,
    EmailModule,
    HobbysModule,
    CategoriesProductModule,
    ProductModule,
    OrderProductModule,
    MarketplaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
