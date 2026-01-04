// src/wordpress/wordpress.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

@Controller('wordpress')
export class WordpressController {
  private readonly WP_URL = process.env.WORDPRESS_URL!;
  private readonly WP_USER = process.env.WP_ADMIN_USER!;
  private readonly WP_PASSWORD = process.env.WP_ADMIN_PASSWORD!;

  /**
   * Recibe userId y fileBase64 (base64 completo de la imagen)
   */
  @Post('upload-avatar')
  async uploadAvatar(
    @Body('userId') userId: string,
    @Body('fileBase64') fileBase64: string, // ej: data:image/png;base64,iVBORw0...
    @Body('fileName') fileName: string = 'avatar.png',
  ) {
    if (!userId) throw new BadRequestException('userId es obligatorio');
    if (!fileBase64)
      throw new BadRequestException('Archivo base64 es obligatorio');

    // Guardar temporalmente
    const matches = fileBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new BadRequestException('Base64 inválido');

    const ext = matches[1].split('/')[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const tempPath = path.join(process.cwd(), `${fileName}.${ext}`);
    fs.writeFileSync(tempPath, buffer);

    // Subir a WordPress como Media
    const mediaForm = new FormData();
    mediaForm.append('file', fs.createReadStream(tempPath), {
      filename: `${fileName}.${ext}`,
    });

    const mediaResponse = await axios.post(
      `${this.WP_URL}/wp-json/wp/v2/media`,
      mediaForm,
      {
        headers: {
          ...mediaForm.getHeaders(),
          Authorization: `Basic ${Buffer.from(
            `${this.WP_USER}:${this.WP_PASSWORD}`,
          ).toString('base64')}`,
        },
      },
    );

    const mediaUrl = mediaResponse.data.source_url;
    const mediaId = mediaResponse.data.id;

    // Actualizar usuario
    const userResponse = await axios.post(
      `${this.WP_URL}/wp-json/wp/v2/users/${userId}`,
      { meta: { logo_url: mediaUrl } },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.WP_USER}:${this.WP_PASSWORD}`,
          ).toString('base64')}`,
        },
      },
    );

    // Eliminar temporal
    fs.unlinkSync(tempPath);

    return {
      message: 'Avatar actualizado correctamente',
      user: userResponse.data,
      media: { id: mediaId, url: mediaUrl },
    };
  }
}
