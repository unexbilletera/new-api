// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt');

export class PasswordHelper {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hash de senha usando bcrypt
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compara senha com hash
   */
  static async compare(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

