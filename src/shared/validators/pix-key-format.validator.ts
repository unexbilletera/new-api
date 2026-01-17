import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { PixKeyValidator, PixKeyType } from './pix-key.validator';

@ValidatorConstraint({ name: 'isValidPixKeyFormat', async: false })
export class IsValidPixKeyFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(keyValue: unknown, args: ValidationArguments): boolean {
    const dto = args.object as Record<string, unknown>;
    const keyType = dto.targetKeyType as PixKeyType;

    if (!keyType || !keyValue || typeof keyValue !== 'string') {
      return false;
    }

    return PixKeyValidator.validate(keyType, keyValue);
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as Record<string, unknown>;
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
