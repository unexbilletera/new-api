# Testing Public Auth Endpoints in Postman

This guide shows how to test temporary public authentication endpoints using Postman.

WARNING: These endpoints are for development/testing only. They should NOT be used in production!

## Prerequisites

1. **Base URL**: Configure the API base URL in Postman (e.g., `http://localhost:3000`)

## Available Endpoints

### 1. Test Login (App Mobile)

**POST** `/test/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha-do-usuario"
}
```

**Fields:**
- `email` (string, required): App user email
- `password` (string, required): App user password

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "status": "enable",
    "identity": {
      "id": "uuid-da-identidade",
      "number": 1234,
      "type": "personal",
      "status": "enable"
    }
  },
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

**Error Response (401):**
```json
{
  "error": "401 users.errors.invalidCredentials",
  "message": "401 users.errors.invalidCredentials",
  "code": 401
}
```

### 2. Test Login (Backoffice)

**POST** `/test/auth/backoffice-login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@exemplo.com",
  "password": "senha-do-admin"
}
```

**Fields:**
- `email` (string, required): Backoffice user email
- `password` (string, required): Backoffice user password

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "admin@exemplo.com",
    "name": "Admin",
    "status": "active",
    "role": {
      "id": "uuid-do-role",
      "name": "Administrator",
      "level": 1
    }
  },
  "message": "200 backoffice.success.login",
  "code": "200 backoffice.success.login"
}
```

**Error Response (401):**
```json
{
  "error": "401 backoffice.errors.invalidCredentials",
  "message": "401 backoffice.errors.invalidCredentials",
  "code": 401
}
```

## Complete Test Flow

### Step 1: App Mobile Login

1. Set method to **POST**
2. URL: `{{base_url}}/test/auth/login`
3. In **Headers** tab, add:
   - `Content-Type`: `application/json`
4. In **Body** tab, select **raw** and **JSON**, paste:
```json
{
  "email": "usuario@exemplo.com",
  "password": "sua-senha"
}
```
5. Click **Send**
6. Copy the `token` value from response

### Step 2: Use Token in Protected Endpoints

1. Use token obtained in Step 1
2. Set method according to endpoint (GET, POST, etc.)
3. URL: `{{base_url}}/endpoint-protegido`
4. In **Headers** tab, add:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
5. Click **Send**

## Postman Environment Variables

Configure these variables in Postman:

```
base_url: http://localhost:3000
app_token: {paste_app_token_here}
backoffice_token: {paste_backoffice_token_here}
```

Then use `{{base_url}}`, `{{app_token}}` and `{{backoffice_token}}` in your requests.

## Common Error Codes

### 401 Unauthorized
**Possible causes:**
- `401 users.errors.invalidCredentials`: Invalid credentials
- `401 users.errors.invalidPassword`: Invalid password
- `401 users.errors.userInactive`: User inactive
- `401 backoffice.errors.invalidCredentials`: Invalid backoffice credentials
- `401 backoffice.errors.userInactive`: Backoffice user inactive

**Solution**: Verify email and password are correct.

### 400 Bad Request
**Possible causes:**
- `400 users.errors.invalidEmail`: Invalid email
- `400 users.errors.invalidPassword`: Invalid password
- `400 backoffice.errors.invalidEmail`: Invalid backoffice email
- `400 backoffice.errors.invalidPassword`: Invalid backoffice password

**Solution**: Verify data sent in body.

## Important Notes

1. **FOR TESTING ONLY**: These endpoints are temporary and must be removed in production.

2. **Real Validation**: Endpoints perform real password validation using bcrypt, so you need real user passwords.

3. **JWT Token**: Returned token can be used in all protected endpoints that require authentication.

4. **Active User**: 
   - For app mobile: user must have status `enable` and not be deleted
   - For backoffice: user must have status `active` and not be deleted

5. **Password**: Password must be registered in database. If user has no password, it will return error.

## Postman Collection Example

Create a Postman collection with these requests:

1. **Test Login (App)**
   - Method: POST
   - URL: `{{base_url}}/test/auth/login`
   - Body: JSON with email and password
   - Tests: Save `token` in `app_token` variable

2. **Test Login (Backoffice)**
   - Method: POST
   - URL: `{{base_url}}/test/auth/backoffice-login`
   - Body: JSON with email and password
   - Tests: Save `token` in `backoffice_token` variable

This allows you to test the complete authentication flow automatically.

## App vs Backoffice Differences

| Aspect | App Mobile | Backoffice |
|--------|------------|------------|
| Table | `users` | `backofficeUsers` |
| Valid status | `enable` | `active` |
| Role | `customer` (default) | From `backofficeRoles` table |
| Response | Includes `identity` | Includes `role` |
| Endpoint | `/test/auth/login` | `/test/auth/backoffice-login` |
