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
    // 2. Nombre seguro
    // ===============================
    const key = `${randomUUID()}.pdf.gz`;
    const filePath = path.join(dir, key);

    // ===============================
    // 3. Comprimir y guardar
    // ===============================
    const compressed = zlib.gzipSync(file.buffer);

    fs.writeFileSync(filePath, compressed);

    // ===============================
    // 4. Retornar solo la key
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
