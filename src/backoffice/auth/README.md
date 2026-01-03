# Exemplo: Módulo de Autenticação Backoffice

Este módulo serve como **exemplo completo** da arquitetura CSM (Controller → Service → Model) para os desenvolvedores.

## 📁 Estrutura

```
backoffice/auth/
├── controllers/
│   └── auth.controller.ts          # Endpoints HTTP
├── services/
│   └── auth.service.ts              # Lógica de negócio
├── models/
│   └── backoffice-user.model.ts     # Acesso ao banco (Prisma)
├── dto/
│   ├── login.dto.ts                 # Validação de entrada
│   └── login-response.dto.ts        # Formato de resposta
├── auth.module.ts                   # Módulo NestJS
└── README.md                        # Este arquivo
```

## 🔄 Fluxo de Dados

```
POST /backoffice/auth/login
    ↓
AuthController.login()
    ↓ (valida LoginDto)
AuthService.login()
    ↓
BackofficeUserModel.validateCredentials()
    ↓ (acessa Prisma)
Prisma → MySQL
    ↓ (retorna dados)
BackofficeUserModel (processa)
    ↓
AuthService (gera token)
    ↓
AuthController (retorna LoginResponseDto)
    ↓
Response JSON
```

## 📝 Componentes

### 1. DTO (Data Transfer Object)

**`dto/login.dto.ts`**
- Define estrutura de entrada
- Valida com `class-validator`
- Mensagens de erro personalizadas

**`dto/login-response.dto.ts`**
- Define estrutura de resposta
- Garante consistência na API

### 2. Controller

**`controllers/auth.controller.ts`**
- Recebe requisições HTTP
- Valida DTO automaticamente (via `ValidationPipe`)
- Chama Service
- Retorna resposta tipada

### 3. Service

**`services/auth.service.ts`**
- Contém lógica de negócio
- Orquestra chamadas ao Model
- Trata erros de negócio

### 4. Model

**`models/backoffice-user.model.ts`**
- Acessa banco de dados via Prisma
- Métodos específicos do modelo
- Validações de dados

### 5. Module

**`auth.module.ts`**
- Registra Controller, Service e Model
- Importa dependências (PrismaModule)
- Exporta o que for necessário

## 🎯 Endpoints

### POST /backoffice/auth/login

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@example.com",
    "role": {
      "id": "uuid",
      "name": "admin",
      "level": 1
    }
  }
}
```

**Erros:**
- `400`: Dados inválidos (validação)
- `401`: Email ou senha inválidos
- `401`: Usuário inativo

### GET /backoffice/auth/me

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@example.com",
    ...
  }
}
```

## 🔐 Segurança

- Senhas são hasheadas com bcrypt
- Validação de status do usuário (ativo/inativo)
- Guard protege endpoints sensíveis
- TODO: Implementar JWT completo

## 📚 Como Usar como Exemplo

1. **Copie a estrutura de pastas** para seu novo módulo
2. **Adapte os nomes** (auth → seu-módulo)
3. **Siga o mesmo padrão**:
   - DTO para validação
   - Controller para HTTP
   - Service para lógica
   - Model para banco
4. **Registre no módulo** correspondente

## ⚠️ TODOs

- [ ] Implementar JWT helper completo
- [ ] Adicionar refresh token
- [ ] Implementar logout
- [ ] Adicionar rate limiting
- [ ] Adicionar logs de acesso

