export enum PixKeyType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
  EMAIL = 'email',
  PHONE = 'phone',
  EVP = 'evp',
}

export class PixKeyValidator {
  static validateCPF(cpf: string): boolean {
    if (!cpf || typeof cpf !== 'string') {
      return false;
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    let sum = 0;
    let remainder: number;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanCpf.substring(9, 10), 10)) {
      return false;
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanCpf.substring(10, 11), 10)) {
      return false;
    }

    return true;
  }

  static validateCNPJ(cnpj: string): boolean {
    if (!cnpj || typeof cnpj !== 'string') {
      return false;
    }

    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      return false;
    }

    if (/^(\d)\1{13}$/.test(cleanCnpj)) {
      return false;
    }

    let length = cleanCnpj.length - 2;
    let numbers = cleanCnpj.substring(0, length);
    const digits = cleanCnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) {
      return false;
    }

    length = length + 1;
    numbers = cleanCnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1), 10)) {
      return false;
    }

    return true;
  }

  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    if (email.length > 77) {
      return false;
    }

    return true;
  }

  static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.startsWith('55')) {
      const phoneWithoutCountry = cleanPhone.substring(2);
      if (phoneWithoutCountry.length !== 10 && phoneWithoutCountry.length !== 11) {
        return false;
      }
    } else {
      if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
        return false;
      }
    }

    const phoneRegex = /^\+?55?\d{10,11}$/;
    return phoneRegex.test(cleanPhone) || /^\d{10,11}$/.test(cleanPhone);
  }

  static validateEVP(evp: string): boolean {
    if (!evp || typeof evp !== 'string') {
      return false;
    }

    const evpRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return evpRegex.test(evp);
  }

  static validate(keyType: PixKeyType | string, keyValue: string): boolean {
    const type = (typeof keyType === 'string' ? keyType : keyType).toLowerCase() as PixKeyType;

    switch (type) {
      case PixKeyType.CPF:
        return this.validateCPF(keyValue);
      case PixKeyType.CNPJ:
        return this.validateCNPJ(keyValue);
      case PixKeyType.EMAIL:
        return this.validateEmail(keyValue);
      case PixKeyType.PHONE:
        return this.validatePhone(keyValue);
      case PixKeyType.EVP:
        return this.validateEVP(keyValue);
      default:
        return false;
    }
  }

  static getKeyTypeFromValue(value: string): PixKeyType | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    if (this.validateCPF(value)) return PixKeyType.CPF;
    if (this.validateCNPJ(value)) return PixKeyType.CNPJ;
    if (this.validateEmail(value)) return PixKeyType.EMAIL;
    if (this.validatePhone(value)) return PixKeyType.PHONE;
    if (this.validateEVP(value)) return PixKeyType.EVP;

    return null;
  }

  static formatCPF(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  static formatCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  static formatPhone(phone: string): string {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3');
    }
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '+55 ($1) $2-$3');
  }
}
