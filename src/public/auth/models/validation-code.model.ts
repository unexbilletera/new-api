import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ValidationCodeModel {
  constructor(private prisma: PrismaService) {}

  // READ - Get validated email code
  async getValidatedEmailCode(email: string) {
    return this.prisma.email_validation_codes.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        verified: true,
        expiresAt: { gt: new Date() },
      },
    });
  }

  // READ - Get validated phone code
  async getValidatedPhoneCode(phone: string) {
    return this.prisma.phone_validation_codes.findFirst({
      where: {
        phone: phone.replace(/\D/g, ''),
        verified: true,
        expiresAt: { gt: new Date() },
      },
    });
  }

  // DELETE - Clean up validation codes after signup
  async deleteEmailValidationCodes(email: string) {
    return this.prisma.email_validation_codes.deleteMany({
      where: { email: email.toLowerCase().trim() },
    });
  }

  // DELETE - Clean up phone validation codes after signup
  async deletePhoneValidationCodes(phone: string) {
    return this.prisma.phone_validation_codes.deleteMany({
      where: { phone: phone.replace(/\D/g, '') },
    });
  }
}
