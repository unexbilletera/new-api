# Testing Backoffice Authentication

This guide shows how to test backoffice authentication endpoints using Postman.

## Prerequisites

- Base URL configured in Postman (e.g., `http://localhost:3000`)
- Valid backoffice user credentials

## Available Endpoints

### Backoffice Login

**POST** `/backoffice/auth/login`

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

**Fields:**
- `email` (string, required): Backoffice user email
- `password` (string, required): Backoffice user password

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@example.com",
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

**Error Response (401):**
```json
{
  "error": "401 backoffice.errors.invalidCredentials",
  "message": "401 backoffice.errors.invalidCredentials",
  "code": 401
}
```

### Get Logged User Data

**GET** `/backoffice/auth/me`

**Headers:**
```
Authorization: Bearer {token_from_login}
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "name": "Admin",
  "email": "admin@example.com",
  "role": {
    "id": "uuid",
    "name": "Administrator",
    "level": 1
  }
}
```

**Error Response (401):**
```json
{
  "error": "401 backoffice.errors.missingToken",
  "message": "401 backoffice.errors.missingToken",
  "code": 401
}
```

## Test Flow

### Step 1: Login

1. Set method to **POST**
2. URL: `{{base_url}}/backoffice/auth/login`
3. In **Headers** tab:
   - `Content-Type`: `application/json`
4. In **Body** tab (raw JSON):
```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```
5. Click **Send**
6. Copy the `accessToken` value

### Step 2: Test Protected Endpoint (Me)

1. Set method to **GET**
2. URL: `{{base_url}}/backoffice/auth/me`
3. In **Headers** tab:
   - `Authorization`: `Bearer {paste_accessToken_here}`
   - `Content-Type`: `application/json`
4. Click **Send**

## Postman Environment

Configure variables:

```
base_url: http://localhost:3000
backoffice_token: {paste_accessToken_here}
```

Use `{{base_url}}` and `{{backoffice_token}}` in requests.

## Common Errors

### 401 Unauthorized

**Causes:**
- `401 backoffice.errors.missingToken`: Token not provided
- `401 backoffice.errors.invalidToken`: Invalid token
- `401 backoffice.errors.expiredToken`: Token expired
- `401 backoffice.errors.invalidCredentials`: Invalid credentials
- `401 backoffice.errors.userInactive`: User inactive
- `401 backoffice.errors.userDeleted`: User deleted

**Solution**: Verify token is correct and user is active.

### 400 Bad Request

**Causes:**
- `400 backoffice.errors.invalidEmail`: Invalid email
- `400 backoffice.errors.invalidPassword`: Invalid password

**Solution**: Verify request body format.

## Important Notes

1. **JWT Token**: Token has expiration, login again when expired
2. **Active User**: User must have status `active`
3. **Permissions**: Token contains role information for access control
4. **Security**: Never share tokens in production, use only for testing

## Postman Collection

Create collection with:

1. **Backoffice Login**
   - Method: POST
   - URL: `{{base_url}}/backoffice/auth/login`
   - Body: JSON with email and password
   - Tests: Save `accessToken` in variable

2. **Get Me**
   - Method: GET
   - URL: `{{base_url}}/backoffice/auth/me`
   - Headers: `Authorization: Bearer {{backoffice_token}}`

## Auto-Save Token Script

Add to Login request **Tests** tab:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("backoffice_token", response.accessToken);
  console.log("Token saved:", response.accessToken);
}
```

## References

- [API Documentation](../api/backoffice-auth.md)
- [Testing Guide](testing.md)
- [Module Example](module-example.md)
