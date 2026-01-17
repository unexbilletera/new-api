import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  PixKeyValidator,
  PixKeyType,
} from '../../../../../shared/validators/pix-key.validator';

@ValidatorConstraint({ name: 'isValidPixKeyFormat', async: false })
export class IsValidPixKeyFormatConstraint implements ValidatorConstraintInterface {
  validate(keyValue: any, args: ValidationArguments): boolean {
    const dto = args.object as any;
    const keyType = dto.targetKeyType as PixKeyType;

    if (!keyType || !keyValue) {
      return false;
    }

    return PixKeyValidator.validate(keyType, keyValue);
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as any;
    const keyType = dto.targetKeyType as PixKeyType;

    switch (keyType) {
      case PixKeyType.CPF:
        return 'targetKeyValue must be a valid CPF (11 digits with valid check digits)';
      case PixKeyType.CNPJ:
        return 'targetKeyValue must be a valid CNPJ (14 digits with valid check digits)';
      case PixKeyType.EMAIL:
        return 'targetKeyValue must be a valid email address';
      case PixKeyType.PHONE:
        return 'targetKeyValue must be a valid Brazilian phone number';
      case PixKeyType.EVP:
        return 'targetKeyValue must be a valid EVP (UUID format)';
      default:
        return 'targetKeyValue must be a valid PIX key';
    }
  }
}

/**
 * Valida se o valor da chave PIX está no formato correto para o tipo especificado
 * @param validationOptions - Opções de validação do class-validator
 */
export function IsValidPixKeyFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPixKeyFormatConstraint,
    });
  };
}
