export class EmailChangeRequestResponseDto {
  success: boolean;
  message: string;
  email: string;
  expiresIn: number;
  debug?: any;
}

export class EmailChangeConfirmResponseDto {
  success: boolean;
  message: string;
  email: string;
}
