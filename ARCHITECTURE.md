# Arquitetura do Backend - Nova API

## 📁 Estrutura de Pastas

```
src/
├── public/              # Área NÃO LOGADA (Dev 1)
│   ├── auth/           # Login, registro, recuperação de senha
│   ├── onboarding/     # Cadastro inicial, validações, KYC
│   └── users/          # Perfil público, validações de email/SMS
│
├── secure/              # Área LOGADA (Dev 2)
│   ├── transactions/   # Criar transações, histórico, status
│   ├── exchange/       # Conversões, cotações, múltiplas moedas
│   ├── ledger/         # Movimentações financeiras, saldos por moeda
│   ├── treasury/       # Gestão de saldos, reconciliação
│   └── notifications/  # Push notifications, emails, SMS
│
├── backoffice/          # Backoffice
│   └── auth/           # Login backoffice (exemplo completo)
│
├── webhooks/            # Receber eventos externos, salvar na fila
│
├── worker/              # Processar fila SQS, atualizar status
│
└── shared/              # Recursos compartilhados
    ├── prisma/         # Serviço Prisma (global)
    ├── guards/         # Guards de autenticação/autorização
    ├── decorators/     # Decorators customizados
    ├── helpers/        # Funções auxiliares
    ├── interceptors/   # Interceptors (logging, etc)
    └── filters/        # Filtros de exceção
```

## 🏗️ Padrão de Arquitetura (CSM)

Cada módulo segue o padrão **Controller → Service → Model**:

```
módulo/
├── controllers/    # Recebe requisições HTTP
├── services/       # Lógica de negócio
├── models/         # Acesso ao banco de dados (Prisma)
└── dto/           # Data Transfer Objects (validação)
```

### Fluxo de Dados

```
User Request
    ↓
Controller (valida DTO)
    ↓
Service (lógica de negócio)
    ↓
Model (acesso ao banco)
    ↓
Service (processa resultado)
    ↓
Controller (retorna resposta)
    ↓
User Response
```

## 📝 Exemplo Completo: Login Backoffice

O módulo `backoffice/auth` é um exemplo completo da arquitetura:

### Estrutura

```
backoffice/auth/
├── controllers/
│   └── auth.controller.ts    # Endpoints HTTP
├── services/
│   └── auth.service.ts       # Lógica de negócio
├── models/
│   └── backoffice-user.model.ts  # Acesso ao banco
├── dto/
│   ├── login.dto.ts          # Validação de entrada
│   └── login-response.dto.ts # Formato de resposta
└── auth.module.ts            # Módulo NestJS
```

### Endpoints

- `POST /backoffice/auth/login` - Login do backoffice
- `GET /backoffice/auth/me` - Dados do usuário logado (protegido)

### Como usar como exemplo

1. **DTO (Data Transfer Object)**: Define e valida dados de entrada
2. **Controller**: Recebe requisição, chama service, retorna resposta
3. **Service**: Contém a lógica de negócio
4. **Model**: Acessa o banco de dados via Prisma
5. **Module**: Registra tudo no NestJS

## 🔐 Autenticação

### Guards

- `JwtAuthGuard`: Para área logada (app)
- `BackofficeAuthGuard`: Para área backoffice

### Decorators

- `@CurrentUser()`: Obtém usuário logado da requisição

## 🛠️ Helpers Compartilhados

- `PasswordHelper`: Hash e comparação de senhas (bcrypt)
- `JwtHelper`: Geração e validação de tokens JWT (TODO)

## 📦 Dependências Necessárias

Para o exemplo funcionar completamente, instale:

```bash
npm install bcrypt class-validator class-transformer
npm install -D @types/bcrypt
```

## 🚀 Scripts Disponíveis

- `npm run start:dev` - API em modo desenvolvimento
- `npm run start:worker` - Worker em modo desenvolvimento
- `npm run build` - Build para produção
- `npm run start:prod:api` - API em produção
- `npm run start:prod:worker` - Worker em produção

## 📋 Próximos Passos

1. Implementar JWT helper completo
2. Adicionar validação JWT nos guards
3. Implementar módulos públicos (auth, onboarding, users)
4. Implementar módulos seguros (transactions, exchange, etc)
5. Configurar SQS para fila de mensagens
6. Implementar worker para processar fila

