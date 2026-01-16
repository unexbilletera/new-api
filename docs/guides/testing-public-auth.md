# Testing Public Authentication

This guide shows how to test public authentication endpoints using Postman.

**WARNING**: These endpoints are for development/testing only. They should NOT be used in production.

## Prerequisites

- Base URL configured in Postman (e.g., `http://localhost:3000`)
- Valid user credentials in database

## Available Endpoints

### Test Login (App Mobile)

**POST** `/test/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "user-password"
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
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "status": "enable",
    "identity": {
      "id": "uuid",
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

### Test Login (Backoffice)

**POST** `/test/auth/backoffice-login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin-password"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin",
    "status": "active",
    "role": {
      "id": "uuid",
      "name": "Administrator",
      "level": 1
    }
  },
  "message": "200 backoffice.success.login",
  "code": "200 backoffice.success.login"
}
```

## Test Flow

### Step 1: App Mobile Login

1. Set method to **POST**
2. URL: `{{base_url}}/test/auth/login`
3. In **Headers** tab:
   - `Content-Type`: `application/json`
4. In **Body** tab (raw JSON):
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```
5. Click **Send**
6. Copy the `token` value

### Step 2: Use Token in Protected Endpoints

1. Set method according to endpoint
2. URL: `{{base_url}}/protected-endpoint`
3. In **Headers** tab:
   - `Authorization`: `Bearer {paste_token_here}`
   - `Content-Type`: `application/json`
4. Click **Send**

## Postman Environment

Configure variables:

```
base_url: http://localhost:3000
app_token: {token_from_app_login}
backoffice_token: {token_from_backoffice_login}
```

Use `{{base_url}}`, `{{app_token}}`, `{{backoffice_token}}` in requests.

## Common Errors

### 401 Unauthorized

**Causes:**
- `401 users.errors.invalidCredentials`: Invalid email/password
- `401 users.errors.userInactive`: User inactive
- `401 backoffice.errors.invalidCredentials`: Invalid backoffice credentials

**Solution**: Verify credentials are correct and user is active.

### 400 Bad Request

**Causes:**
- `400 users.errors.invalidEmail`: Invalid email format
- `400 users.errors.invalidPassword`: Invalid password format

**Solution**: Check request body format.

## Important Notes

1. **Development Only**: These endpoints are temporary for testing
2. **Real Validation**: Endpoints perform real bcrypt password validation
3. **JWT Token**: Token can be used in all protected endpoints
4. **Active User**:
   - App: user must have status `enable`
   - Backoffice: user must have status `active`
5. **Password Required**: User must have password in database

## Postman Collection

Create collection with:

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

## App vs Backoffice Differences

| Aspect       | App Mobile           | Backoffice                    |
| ------------ | -------------------- | ----------------------------- |
| Table        | `users`              | `backofficeUsers`             |
| Valid status | `enable`             | `active`                      |
| Role         | `customer` (default) | From `backofficeRoles` table  |
| Response     | Includes `identity`  | Includes `role`               |
| Endpoint     | `/test/auth/login`   | `/test/auth/backoffice-login` |

## References

- [API Documentation](../api/README.md)
- [Testing Guide](testing.md)
- [Backoffice Authentication Testing](testing-backoffice-auth.md)
