# Backoffice Authentication Module

This module serves as a complete example of the CSM architecture (Controller → Service → Model).

## Structure

```
backoffice/auth/
├── controllers/
│   └── auth.controller.ts          # HTTP endpoints
├── services/
│   └── auth.service.ts              # Business logic
├── models/
│   └── backoffice-user.model.ts     # Database access (Prisma)
├── dto/
│   ├── login.dto.ts                 # Input validation
│   └── login-response.dto.ts        # Response format
└── auth.module.ts                   # NestJS module
```

## Data Flow

```
POST /backoffice/auth/login
    ↓
AuthController.login()
    ↓ (validates LoginDto)
AuthService.login()
    ↓
BackofficeUserModel.validateCredentials()
    ↓ (accesses Prisma)
Prisma → MySQL
    ↓ (returns data)
BackofficeUserModel (processes)
    ↓
AuthService (generates token)
    ↓
AuthController (returns LoginResponseDto)
    ↓
Response JSON
```

## Components

### DTO (Data Transfer Object)

**`dto/login.dto.ts`**

- Defines input structure
- Validates with `class-validator`
- Custom error messages

**`dto/login-response.dto.ts`**

- Defines response structure
- Ensures API consistency

### Controller

**`controllers/auth.controller.ts`**

- Receives HTTP requests
- Validates DTO automatically (via `ValidationPipe`)
- Calls Service
- Returns typed response

### Service

**`services/auth.service.ts`**

- Contains business logic
- Orchestrates Model calls
- Handles business errors

### Model

**`models/backoffice-user.model.ts`**

- Accesses database via Prisma
- Model-specific methods
- Data validations

### Module

**`auth.module.ts`**

- Registers Controller, Service and Model
- Imports dependencies (PrismaModule)
- Exports what is necessary

## Endpoints

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

**Errors:**

- `400`: Invalid data (validation)
- `401`: Invalid email or password
- `401`: User inactive

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

## Security

- Passwords hashed with bcrypt
- User status validation (active/inactive)
- Guard protects sensitive endpoints
- JWT token generation

## Using as Example

1. Copy folder structure to your new module
2. Adapt names (auth → your-module)
3. Follow same pattern:
   - DTO for validation
   - Controller for HTTP
   - Service for logic
   - Model for database
4. Register in corresponding module
