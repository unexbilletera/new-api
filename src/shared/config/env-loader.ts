import * as fs from 'fs';
import * as path from 'path';

/**
 * Carrega variáveis de ambiente de arquivos específicos (env.prod ou env.sandbox)
 *
 * Prioridade:
 * 1. ENV_FILE (variável de ambiente explícita, ex: ENV_FILE=env.sandbox)
 * 2. NODE_ENV=sandbox -> env.sandbox
 * 3. NODE_ENV=production -> env.prod
 * 4. Fallback para .env se existir
 *
 * Também mapeia variáveis WALLET_* para nomes padrão:
 * - WALLET_TOKEN_SECRET -> JWT_SECRET
 * - WALLET_TOKEN_EXPIRE -> JWT_EXPIRES_IN
 * - WALLET_SERVER_PORT -> PORT
 * - WALLET_REDIS_URL -> REDIS_URL
 *
 * Nota: WALLET_MYSQL_URL é usado diretamente pelo Prisma (não precisa mapear)
 */
export function loadEnvironmentFile(): void {
  const rootPath = process.cwd();
  let envFilePath: string | null = null;

  // Prioridade 1: Variável de ambiente explícita ENV_FILE
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

  // Prioridade 2: Auto-detectar baseado em NODE_ENV
  let envFileName: string | null = null;

  if (process.env.NODE_ENV === 'sandbox') {
    envFileName = 'env.sandbox';
  } else if (process.env.NODE_ENV === 'production') {
    envFileName = 'env.prod';
  }

  // Se NODE_ENV não está definido ou é diferente de sandbox/production, usa .env
  if (!envFileName) {
    envFileName = '.env';
    console.warn(
      `⚠️  NODE_ENV não está definido ou não é 'production'/'sandbox'. Tentando carregar: ${envFileName}`,
    );
  }

  envFilePath = path.join(rootPath, envFileName);

  // Verifica se o arquivo existe
  if (fs.existsSync(envFilePath)) {
    loadDotEnvFile(envFilePath);
    console.log(
      `✅ Environment file loaded: ${envFileName} (NODE_ENV=${process.env.NODE_ENV || 'not set'})`,
    );
    return;
  }

  // Prioridade 3: Fallback para .env se estava tentando outro arquivo
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

/**
 * Carrega um arquivo .env manualmente (formato key=value)
 */
function loadDotEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Ignora linhas vazias e comentários
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse key=value
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();

      // Remove aspas se existirem
      const cleanValue = value.replace(/^["']|["']$/g, '');

      // Quando carregando env.prod ou env.sandbox, sempre sobrescreve (força valores do arquivo)
      // Isso garante que o arquivo correto tenha prioridade
      const isEnvFile =
        filePath.includes('env.prod') || filePath.includes('env.sandbox');
      if (isEnvFile || !process.env[key]) {
        process.env[key] = cleanValue;
      }
    }

    // Mapeia variáveis WALLET_* para nomes padrão
    mapWalletVariables();
  } catch (error) {
    console.error(`❌ Error loading environment file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Mapeia variáveis WALLET_* para nomes padrão usados pela aplicação
 */
function mapWalletVariables(): void {
  // WALLET_MYSQL_URL -> DATABASE_URL (para Prisma)
  // Prisma usa DATABASE_URL por padrão, então mapeamos WALLET_MYSQL_URL para DATABASE_URL
  if (process.env.WALLET_MYSQL_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.WALLET_MYSQL_URL;
  }

  // WALLET_TOKEN_SECRET -> JWT_SECRET
  if (process.env.WALLET_TOKEN_SECRET && !process.env.JWT_SECRET) {
    process.env.JWT_SECRET = process.env.WALLET_TOKEN_SECRET;
  }

  // WALLET_TOKEN_EXPIRE -> JWT_EXPIRES_IN (converte de minutos para formato JWT)
  if (process.env.WALLET_TOKEN_EXPIRE && !process.env.JWT_EXPIRES_IN) {
    const minutes = parseInt(process.env.WALLET_TOKEN_EXPIRE, 10);
    if (!isNaN(minutes)) {
      // Converte minutos para formato JWT (ex: 144000 minutos = 100 dias = "100d")
      const days = Math.floor(minutes / 1440);
      process.env.JWT_EXPIRES_IN = `${days}d`;
    }
  }

  // WALLET_SERVER_PORT -> PORT
  if (process.env.WALLET_SERVER_PORT && !process.env.PORT) {
    process.env.PORT = process.env.WALLET_SERVER_PORT;
  }

  // WALLET_REDIS_URL -> REDIS_URL
  if (process.env.WALLET_REDIS_URL && !process.env.REDIS_URL) {
    process.env.REDIS_URL = process.env.WALLET_REDIS_URL;
  }
}
