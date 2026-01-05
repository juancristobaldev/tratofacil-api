import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    // Inicializa Resend con tu API Key (string)
    this.resend = new Resend('re_YAwF134w_6V4krtECneonqiHtepxHgo1i');
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    from: string = 'contacto@tratofacil.com',
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Error from Resend API:', error);
        throw new InternalServerErrorException('Resend API error');
      }

      return data;
    } catch (err) {
      console.error('Error sending email:', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
