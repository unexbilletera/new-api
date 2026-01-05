# Instalação de Dependências

## ⚠️ Erros de Compilação

Se você está vendo erros como:
- `Cannot find module 'class-validator'`
- `Cannot find module '@nestjs/jwt'`
- `Cannot find module 'bcrypt'`

Isso significa que as dependências não foram instaladas ainda.

## 📦 Instalar Dependências

Execute no diretório `new-api`:

```bash
# Usando yarn (recomendado)
yarn install

# Ou usando npm
npm install
```

## ✅ Dependências que serão instaladas

As seguintes dependências foram adicionadas ao `package.json`:

**Produção:**
- `@nestjs/jwt` - Módulo JWT do NestJS
- `class-validator` - Validação de DTOs
- `class-transformer` - Transformação de objetos
- `bcrypt` - Hash de senhas

**Desenvolvimento:**
- `@types/bcrypt` - Tipos TypeScript para bcrypt

## 🔧 Após Instalação

Após instalar as dependências, execute:

```bash
# Gerar Prisma Client
yarn prisma:generate

# Iniciar em desenvolvimento
yarn start:dev
```

## 🐛 Se ainda houver erros

1. Verifique se o `node_modules` foi criado
2. Verifique se o `package.json` está correto
3. Tente deletar `node_modules` e `yarn.lock` e reinstalar:
   ```bash
   rm -rf node_modules yarn.lock
   yarn install
   ```

