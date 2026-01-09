import { Injectable } from '@nestjs/common';

export interface Pdf417Data {
  documentNumber: string | null;
  lastName: string | null;
  firstName: string | null;
  gender: string | null;
  birthDate: string | null;
  tramiteId: string | null;
  rawData: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class Pdf417ParserService {
  parsePDF417(pdf417Data: string): Promise<Pdf417Data> {
    return new Promise((resolve, reject) => {
      try {
        const data = pdf417Data.trim();

        const documentNumberMatch = data.match(/@AN:(\d+)/);
        const lastNameMatch = data.match(/@AP:([^@]+)/);
        const firstNameMatch = data.match(/@NO:([^@]+)/);
        const genderMatch = data.match(/@SE:([MF])/);
        const birthDateMatch = data.match(/@FN:(\d{8})/);
        const tramiteIdMatch = data.match(/@ID:(\d+)/);

        let birthDate: string | null = null;
        if (birthDateMatch) {
          const date = birthDateMatch[1];
          birthDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
        }

        const result: Pdf417Data = {
          documentNumber: documentNumberMatch ? documentNumberMatch[1] : null,
          lastName: lastNameMatch ? lastNameMatch[1].trim() : null,
          firstName: firstNameMatch ? firstNameMatch[1].trim() : null,
          gender: genderMatch ? genderMatch[1] : null,
          birthDate,
          tramiteId: tramiteIdMatch ? tramiteIdMatch[1] : null,
          rawData: data,
        };

        if (!result.documentNumber || !result.gender || !result.tramiteId) {
          throw new Error('Required data not found in PDF417');
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  validateDocumentNumber(documentNumber: string): boolean {
    const documentNumberRegex = /^\d{7,8}$/;
    return documentNumberRegex.test(documentNumber);
  }

  validateGender(gender: string): boolean {
    return gender === 'M' || gender === 'F';
  }

  validateDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const dateObj = new Date(date);
    const now = new Date();

    return dateObj instanceof Date && !isNaN(dateObj.getTime()) && dateObj <= now;
  }

  validateData(data: Pdf417Data): ValidationResult {
    const errors: string[] = [];

    if (!data.documentNumber || !this.validateDocumentNumber(data.documentNumber)) {
      errors.push('Invalid document number');
    }

    if (!data.gender || !this.validateGender(data.gender)) {
      errors.push('Invalid gender');
    }

    if (!data.tramiteId) {
      errors.push('Tramite ID not found');
    }

    if (data.birthDate && !this.validateDateFormat(data.birthDate)) {
      errors.push('Invalid birth date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
