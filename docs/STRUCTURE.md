# Estrutura do Projeto - Nova API

## 📂 Árvore de Diretórios Completa

```
src/
├── app.controller.ts
├── app.controller.spec.ts
├── app.module.ts          # Módulo principal (importa todos os módulos)
├── app.service.ts
├── main.ts                # Bootstrap da aplicação
│
├── public/                # 🔓 ÁREA NÃO LOGADA (Dev 1)
│   ├── auth/
│   │   └── auth.module.ts
│   ├── onboarding/
│   │   └── onboarding.module.ts
│   └── users/
│       └── users.module.ts
│
├── secure/                # 🔒 ÁREA LOGADA (Dev 2)
│   ├── transactions/
│   │   └── transactions.module.ts
│   ├── exchange/
│   │   └── exchange.module.ts
│   ├── ledger/
│   │   └── ledger.module.ts
│   ├── treasury/
│   │   └── treasury.module.ts
│   └── notifications/
│       └── notifications.module.ts
│
├── backoffice/            # 👔 BACKOFFICE
│   └── auth/
│       ├── auth.module.ts
│       ├── controllers/
│       │   └── auth.controller.ts      # ✅ Exemplo completo
│       ├── services/
│       │   └── auth.service.ts         # ✅ Exemplo completo
│       ├── models/
│       │   └── backoffice-user.model.ts # ✅ Exemplo completo
│       ├── dto/
│       │   ├── login.dto.ts            # ✅ Exemplo completo
│       │   └── login-response.dto.ts   # ✅ Exemplo completo
│       └── README.md                   # Documentação do exemplo
│
├── webhooks/              # 📡 WEBHOOKS
│   └── webhooks.module.ts
│
├── worker/                # ⚙️ WORKER
│   ├── worker.module.ts
│   └── worker.ts          # Entry point do worker
│
└── shared/                # 🔧 RECURSOS COMPARTILHADOS
    ├── prisma/
    │   ├── prisma.module.ts    # Módulo global
    │   └── prisma.service.ts   # Serviço Prisma
    ├── guards/
    │   ├── jwt-auth.guard.ts           # Guard para área logada
    │   └── backoffice-auth.guard.ts   # Guard para backoffice
    ├── decorators/
    │   └── current-user.decorator.ts   # @CurrentUser()
    ├── helpers/
    │   ├── password.helper.ts          # Hash/comparação de senhas
    │   └── jwt.helper.ts                # JWT (TODO)
    ├── interceptors/
    │   └── logging.interceptor.ts      # Log de requisições
    └── filters/
        └── http-exception.filter.ts    # Tratamento de erros
```

## 🎯 Módulo Exemplo Completo

O módulo `backoffice/auth` está **100% implementado** como exemplo:

### ✅ O que está implementado:

1. **DTOs** com validação (`class-validator`)
2. **Controller** com endpoints HTTP
3. **Service** com lógica de negócio
4. **Model** com acesso ao banco (Prisma)
5. **Module** configurado
6. **Guards** para proteção
7. **Helpers** para senha

### 📋 Endpoints Disponíveis:

- `POST /backoffice/auth/login` - Login
- `GET /backoffice/auth/me` - Dados do usuário (protegido)

## 🚀 Como Começar

1. **Instalar dependências:**
   ```bash
   npm install bcrypt class-validator class-transformer
   npm install -D @types/bcrypt
   ```

2. **Gerar Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

3. **Rodar em desenvolvimento:**
   ```bash
   npm run start:dev
   ```

4. **Testar endpoint:**
   ```bash
   curl -X POST http://localhost:3000/backoffice/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"senha123"}'
   ```

## 📚 Documentação

- `ARCHITECTURE.md` - Visão geral da arquitetura
- `INSTALL.md` - Instruções de instalação
- `src/backoffice/auth/README.md` - Documentação do exemplo

## 🔄 Próximos Passos

1. Implementar JWT helper completo
2. Desenvolver módulos públicos (auth, onboarding, users)
3. Desenvolver módulos seguros (transactions, exchange, etc)
4. Configurar SQS
5. Implementar worker completo

