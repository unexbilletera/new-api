# Backoffice Login

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Authenticates backoffice users (administrators) and returns a JWT token for accessing administrative endpoints.

## Endpoints

### POST /backoffice/auth/login

Authenticate backoffice user.

**Status:** `stable`
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Content-Type: application/json
```

#### Request Body

**Required:**
- `email` (string): Backoffice user email
- `password` (string): User password (min 8 characters)

#### Request Example

```json
{
  "email": "admin@example.com",
  "password": "adminPassword123"
}
```

#### Success Response (200)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin User",
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

#### Error Responses

**401 Unauthorized - Invalid Credentials**
```json
{
  "error": "401 backoffice.errors.invalidCredentials",
  "message": "401 backoffice.errors.invalidCredentials",
  "code": 401
}
```

**401 Unauthorized - User Inactive**
```json
{
  "error": "401 backoffice.errors.userInactive",
  "message": "401 backoffice.errors.userInactive",
  "code": 401
}
```

**401 Unauthorized - Insufficient Permissions**
```json
{
  "error": "401 backoffice.errors.insufficientPermissions",
  "message": "401 backoffice.errors.insufficientPermissions",
  "code": 401
}
```

### GET /backoffice/auth/me

Get logged backoffice user profile.

**Status:** `stable`
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Success Response (200)

```json
{
  "id": "uuid",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": {
    "id": "uuid",
    "name": "Administrator",
    "level": 1,
    "permissions": ["users:read", "users:write", "clients:read"]
  }
}
```

#### Error Responses

**401 Unauthorized - Missing Token**
```json
{
  "error": "401 backoffice.errors.missingToken",
  "message": "401 backoffice.errors.missingToken",
  "code": 401
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "error": "401 backoffice.errors.invalidToken",
  "message": "401 backoffice.errors.invalidToken",
  "code": 401
}
```

## Business Rules

1. **User Status**: User must have status `active`
2. **Password Validation**: Password validated using bcrypt
3. **Brute-Force Protection**: Rate limiting (5 requests/minute)
4. **Role Required**: User must have assigned role
5. **Token Expiration**: Token valid for configured time

## Role Levels

- **Level 1**: Administrator (full access)
- **Level 2**: Manager (limited admin access)
- **Level 3**: Support (read-only access)

## Security Considerations

- Separate user table from public users
- Role-based access control (RBAC)
- Audit logging for all admin actions
- Enhanced password requirements
- Session monitoring

## Testing

### Test Cases

1. ✅ Valid admin credentials - should return token
2. ✅ Invalid password - should return 401
3. ✅ Inactive user - should return 401
4. ✅ Get profile with valid token - should return user
5. ✅ Get profile without token - should return 401

### Manual Testing

See [Backoffice Auth Testing Guide](../../guides/testing-backoffice-auth.md).

## Changelog

### 2026-01-14
- Added role permissions in profile response
- Enhanced audit logging

### 2026-01-07
- Implemented brute-force protection
- Added session monitoring

## Related Endpoints

- [Backoffice Users](../backoffice/users.md)
- [Backoffice Roles](../backoffice/roles.md)

## References

- [Error Codes](../error-codes.md)
- [Security & Performance](../../operations/security-performance.md)
- [Module Example](../../guides/module-example.md)
