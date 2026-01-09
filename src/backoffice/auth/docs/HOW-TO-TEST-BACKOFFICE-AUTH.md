# Testing Backoffice Auth in Postman

This guide shows how to test backoffice authentication endpoints using Postman.

## Prerequisites

1. **Base URL**: Configure the API base URL in Postman (e.g., `http://localhost:3000`)

## Available Endpoints

### 1. Backoffice Login

**POST** `/backoffice/auth/login`

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
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Admin",
    "email": "admin@exemplo.com",
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

### 2. Get Logged User Data

**GET** `/backoffice/auth/me`

**Headers:**
```
Authorization: Bearer {token_from_login}
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "id": "uuid-do-usuario",
  "name": "Admin",
  "email": "admin@exemplo.com",
  "role": {
    "id": "uuid-do-role",
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

## Complete Test Flow

### Step 1: Login

1. Set method to **POST**
2. URL: `{{base_url}}/backoffice/auth/login`
3. In **Headers** tab, add:
   - `Content-Type`: `application/json`
4. In **Body** tab, select **raw** and **JSON**, paste:
```json
{
  "email": "seu-email@exemplo.com",
  "password": "sua-senha"
}
```
5. Click **Send**
6. Copy the `accessToken` value from response

### Step 2: Test Protected Endpoint (Me)

1. Set method to **GET**
2. URL: `{{base_url}}/backoffice/auth/me`
3. In **Headers** tab, add:
   - `Authorization`: `Bearer {paste_accessToken_here}`
   - `Content-Type`: `application/json`
4. Click **Send**

## Postman Environment Variables

Configure these variables in Postman:

```
base_url: http://localhost:3000
backoffice_token: {paste_accessToken_here}
```

Then use `{{base_url}}` and `{{backoffice_token}}` in your requests.

## Common Error Codes

### 401 Unauthorized
**Possible causes:**
- `401 backoffice.errors.missingToken`: Token not provided
- `401 backoffice.errors.invalidToken`: Invalid token
- `401 backoffice.errors.expiredToken`: Token expired
- `401 backoffice.errors.invalidCredentials`: Invalid credentials
- `401 backoffice.errors.userInactive`: User inactive
- `401 backoffice.errors.userDeleted`: User deleted

**Solution**: Verify token is correct and user is active.

### 400 Bad Request
**Possible causes:**
- `400 backoffice.errors.invalidEmail`: Invalid email
- `400 backoffice.errors.invalidPassword`: Invalid password

**Solution**: Verify data sent in body.

## Important Notes

1. **JWT Token**: Token returned on login has validity. When expired, login again.

2. **Active User**: User must have status `active` to login.

3. **Permissions**: Token contains user role information. Use to control access to different features.

4. **Security**: Never share tokens in production. Use only for testing in development.

## Postman Collection Example

Create a Postman collection with these requests:

1. **Backoffice Login**
   - Method: POST
   - URL: `{{base_url}}/backoffice/auth/login`
   - Body: JSON with email and password
   - Tests: Save `accessToken` in variable

2. **Get Me**
   - Method: GET
   - URL: `{{base_url}}/backoffice/auth/me`
   - Headers: `Authorization: Bearer {{backoffice_token}}`

This allows you to test the complete authentication flow automatically.
