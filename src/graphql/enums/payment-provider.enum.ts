import { registerEnumType } from '@nestjs/graphql';

export enum PaymentProvider {
  WEBPAY = 'WEBPAY',
  MERCADOPAGO = 'MERCADOPAGO',
}

registerEnumType(PaymentProvider, {
  name: 'PaymentProvider',
  description: 'Proveedores de pago disponibles',
});
