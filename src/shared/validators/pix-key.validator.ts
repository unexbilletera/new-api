/**
 * Validador de chaves PIX
 * Implementa validações de formato e dígitos verificadores para cada tipo de chave
 */

export enum PixKeyType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
  EMAIL = 'email',
  PHONE = 'phone',
  EVP = 'evp',
}

export class PixKeyValidator {
  /**
   * Valida CPF (11 dígitos com dígitos verificadores)
   * @param cpf - CPF a ser validado (pode conter ou não formatação)
   * @returns true se válido, false caso contrário
   */
  static validateCPF(cpf: string): boolean {
    if (!cpf || typeof cpf !== 'string') {
      return false;
    }

    // Remove formatação
    const cleanCpf = cpf.replace(/\D/g, '');

    // Deve ter exatamente 11 dígitos
    if (cleanCpf.length !== 11) {
      return false;
    }

    // Rejeita CPFs com todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    // Valida dígitos verificadores
    let sum = 0;
    let remainder: number;

    // Valida primeiro dígito verificador
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

    // Valida segundo dígito verificador
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

  /**
   * Valida CNPJ (14 dígitos com dígitos verificadores)
   * @param cnpj - CNPJ a ser validado (pode conter ou não formatação)
   * @returns true se válido, false caso contrário
   */
  static validateCNPJ(cnpj: string): boolean {
    if (!cnpj || typeof cnpj !== 'string') {
      return false;
    }

    // Remove formatação
    const cleanCnpj = cnpj.replace(/\D/g, '');

    // Deve ter exatamente 14 dígitos
    if (cleanCnpj.length !== 14) {
      return false;
    }

    // Rejeita CNPJs com todos os dígitos iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) {
      return false;
    }

    // Valida dígitos verificadores
    let length = cleanCnpj.length - 2;
    let numbers = cleanCnpj.substring(0, length);
    const digits = cleanCnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    // Valida primeiro dígito verificador
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i), 10) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) {
      return false;
    }

    // Valida segundo dígito verificador
    length = length + 1;
    numbers = cleanCnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i), 10) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1), 10)) {
      return false;
    }

    return true;
  }

  /**
   * Valida email
   * @param email - Email a ser validado
   * @returns true se válido, false caso contrário
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const trimmedEmail = email.trim();

    // Regex básico para email (conforme RFC 5322 simplificado)
    // Aceita emails como: user@domain.com, user.name@domain.co.uk
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Tamanho máximo conforme padrão PIX (77 caracteres)
    if (trimmedEmail.length > 77) {
      return false;
    }

    return emailRegex.test(trimmedEmail);
  }

  /**
   * Valida telefone brasileiro
   * Aceita formatos: +55XXYYYYYYYYY, 55XXYYYYYYYYY, XXYYYYYYYYY
   * @param phone - Telefone a ser validado
   * @returns true se válido, false caso contrário
   */
  static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // Remove espaços e caracteres especiais (exceto +)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Padrões aceitos:
    // +5511999999999 (com +55 e DDD)
    // 5511999999999 (com 55 e DDD)
    // 11999999999 (apenas DDD e número)

    let phoneNumber: string;
    let ddd: string;

    if (cleanPhone.startsWith('+55')) {
      // Formato: +55XXYYYYYYYYY
      phoneNumber = cleanPhone.substring(3);
      if (phoneNumber.length < 10 || phoneNumber.length > 11) {
        return false;
      }
      ddd = phoneNumber.substring(0, 2);
    } else if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      // Formato: 55XXYYYYYYYYY
      phoneNumber = cleanPhone.substring(2);
      if (phoneNumber.length < 10 || phoneNumber.length > 11) {
        return false;
      }
      ddd = phoneNumber.substring(0, 2);
    } else {
      // Formato: XXYYYYYYYYY (sem código do país)
      phoneNumber = cleanPhone;
      if (phoneNumber.length < 10 || phoneNumber.length > 11) {
        return false;
      }
      ddd = phoneNumber.substring(0, 2);
    }

    // Valida DDD (11-99, exceto alguns inválidos)
    const dddNum = parseInt(ddd, 10);
    if (dddNum < 11 || dddNum > 99) {
      return false;
    }

    // DDDs inválidos (não existem)
    const invalidDDDs = [20, 23, 25, 26, 29, 36, 39, 40, 50, 52, 56, 57, 58, 59, 60, 70, 72, 76, 78, 80, 90];
    if (invalidDDDs.includes(dddNum)) {
      return false;
    }

    // Valida se o número é apenas dígitos
    if (!/^\d+$/.test(phoneNumber)) {
      return false;
    }

    return true;
  }

  /**
   * Valida EVP (Endereço Virtual de Pagamento)
   * Formato UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   * @param evp - EVP a ser validado
   * @returns true se válido, false caso contrário
   */
  static validateEVP(evp: string): boolean {
    if (!evp || typeof evp !== 'string') {
      return false;
    }

    const trimmedEvp = evp.trim();

    // Formato UUID: 8-4-4-4-12 caracteres hexadecimais
    const evpRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return evpRegex.test(trimmedEvp);
  }

  /**
   * Valida chave PIX baseada no tipo
   * @param keyType - Tipo da chave PIX
   * @param keyValue - Valor da chave PIX
   * @returns true se válido, false caso contrário
   */
  static validate(keyType: PixKeyType, keyValue: string): boolean {
    if (!keyValue || typeof keyValue !== 'string') {
      return false;
    }

    switch (keyType) {
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
}
