import { Resolver, Mutation, Args, Int, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateCertificateInput,
  ProviderCertificate,
  UpdateCertificateInput,
} from '../../graphql/entities/provider.entity';

import { CertificatesService } from './certificates.service';

@Resolver(() => ProviderCertificate)
export class CertificatesResolver {
  constructor(private readonly certificateServices: CertificatesService) {}

  @Query(() => [ProviderCertificate], { name: 'getMyCertificates' })
  @UseGuards(JwtAuthGuard)
  async getMyCertificates(@Context() context: any) {
    // El ID viene del JWT
    const userId = context.req.user.id;

    // Llamamos al servicio para obtener los certificados del usuario actual
    return this.certificateServices.findAllByUser(userId);
  }

  @Mutation(() => ProviderCertificate)
  @UseGuards(JwtAuthGuard)
  async createCertificate(
    @Args('input') input: CreateCertificateInput,
    @Context() context: any,
  ) {
    // Obtenemos el ID del usuario autenticado para buscar su perfil de proveedor
    const userId = context.req.user.id;
    return this.certificateServices.createCertificate(userId, input);
  }

  @Mutation(() => ProviderCertificate)
  @UseGuards(JwtAuthGuard)
  async updateCertificate(
    @Args('input') input: UpdateCertificateInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.certificateServices.updateCertificate(userId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteCertificate(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.certificateServices.deleteCertificate(userId, id);
  }
}
