import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

import * as path from 'path';
import sharp from 'sharp';
import * as zlib from 'zlib';

import { promisify } from 'util';
import { memoryStorage } from 'multer';

const gzip = promisify(zlib.gzip);

import { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  private validateKey(key: string) {
    if (key.includes('..') || key.includes('/')) {
      throw new BadRequestException('Ruta de archivo inválida.');
    }
  }
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('seed')
  async helloword(): Promise<string> {
    const categorias = [
      {
        id: 1,
        name: 'Construcción y Remodelación',
        slug: 'construccion-remodelacion',
        description:
          'Servicios para construcción, remodelación y mantenimiento de hogares.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 1,
            name: 'EMT Consultora',
            slug: 'emt-consultora',
            description:
              'Asesorías técnicas y servicios generales de construcción.',
            imageUrl: null,
          },
          {
            id: 2,
            name: 'Pintura interior y exterior',
            slug: 'pintura-interior-exterior',
            description: 'Servicio de pintura de viviendas y fachadas.',
            imageUrl: null,
          },
          {
            id: 3,
            name: 'Albañilería general',
            slug: 'albanileria-general',
            description:
              'Trabajos de albañilería para proyectos residenciales.',
            imageUrl: null,
          },
          {
            id: 4,
            name: 'Electricidad y cableado',
            slug: 'electricidad-cableado',
            description: 'Instalación eléctrica y mantenimiento.',
            imageUrl: null,
          },
          {
            id: 5,
            name: 'Plomería',
            slug: 'plomeria',
            description: 'Reparaciones e instalación de sistemas de agua.',
            imageUrl: null,
          },
          {
            id: 6,
            name: 'Carpintería',
            slug: 'carpinteria',
            description: 'Muebles y estructuras de madera.',
            imageUrl: null,
          },
          {
            id: 7,
            name: 'Decoración de interiores',
            slug: 'decoracion-interiores',
            description: 'Decoración profesional de espacios.',
            imageUrl: null,
          },
          {
            id: 8,
            name: 'Remodelación de baños',
            slug: 'remodelacion-banos',
            description: 'Renovación completa de baños.',
            imageUrl: null,
          },
          {
            id: 9,
            name: 'Remodelación de cocinas',
            slug: 'remodelacion-cocinas',
            description: 'Transforma tu cocina.',
            imageUrl: null,
          },
          {
            id: 10,
            name: 'Limpieza post-construcción',
            slug: 'limpieza-post-construccion',
            description: 'Limpieza completa después de obras.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 2,
        name: 'Tecnología y Computación',
        slug: 'tecnologia-computacion',
        description: 'Todo lo relacionado con informática y tecnología.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 11,
            name: 'Reparación de computadores',
            slug: 'reparacion-computadores',
            description: 'Reparación y mantenimiento de PCs.',
            imageUrl: null,
          },
          {
            id: 12,
            name: 'Instalación de software',
            slug: 'instalacion-software',
            description: 'Instalación de sistemas operativos y programas.',
            imageUrl: null,
          },
          {
            id: 13,
            name: 'Redes y Wi-Fi',
            slug: 'redes-wifi',
            description: 'Configuración de redes domésticas o empresariales.',
            imageUrl: null,
          },
          {
            id: 14,
            name: 'Recuperación de datos',
            slug: 'recuperacion-datos',
            description: 'Recuperación de archivos perdidos.',
            imageUrl: null,
          },
          {
            id: 15,
            name: 'Soporte técnico remoto',
            slug: 'soporte-remoto',
            description: 'Asistencia técnica vía internet.',
            imageUrl: null,
          },
          {
            id: 16,
            name: 'Mantenimiento de laptops',
            slug: 'mantenimiento-laptops',
            description: 'Limpieza y optimización de laptops.',
            imageUrl: null,
          },
          {
            id: 17,
            name: 'Seguridad informática',
            slug: 'seguridad-informatica',
            description: 'Protección contra virus y malware.',
            imageUrl: null,
          },
          {
            id: 18,
            name: 'Servicios de impresión 3D',
            slug: 'impresion-3d',
            description: 'Diseño y fabricación en 3D.',
            imageUrl: null,
          },
          {
            id: 19,
            name: 'Diseño web',
            slug: 'diseno-web',
            description: 'Creación de sitios web.',
            imageUrl: null,
          },
          {
            id: 20,
            name: 'Optimización SEO',
            slug: 'optimizacion-seo',
            description: 'Mejora de visibilidad online.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 3,
        name: 'Salud y Bienestar',
        slug: 'salud-bienestar',
        description: 'Servicios médicos y de bienestar personal.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 21,
            name: 'Masajes terapéuticos',
            slug: 'masajes-terapeuticos',
            description: 'Alivio muscular y relajación.',
            imageUrl: null,
          },
          {
            id: 22,
            name: 'Nutrición y dietética',
            slug: 'nutricion-dietetica',
            description: 'Asesoría nutricional profesional.',
            imageUrl: null,
          },
          {
            id: 23,
            name: 'Clínica dental',
            slug: 'clinica-dental',
            description: 'Servicios odontológicos completos.',
            imageUrl: null,
          },
          {
            id: 24,
            name: 'Medicina general',
            slug: 'medicina-general',
            description: 'Consultas médicas básicas.',
            imageUrl: null,
          },
          {
            id: 25,
            name: 'Psicología',
            slug: 'psicologia',
            description: 'Atención psicológica y terapias.',
            imageUrl: null,
          },
          {
            id: 26,
            name: 'Fisioterapia',
            slug: 'fisioterapia',
            description: 'Rehabilitación física.',
            imageUrl: null,
          },
          {
            id: 27,
            name: 'Yoga y pilates',
            slug: 'yoga-pilates',
            description: 'Clases de relajación y ejercicios.',
            imageUrl: null,
          },
          {
            id: 28,
            name: 'Acupuntura',
            slug: 'acupuntura',
            description: 'Tratamientos de medicina alternativa.',
            imageUrl: null,
          },
          {
            id: 29,
            name: 'Medicina estética',
            slug: 'medicina-estetica',
            description: 'Tratamientos de belleza y estética.',
            imageUrl: null,
          },
          {
            id: 30,
            name: 'Servicios de emergencia',
            slug: 'servicios-emergencia',
            description: 'Atención rápida ante emergencias médicas.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 4,
        name: 'Belleza y Estética',
        slug: 'belleza-estetica',
        description: 'Servicios de cuidado personal y belleza.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 31,
            name: 'Peluquería',
            slug: 'peluqueria',
            description: 'Cortes y peinados profesionales.',
            imageUrl: null,
          },
          {
            id: 32,
            name: 'Manicure y pedicure',
            slug: 'manicure-pedicure',
            description: 'Cuidado de uñas y manos.',
            imageUrl: null,
          },
          {
            id: 33,
            name: 'Maquillaje profesional',
            slug: 'maquillaje-profesional',
            description: 'Asesoría y aplicación de maquillaje.',
            imageUrl: null,
          },
          {
            id: 34,
            name: 'Depilación',
            slug: 'depilacion',
            description: 'Depilación profesional.',
            imageUrl: null,
          },
          {
            id: 35,
            name: 'Tratamientos faciales',
            slug: 'tratamientos-faciales',
            description: 'Cuidado de la piel y estética facial.',
            imageUrl: null,
          },
          {
            id: 36,
            name: 'Masajes relajantes',
            slug: 'masajes-relajantes',
            description: 'Masajes para relajación general.',
            imageUrl: null,
          },
          {
            id: 37,
            name: 'Tratamientos corporales',
            slug: 'tratamientos-corporales',
            description: 'Spa y cuidado corporal.',
            imageUrl: null,
          },
          {
            id: 38,
            name: 'Barbería',
            slug: 'barberia',
            description: 'Corte y cuidado de barba y cabello.',
            imageUrl: null,
          },
          {
            id: 39,
            name: 'Extensiones de cabello',
            slug: 'extensiones-cabello',
            description: 'Aplicación de extensiones.',
            imageUrl: null,
          },
          {
            id: 40,
            name: 'Maquillaje de novias',
            slug: 'maquillaje-novias',
            description: 'Maquillaje profesional para bodas.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 5,
        name: 'Transporte y Movilidad',
        slug: 'transporte-movilidad',
        description: 'Servicios de transporte y logística.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 41,
            name: 'Taxi y remises',
            slug: 'taxi-remises',
            description: 'Traslado rápido y seguro.',
            imageUrl: null,
          },
          {
            id: 42,
            name: 'Mudanzas',
            slug: 'mudanzas',
            description: 'Traslado de objetos y muebles.',
            imageUrl: null,
          },
          {
            id: 43,
            name: 'Transporte de carga',
            slug: 'transporte-carga',
            description: 'Servicios de logística y transporte.',
            imageUrl: null,
          },
          {
            id: 44,
            name: 'Alquiler de autos',
            slug: 'alquiler-autos',
            description: 'Renta de vehículos.',
            imageUrl: null,
          },
          {
            id: 45,
            name: 'Transporte escolar',
            slug: 'transporte-escolar',
            description: 'Servicio seguro para estudiantes.',
            imageUrl: null,
          },
          {
            id: 46,
            name: 'Servicio de encomiendas',
            slug: 'servicio-encomiendas',
            description: 'Envío de paquetes y documentos.',
            imageUrl: null,
          },
          {
            id: 47,
            name: 'Transporte turístico',
            slug: 'transporte-turistico',
            description: 'Rutas y tours privados.',
            imageUrl: null,
          },
          {
            id: 48,
            name: 'Motocourier',
            slug: 'motocourier',
            description: 'Entrega rápida en motocicleta.',
            imageUrl: null,
          },
          {
            id: 49,
            name: 'Alquiler de furgones',
            slug: 'alquiler-furgones',
            description: 'Renta de furgones para mudanzas.',
            imageUrl: null,
          },
          {
            id: 50,
            name: 'Taxis ejecutivos',
            slug: 'taxis-ejecutivos',
            description: 'Traslado de empresas y ejecutivos.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 6,
        name: 'Hogar y Jardín',
        slug: 'hogar-jardin',
        description: 'Servicios para el hogar, jardín y mantenimiento.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 51,
            name: 'Limpieza de casas',
            slug: 'limpieza-casas',
            description: 'Limpieza integral de viviendas.',
            imageUrl: null,
          },
          {
            id: 52,
            name: 'Mantenimiento de jardines',
            slug: 'mantenimiento-jardines',
            description: 'Cuidado de áreas verdes.',
            imageUrl: null,
          },
          {
            id: 53,
            name: 'Poda de árboles',
            slug: 'poda-arboles',
            description: 'Corte y mantenimiento de árboles.',
            imageUrl: null,
          },
          {
            id: 54,
            name: 'Plomería domiciliaria',
            slug: 'plomeria-domiciliaria',
            description: 'Reparaciones y mantenimiento de agua.',
            imageUrl: null,
          },
          {
            id: 55,
            name: 'Electricidad domiciliaria',
            slug: 'electricidad-domiciliaria',
            description: 'Instalación y reparación eléctrica.',
            imageUrl: null,
          },
          {
            id: 56,
            name: 'Reparación de electrodomésticos',
            slug: 'reparacion-electrodomesticos',
            description: 'Arreglo de aparatos eléctricos del hogar.',
            imageUrl: null,
          },
          {
            id: 57,
            name: 'Decoración de interiores',
            slug: 'decoracion-interiores-hogar',
            description: 'Asesoría y diseño de espacios.',
            imageUrl: null,
          },
          {
            id: 58,
            name: 'Carpintería a medida',
            slug: 'carpinteria-medida',
            description: 'Muebles y estructuras personalizadas.',
            imageUrl: null,
          },
          {
            id: 59,
            name: 'Instalación de pisos',
            slug: 'instalacion-pisos',
            description: 'Colocación de cerámicas y madera.',
            imageUrl: null,
          },
          {
            id: 60,
            name: 'Impermeabilización',
            slug: 'impermeabilizacion',
            description: 'Protección de techos y estructuras.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 7,
        name: 'Eventos y Entretenimiento',
        slug: 'eventos-entretenimiento',
        description: 'Servicios para eventos y diversión.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 61,
            name: 'Organización de eventos',
            slug: 'organizacion-eventos',
            description: 'Planificación y logística de eventos.',
            imageUrl: null,
          },
          {
            id: 62,
            name: 'Alquiler de salones',
            slug: 'alquiler-salones',
            description: 'Salones para fiestas y reuniones.',
            imageUrl: null,
          },
          {
            id: 63,
            name: 'Decoración de eventos',
            slug: 'decoracion-eventos',
            description: 'Ambientación de fiestas y eventos.',
            imageUrl: null,
          },
          {
            id: 64,
            name: 'Música en vivo',
            slug: 'musica-vivo',
            description: 'Banda o DJ para eventos.',
            imageUrl: null,
          },
          {
            id: 65,
            name: 'Fotografía de eventos',
            slug: 'fotografia-eventos',
            description: 'Registro profesional de eventos.',
            imageUrl: null,
          },
          {
            id: 66,
            name: 'Video de eventos',
            slug: 'video-eventos',
            description: 'Grabación profesional de eventos.',
            imageUrl: null,
          },
          {
            id: 67,
            name: 'Catering',
            slug: 'catering',
            description: 'Servicio de comida para eventos.',
            imageUrl: null,
          },
          {
            id: 68,
            name: 'Alquiler de mobiliario',
            slug: 'alquiler-mobiliario',
            description: 'Mesas, sillas y decoración.',
            imageUrl: null,
          },
          {
            id: 69,
            name: 'Animación infantil',
            slug: 'animacion-infantil',
            description: 'Shows y actividades para niños.',
            imageUrl: null,
          },
          {
            id: 70,
            name: 'Fotomatón',
            slug: 'fotomaton',
            description: 'Cabina de fotos para eventos.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 8,
        name: 'Transporte de mascotas',
        slug: 'transporte-mascotas',
        description: 'Servicios de cuidado y transporte de animales.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 71,
            name: 'Paseo de perros',
            slug: 'paseo-perros',
            description: 'Caminatas diarias para mascotas.',
            imageUrl: null,
          },
          {
            id: 72,
            name: 'Guardería de mascotas',
            slug: 'guarderia-mascotas',
            description: 'Cuidado durante el día o vacaciones.',
            imageUrl: null,
          },
          {
            id: 73,
            name: 'Transporte de mascotas',
            slug: 'transporte-mascotas-servicio',
            description: 'Traslado seguro de animales.',
            imageUrl: null,
          },
          {
            id: 74,
            name: 'Adiestramiento de perros',
            slug: 'adiestramiento-perros',
            description: 'Educación y entrenamiento canino.',
            imageUrl: null,
          },
          {
            id: 75,
            name: 'Visitas veterinarias a domicilio',
            slug: 'veterinaria-domicilio',
            description: 'Atención médica en casa.',
            imageUrl: null,
          },
          {
            id: 76,
            name: 'Peluchería y accesorios',
            slug: 'pelucheria-accesorios',
            description: 'Venta de productos para mascotas.',
            imageUrl: null,
          },
          {
            id: 77,
            name: 'Servicios de grooming',
            slug: 'grooming',
            description: 'Baños y cortes de pelo.',
            imageUrl: null,
          },
          {
            id: 78,
            name: 'Hospedaje de mascotas',
            slug: 'hospedaje-mascotas',
            description: 'Estancias prolongadas para mascotas.',
            imageUrl: null,
          },
          {
            id: 79,
            name: 'Transporte internacional',
            slug: 'transporte-internacional-mascotas',
            description: 'Viajes seguros para mascotas.',
            imageUrl: null,
          },
          {
            id: 80,
            name: 'Alimentos y snacks',
            slug: 'alimentos-snacks',
            description: 'Comida y premios para mascotas.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 9,
        name: 'Educación y Capacitación',
        slug: 'educacion-capacitacion',
        description: 'Cursos, talleres y clases particulares.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 81,
            name: 'Clases particulares',
            slug: 'clases-particulares',
            description: 'Apoyo escolar individual.',
            imageUrl: null,
          },
          {
            id: 82,
            name: 'Cursos de idiomas',
            slug: 'cursos-idiomas',
            description: 'Aprendizaje de idiomas.',
            imageUrl: null,
          },
          {
            id: 83,
            name: 'Capacitación profesional',
            slug: 'capacitacion-profesional',
            description: 'Cursos técnicos y profesionales.',
            imageUrl: null,
          },
          {
            id: 84,
            name: 'Talleres artísticos',
            slug: 'talleres-artistico',
            description: 'Dibujo, pintura y artes.',
            imageUrl: null,
          },
          {
            id: 85,
            name: 'Clases de música',
            slug: 'clases-musica',
            description: 'Instrumentos y teoría musical.',
            imageUrl: null,
          },
          {
            id: 86,
            name: 'Clases de baile',
            slug: 'clases-baile',
            description: 'Ballet, salsa, danza moderna.',
            imageUrl: null,
          },
          {
            id: 87,
            name: 'Talleres de fotografía',
            slug: 'talleres-fotografia',
            description: 'Aprende técnicas fotográficas.',
            imageUrl: null,
          },
          {
            id: 88,
            name: 'Clases de cocina',
            slug: 'clases-cocina',
            description: 'Aprende recetas y técnicas culinarias.',
            imageUrl: null,
          },
          {
            id: 89,
            name: 'Talleres de programación',
            slug: 'talleres-programacion',
            description: 'Desarrollo de software y apps.',
            imageUrl: null,
          },
          {
            id: 90,
            name: 'Clases de matemáticas',
            slug: 'clases-matematicas',
            description: 'Refuerzo en matemáticas.',
            imageUrl: null,
          },
        ],
      },
      {
        id: 10,
        name: 'Deportes y Recreación',
        slug: 'deportes-recreacion',
        description: 'Actividades deportivas y recreativas.',
        parentId: null,
        imageUrl: null,
        services: [
          {
            id: 91,
            name: 'Gimnasios',
            slug: 'gimnasios',
            description: 'Entrenamiento y fitness.',
            imageUrl: null,
          },
          {
            id: 92,
            name: 'Clases de yoga',
            slug: 'clases-yoga',
            description: 'Relajación y ejercicios.',
            imageUrl: null,
          },
          {
            id: 93,
            name: 'Piscinas',
            slug: 'piscinas',
            description: 'Natación y recreación acuática.',
            imageUrl: null,
          },
          {
            id: 94,
            name: 'Canchas deportivas',
            slug: 'canchas-deportivas',
            description: 'Alquiler de canchas para deportes.',
            imageUrl: null,
          },
          {
            id: 95,
            name: 'Clases de danza',
            slug: 'clases-danza',
            description: 'Danza y coreografía.',
            imageUrl: null,
          },
          {
            id: 96,
            name: 'Clubes deportivos',
            slug: 'clubes-deportivos',
            description: 'Asociaciones y ligas deportivas.',
            imageUrl: null,
          },
          {
            id: 97,
            name: 'Ciclismo',
            slug: 'ciclismo',
            description: 'Rutas y entrenamiento de ciclismo.',
            imageUrl: null,
          },
          {
            id: 98,
            name: 'Running y maratones',
            slug: 'running-maratones',
            description: 'Carreras y entrenamiento.',
            imageUrl: null,
          },
          {
            id: 99,
            name: 'Surf y deportes acuáticos',
            slug: 'surf-deportes-acuaticos',
            description: 'Clases y alquiler de equipo.',
            imageUrl: null,
          },
          {
            id: 100,
            name: 'Escalada y aventura',
            slug: 'escalada-aventura',
            description: 'Actividades de montaña y aventura.',
            imageUrl: null,
          },
        ],
      },
    ];

    const results = [];

    for (const categoria of categorias) {
      const createdCategoria = await this.prisma.category.create({
        data: {
          name: categoria.name,
          slug: categoria.slug,
          description: categoria.description,
          parentId: categoria.parentId,
          imageUrl: categoria.imageUrl,
          services: {
            create: categoria.services.map((service) => ({
              name: service.name,
              slug: service.slug,
              description: service.description,
              imageUrl: service.imageUrl,
            })),
          },
        },
        include: {
          services: true,
        },
      });

      results.push(createdCategoria);
    }

    return 'seed completed';
  }
  @Get('files/:key')
  getFile(@Param('key') key: string, @Res() res: Response) {
    this.validateKey(key);

    const filePath = path.join(process.cwd(), 'certificates', key);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado.');
    }

    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');

    res.setHeader('Content-Disposition', `inline; filename="${key}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Get('images/:key')
  getImage(@Param('key') key: string, @Res() res: Response) {
    this.validateKey(key);

    const imagePath = path.join(process.cwd(), 'images', key);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException('Imagen no encontrada.');
    }

    return res.sendFile(imagePath);
  }

  @Post('upload/certificate')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertificate(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten PDFs');
    }

    // ===============================
    // 1. Directorio seguro
    // ===============================
    const dir = path.join(process.cwd(), 'certificates');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // ===============================
    // 2. Nombre seguro (.pdf)
    // ===============================
    const key = `${randomUUID()}.pdf`;
    const filePath = path.join(dir, key);

    // ===============================
    // 3. Guardar PDF directamente
    // ===============================
    fs.writeFileSync(filePath, file.buffer);

    // ===============================
    // 4. Retornar la key
    // ===============================
    return { key };
  }

  @Post('/upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Solo se permiten imágenes'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    console.log(file);
    const ext = '.jpg'; // normalizamos
    const key = `${randomUUID()}${ext}`;

    const imagesDir = path.join(process.cwd(), 'images');
    const outputPath = path.join(imagesDir, key);

    // ✅ CREA LA CARPETA SI NO EXISTE
    await fsPromises.mkdir(imagesDir, { recursive: true });

    await sharp(file.buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({
        quality: 75,
        mozjpeg: true,
      })
      .toFile(outputPath);

    return { key };
  }
}
