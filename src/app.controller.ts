import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import * as zlib from 'zlib';

import { promisify } from 'util';
import { memoryStorage } from 'multer';

const gzip = promisify(zlib.gzip);

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/upload/certificate')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(
            new BadRequestException('Solo se permiten archivos PDF'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB input
      },
    }),
  )
  async uploadCertificate(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const key = `${randomUUID()}.pdf.gz`;
    const outputPath = path.join('certificates', key);

    const compressed = await gzip(file.buffer, { level: 9 });

    fs.writeFileSync(outputPath, compressed);

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
        fileSize: 10 * 1024 * 1024, // 10MB input
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const ext = '.jpg'; // normalizamos
    const key = `${randomUUID()}${ext}`;
    const outputPath = path.join('images', key);

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
