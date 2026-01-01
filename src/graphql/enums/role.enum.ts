import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'Roles de usuario permitidos en la aplicación',
});
