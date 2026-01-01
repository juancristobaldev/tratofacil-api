import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WordpressService {
  private readonly logger = new Logger(WordpressService.name);
  private readonly wpUrl?: string;
  private readonly ck?: string; // Consumer Key
  private readonly cs?: string; // Consumer Secret

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.wpUrl = this.configService.get<string>('WORDPRESS_URL');
    this.ck = this.configService.get<string>('WC_CONSUMER_KEY');
    this.cs = this.configService.get<string>('WC_CONSUMER_SECRET');

    // Validación temprana para evitar errores silenciosos
    if (!this.wpUrl || !this.ck || !this.cs) {
      this.logger.warn(
        '⚠️  ATENCIÓN: Faltan variables de entorno de WordPress (WORDPRESS_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET). Las llamadas a la API fallarán.',
      );
    }
  }

  /**
   * Helper privado para generar parámetros de autenticación
   */
  private getAuthParams() {
    return {
      consumer_key: this.ck,
      consumer_secret: this.cs,
    };
  }

  /**
   * Método Genérico para enviar datos a WP
   * Centraliza la lógica de conexión y errores
   */
  async postToWp(endpoint: string, data: any) {
    try {
      // Normalizamos la URL para evitar dobles slashes
      const cleanEndpoint = endpoint.startsWith('/')
        ? endpoint.slice(1)
        : endpoint;
      const url = `${this.wpUrl}/wp-json/${cleanEndpoint}`;

      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          params: this.getAuthParams(),
        }),
      );

      return response.data;
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Crea una Categoría en WooCommerce
   * ALINEACIÓN: Agregados 'slug' y 'description' para coincidir con CategoryService
   */
  async createCategory(data: {
    name: string;
    slug?: string; // <--- Agregado para alineación
    description?: string; // <--- Agregado para alineación
    parent?: number;
    image?: { src: string };
  }) {
    this.logger.log(`Sincronizando categoría en WP: ${data.name}`);
    return this.postToWp('wc/v3/products/categories', data);
  }

  /**
   * Crea un Producto (Servicio) en WooCommerce
   * Útil para: Publicar los servicios que crean los proveedores
   */
  async createProduct(data: any) {
    this.logger.log(`Publicando servicio en WP: ${data.name}`);
    return this.postToWp('wc/v3/products', data);
  }

  /**
   * Crea una Orden en WooCommerce
   * Útil para: Registrar la venta y disparar emails de confirmación nativos de WP
   */
  async createOrder(data: any) {
    this.logger.log('Registrando nueva orden en WP...');
    return this.postToWp('wc/v3/orders', data);
  }

  /**
   * Manejador de errores detallado
   */
  private handleError(error: any, endpoint: string) {
    const errorResponse = error.response?.data;

    // Log detallado para el desarrollador
    this.logger.error(
      `Error comunicando con WordPress [${endpoint}]`,
      error.message,
    );
    if (errorResponse) {
      this.logger.error('Detalle WP:', JSON.stringify(errorResponse));
    }

    // Mensaje limpio para el cliente
    const message =
      errorResponse?.message ||
      'Error de comunicación con el servidor de WordPress';
    throw new InternalServerErrorException(message);
  }
}
