import * as bcrypt from 'bcrypt';

export class PasswordHelper {
  private static readonly SALT_ROUNDS = 10;

  static async hash(password: string): Promise<string> {
    if (!password) {
      throw new Error('Password cannot be empty');
    }
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
}

