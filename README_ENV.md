# Sistema de Ambiente (Prod/Sandbox)

Este documento explica como usar o sistema de carregamento de variáveis de ambiente para rodar a aplicação em modo **prod** ou **sandbox**.

## 📋 Como Funciona

O sistema carrega automaticamente as variáveis de ambiente de arquivos específicos baseado na variável `NODE_ENV`:

- `NODE_ENV=sandbox` → carrega `env.sandbox`
- `NODE_ENV=production` → carrega `env.prod`
- **Sem `NODE_ENV` definido** → carrega `.env` (padrão para AWS/produção)
- `NODE_ENV=development` → carrega `.env`

## 🚀 Scripts Disponíveis

### Padrão (carrega .env - ideal para AWS/produção)

```bash
# Desenvolvimento simples (carrega .env)
yarn start
# ou
yarn start:api
```

### Sandbox

```bash
# Desenvolvimento com watch (sandbox)
yarn start:sandbox:dev

# Produção compilada (sandbox)
yarn start:sandbox:prod

# Desenvolvimento simples (sandbox)
yarn start:sandbox
```

### Produção

```bash
# Desenvolvimento com watch (prod)
yarn start:prod:dev

# Produção compilada (prod)
yarn start:prod:prod

# Desenvolvimento simples (prod)
yarn start:prod:env
```

## 🔧 Uso Manual

Você também pode definir manualmente qual arquivo carregar usando a variável `ENV_FILE`:

```bash
# Carregar arquivo específico
ENV_FILE=env.sandbox yarn start:api

# Ou definir NODE_ENV diretamente
NODE_ENV=sandbox yarn start:api
NODE_ENV=production yarn start:api
```

## 📝 Mapeamento de Variáveis

O sistema mapeia automaticamente variáveis `WALLET_*` para nomes padrão:

| WALLET_* | Padrão | Uso |
|----------|--------|-----|
| `WALLET_MYSQL_URL` | `WALLET_MYSQL_URL` | Prisma |
| `WALLET_TOKEN_SECRET` | `JWT_SECRET` | JWT |
| `WALLET_TOKEN_EXPIRE` | `JWT_EXPIRES_IN` | JWT (converte minutos para dias) |
| `WALLET_SERVER_PORT` | `PORT` | Servidor |
| `WALLET_REDIS_URL` | `REDIS_URL` | Redis |

## 🔍 Verificação

Ao iniciar a aplicação, você verá no console qual arquivo foi carregado:

```
✅ Environment file loaded: env.sandbox
✅ Environment file loaded: env.prod
```

E também verá o ambiente atual:

```
API running on http://0.0.0.0:3000
Environment: sandbox
```

## ⚙️ ConfigService

Use o `ConfigService` para acessar variáveis de ambiente de forma tipada:

```typescript
import { ConfigService } from './shared/config/config.service';

constructor(private configService: ConfigService) {
  const dbUrl = this.configService.databaseUrl;
  const isProd = this.configService.isProduction;
  const isSandbox = this.configService.isSandbox;
}
```

## 📌 Prioridade de Carregamento

1. **ENV_FILE** (variável explícita) - maior prioridade
2. **NODE_ENV=sandbox** → `env.sandbox`
3. **NODE_ENV=production** → `env.prod`
4. **Sem NODE_ENV ou NODE_ENV=development** → `.env` (padrão)
5. **Fallback** → Se arquivo específico não existir, tenta `.env`

## ⚠️ Importante

- Os arquivos `env.sandbox` e `env.prod` devem estar na raiz do projeto
- Variáveis já definidas no sistema não são sobrescritas
- O mapeamento de variáveis acontece automaticamente após carregar o arquivo

