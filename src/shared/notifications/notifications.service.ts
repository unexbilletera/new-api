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
import { renderCodeEmailTemplate } from './templates/code-template';
import { getEmailCopy } from './templates/email-translations';

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

  async sendEmailVerificationCode(email: string, code: string, expiresInMinutes = 5, language?: string) {
    const copy = getEmailCopy('userEmailVerification', language);
    const { html, text } = renderCodeEmailTemplate({
      code,
      message: `${copy.message} ${code}.`,
      actionText: '',
      actionUrl: '',
      logoUrl: process.env.WALLET_LOGO_IMAGE_ULR,
    });

    await this.sendEmail({
      to: email,
      subject: copy.subject,
      text,
      html,
    });
  }

  async sendPhoneVerificationCode(phone: string, code: string, expiresInMinutes = 5) {
    await this.sendSms({
      to: phone,
      message: `Codigo de verificacao: ${code}. Expira em ${expiresInMinutes} minutos.`,
    });
  }

  async sendPasswordRecovery(email: string, code: string, language?: string) {
    const copy = getEmailCopy('userForgot', language);
    const { html, text } = renderCodeEmailTemplate({
      code,
      message: `${copy.message} ${code}.`,
      actionText: '',
      actionUrl: '',
      logoUrl: process.env.WALLET_LOGO_IMAGE_ULR,
    });

    await this.sendEmail({
      to: email,
      subject: copy.subject,
      text,
      html,
    });
  }

  async sendUnlockAccount(email: string, code: string, language?: string) {
    const copy = getEmailCopy('userUnlock', language);
    const { html, text } = renderCodeEmailTemplate({
      code,
      message: `${copy.message} ${code}.`,
      actionText: '',
      actionUrl: '',
      logoUrl: process.env.WALLET_LOGO_IMAGE_ULR,
    });

    await this.sendEmail({
      to: email,
      subject: copy.subject,
      text,
      html,
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
