import { Inject, Injectable } from '@nestjs/common';
import {
  EMAIL_ADAPTER,
  PUSH_ADAPTER,
  SMS_ADAPTER,
  EmailAdapter,
  EmailMessage,
  PushAdapter,
  PushMessage,
  SmsAdapter,
  SmsMessage,
} from './notifications.types';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(EMAIL_ADAPTER) private readonly emailAdapter: EmailAdapter,
    @Inject(SMS_ADAPTER) private readonly smsAdapter: SmsAdapter,
    @Inject(PUSH_ADAPTER) private readonly pushAdapter: PushAdapter,
  ) {}

  async sendEmail(message: EmailMessage) {
    await this.emailAdapter.send(message);
  }

  async sendSms(message: SmsMessage) {
    await this.smsAdapter.send(message);
  }

  async sendPush(message: PushMessage) {
    await this.pushAdapter.send(message);
  }

  async sendEmailVerificationCode(email: string, code: string, expiresInMinutes = 5) {
    await this.sendEmail({
      to: email,
      subject: 'Código de verificação',
      text: `Seu código de verificação é ${code}. Ele expira em ${expiresInMinutes} minutos.`,
      html: `<p>Use o código abaixo para validar seu email:</p><p><strong>${code}</strong></p><p>Ele expira em ${expiresInMinutes} minutos.</p>`,
    });
  }

  async sendPhoneVerificationCode(phone: string, code: string, expiresInMinutes = 5) {
    await this.sendSms({
      to: phone,
      message: `Codigo de verificacao: ${code}. Expira em ${expiresInMinutes} minutos.`,
    });
  }

  async sendPasswordRecovery(email: string, code: string) {
    await this.sendEmail({
      to: email,
      subject: 'Recuperação de senha',
      text: `Use o código ${code} para recuperar sua senha.`,
      html: `<p>Use o código abaixo para recuperar sua senha:</p><p><strong>${code}</strong></p>`,
    });
  }

  async sendUnlockAccount(email: string, code: string) {
    await this.sendEmail({
      to: email,
      subject: 'Account Unlock',
      text: `Use code ${code} to unlock your account.`,
      html: `<p>Use the code below to unlock your account:</p><p><strong>${code}</strong></p>`,
    });
  }

  async sendSigninAlert(email: string, ip?: string) {
    const details = ip ? `IP: ${ip}` : 'Access performed.';
    await this.sendEmail({
      to: email,
      subject: 'New Access',
      text: `We detected a new access. ${details}`,
      html: `<p>We detected a new access to your account.</p><p>${details}</p>`,
    });
  }
}
