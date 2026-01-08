# Instalação e Configuração

## 📦 Dependências Necessárias

Para que o projeto funcione completamente, instale as seguintes dependências:

```bash
# Dependências de produção
npm install bcrypt class-validator class-transformer @nestjs/jwt

# Dependências de desenvolvimento
npm install -D @types/bcrypt
```

## 🔧 Configuração Inicial

1. **Instalar dependências base:**
   ```bash
   npm install
   ```

2. **Gerar Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

3. **Configurar variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com:
   ```
   WALLET_MYSQL_URL="mysql://user:password@host:port/database"
   JWT_SECRET="seu-secret-jwt-aqui"
   NODE_ENV="development"
   ```

## 🚀 Executar o Projeto

### Desenvolvimento

```bash
# API
npm run start:dev

# Worker (em outro terminal)
npm run start:worker
```

### Produção

```bash
# Build
npm run build

# API
npm run start:prod:api

# Worker
npm run start:prod:worker
```

## 📝 Próximos Passos

1. ✅ JWT implementado e funcional
2. Configurar variáveis de ambiente (JWT_SECRET, JWT_EXPIRES_IN)
3. Configurar SQS para fila de mensagens
4. Implementar os demais módulos seguindo o exemplo do `backoffice/auth`

