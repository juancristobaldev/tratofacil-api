import {
  ObjectType,
  Field,
  Int,
  Float,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { ProviderPlan, PaymentProvider } from '@prisma/client';
import { User } from './user.entity';
import { PlanInterval } from '@prisma/client';
import { PaymentStatus } from '../enums/payment-status.enum';
import { OrderStatus } from '../enums/order-status.enum';

registerEnumType(PlanInterval, { name: 'PlanInterval' });
// =========================================================
// 1. REGISTRO DE ENUMS PARA GRAPHQL
// =========================================================
// Registramos los Enums de Prisma para que GraphQL los reconozca como tipos válidos
registerEnumType(ProviderPlan, {
  name: 'ProviderPlan',
  description: 'Planes disponibles para los proveedores: FREE, PREMIUM, FULL',
});

registerEnumType(PaymentProvider, { name: 'PaymentProvider' });

// =========================================================
// 2. ENTITIES (OBJECT TYPES)
// =========================================================

/**
 * Respuesta estándar para transacciones de Webpay
 */

@ObjectType()
export class WebpayResponse {
  @Field(() => String)
  token: string;

  @Field(() => String)
  url: string;
}

/**
 * Entidad Payment actualizada
 * Soporta tanto órdenes de servicios como órdenes de planes
 */
@ObjectType()
export class PaymentPlan {
  @Field(() => Int)
  id: number;

  @Field(() => Int, { nullable: true })
  orderId?: number;

  @Field(() => Int, { nullable: true })
  planOrderId?: number;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field(() => String, { nullable: true })
  transactionId?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

/**
 * Entidad PlanOrder
 * Representa la compra de una suscripción por parte de un proveedor
 */
@ObjectType()
export class PlanOrder {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => ProviderPlan)
  plan: ProviderPlan;

  @Field(() => Float)
  total: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => PaymentPlan, { nullable: true })
  payment?: PaymentPlan;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

// =========================================================
// 3. INPUTS
// =========================================================

/**
 * Input para iniciar la compra de un plan
 */
@InputType()
export class CreatePlanOrderInput {
  @Field(() => ProviderPlan)
  plan: ProviderPlan;
  @Field(() => PlanInterval) // ✅ Mensual o Anual
  interval: PlanInterval;
}

/**
 * Input opcional para filtros o búsquedas de planes (si lo necesitas a futuro)
 */
@InputType()
export class PlanOrderFilterInput {
  @Field(() => Int, { nullable: true })
  userId?: number;

  @Field(() => ProviderPlan, { nullable: true })
  plan?: ProviderPlan;

  @Field(() => OrderStatus, { nullable: true })
  status?: OrderStatus;
}
