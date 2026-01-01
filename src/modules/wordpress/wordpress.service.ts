import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WordpressService {
  private readonly logger = new Logger(WordpressService.name);
  private readonly wpUrl: string | undefined;
  private readonly ck: string | undefined; // Consumer Key
  private readonly cs: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.wpUrl = this.configService.get<string>('WORDPRESS_URL');
    this.ck = this.configService.get<string>('WC_CONSUMER_KEY');
    this.cs = this.configService.get<string>('WC_CONSUMER_SECRET');
  }

  // Método genérico para autenticación básica de WP/WooCommerce
  private getAuthParams() {
    return {
      consumer_key: this.ck,
      consumer_secret: this.cs,
    };
  }

  /**
   * Crea una categoría en WooCommerce (Usado para Categorías Reales y Proveedores como Subcategorías)
   */
  async createCategory(data: {
    name: string;
    parent?: number;
    image?: { src: string };
  }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.wpUrl}/wp-json/wc/v3/products/categories`,
          data,
          { params: this.getAuthParams() },
        ),
      );
      this.logger.log(`Categoría creada en WP: ${response.data.id}`);
      return response.data; // Retorna el objeto completo de WP, incluyendo el ID
    } catch (error: any) {
      this.logger.error('Error creando categoría en WP', error.response?.data);
      throw new InternalServerErrorException(
        'Error al sincronizar con WordPress',
      );
    }
  }

  /**
   * Crea un Producto en WooCommerce (Tus Servicios)
   */
  async createProduct(data: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.wpUrl}/wp-json/wc/v3/products`, data, {
          params: this.getAuthParams(),
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Error creando producto en WP', error.response?.data);
      throw new InternalServerErrorException(
        'Error al crear el servicio en WordPress',
      );
    }
  }
}
