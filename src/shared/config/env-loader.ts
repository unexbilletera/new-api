import * as fs from 'fs';
import * as path from 'path';

export function loadEnvironmentFile(): void {
  const rootPath = process.cwd();
  let envFilePath: string | null = null;

  if (process.env.ENV_FILE) {
    envFilePath = path.join(rootPath, process.env.ENV_FILE);
    if (fs.existsSync(envFilePath)) {
      loadDotEnvFile(envFilePath);
      console.log(
        `✅ Environment file loaded from ENV_FILE: ${process.env.ENV_FILE}`,
      );
      return;
    } else {
      console.warn(
        `⚠️  ENV_FILE specified but file not found: ${process.env.ENV_FILE}`,
      );
    }
  }

  let envFileName: string | null = null;

  if (process.env.NODE_ENV === 'sandbox') {
    envFileName = 'env.sandbox';
  } else if (process.env.NODE_ENV === 'production') {
    envFileName = 'env.prod';
  }

  if (!envFileName) {
    envFileName = '.env';
  }

  envFilePath = path.join(rootPath, envFileName);

  if (fs.existsSync(envFilePath)) {
    loadDotEnvFile(envFilePath);
    console.log(`✅ Environment file loaded: ${envFileName}`);
    return;
  }

  if (envFileName !== '.env') {
    const fallbackPath = path.join(rootPath, '.env');
    if (fs.existsSync(fallbackPath)) {
      loadDotEnvFile(fallbackPath);
      console.log(`✅ Environment file loaded (fallback): .env`);
      return;
    }
  }

  console.warn(`⚠️  No environment file found. Tried: ${envFileName}`);
}

function loadDotEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();

      const cleanValue = value.replace(/^["']|["']$/g, '');

      if (!process.env[key]) {
        process.env[key] = cleanValue;
      }
    }

    mapWalletVariables();
  } catch (error) {
    console.error(`❌ Error loading environment file ${filePath}:`, error);
    throw error;
  }
}

function mapWalletVariables(): void {
  if (process.env.WALLET_MYSQL_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.WALLET_MYSQL_URL;
  }

  if (process.env.WALLET_TOKEN_SECRET && !process.env.JWT_SECRET) {
    process.env.JWT_SECRET = process.env.WALLET_TOKEN_SECRET;
  }

  if (process.env.WALLET_TOKEN_EXPIRE && !process.env.JWT_EXPIRES_IN) {
    const minutes = parseInt(process.env.WALLET_TOKEN_EXPIRE, 10);
    if (!isNaN(minutes)) {
      const days = Math.floor(minutes / 1440);
      process.env.JWT_EXPIRES_IN = `${days}d`;
    }
  }

  if (process.env.WALLET_SERVER_PORT && !process.env.PORT) {
    process.env.PORT = process.env.WALLET_SERVER_PORT;
  }

  if (process.env.WALLET_REDIS_URL && !process.env.REDIS_URL) {
    process.env.REDIS_URL = process.env.WALLET_REDIS_URL;
  }
}
