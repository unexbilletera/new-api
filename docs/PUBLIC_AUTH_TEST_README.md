# Temporary Test Authentication Endpoints

WARNING: These endpoints are TEMPORARY and must be REMOVED IN PRODUCTION.

They were created only to facilitate testing during development, allowing real login with password validation to obtain JWT tokens.

## Available Endpoints

### 1. Temporary Login (App/Users)

**POST** `/test/auth/login`

Temporary login for app users (customers).

**Body (required):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha-do-usuario"
}
```

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "status": "active",
    "identity": { ... }
  },
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/test/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### 2. Temporary Login (Backoffice)

**POST** `/test/auth/backoffice-login`

Temporary login for backoffice users.

**Body (required):**
```json
{
  "email": "admin@exemplo.com",
  "password": "senha-do-admin"
}
```

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@exemplo.com",
    "name": "Nome do Admin",
    "status": "active",
    "role": {
      "id": "uuid",
      "name": "Administrator",
      "level": 3
    }
  },
  "message": "200 backoffice.success.login",
  "code": "200 backoffice.success.login"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/test/auth/backoffice-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "senha123"
  }'
```

## Using the Token

After obtaining the token, use it in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/backoffice/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Important Notes

1. Validates credentials: These endpoints validate email and password before generating token
2. Development only: WARNING: NEVER leave these endpoints in production
3. Valid token: Generated token is a valid JWT and can be used in any protected endpoint
4. Required fields: Email and password are required
5. Updates last login: User's last login is updated after successful login

## Removing in Production

To remove these temporary endpoints:

1. Remove file: `src/public/auth/controllers/test-auth.controller.ts`
2. Remove from module: `src/public/auth/auth.module.ts`
   - Remove `TestAuthController` from `controllers` array
   - Remove `TestAuthController` import

## Security

- Tokens generated are valid JWTs
- Tokens follow same pattern as real tokens
- Validates password using bcrypt
- Checks if user is active (backoffice)
- Updates last login after successful authentication
- Should NOT be in production (temporary endpoints)
