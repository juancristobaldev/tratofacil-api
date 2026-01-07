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
import { MarketplaceModule } from './modules/marketplace/marketplace.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // CORRECCIÓN CRÍTICA PARA VERCEL:
      // En Vercel no podemos escribir en src/schema.gql (Read-Only).
      // Usamos /tmp/schema.gql en producción o true (en memoria).
      autoSchemaFile:
        process.env.NODE_ENV === 'PRODUCTION' || process.env.VERCEL
          ? '/tmp/schema.gql'
          : join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      // Playground activado en dev, o usa Apollo Sandbox
      playground: false,
      introspection: true, // Importante habilitarlo en producción para vercel si usas tools externas
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
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
