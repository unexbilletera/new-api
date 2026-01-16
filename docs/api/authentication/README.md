# Authentication Domain

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Authentication Team

## Overview

The authentication domain handles user authentication, authorization, and session management for both public (mobile app) and backoffice (admin panel) users.

## Endpoints

### Public Authentication
- [Public Login](public-login.md) - `POST /api/users/user/signin`
- [Public Signup](public-signup.md) - `POST /api/users/user/signup`
- [Password Recovery](password-recovery.md) - Password reset endpoints

### Backoffice Authentication
- [Backoffice Login](backoffice-login.md) - `POST /backoffice/auth/login`
- [Backoffice Profile](backoffice-login.md#get-profile) - `GET /backoffice/auth/me`

### Token Management
- Token refresh (if applicable)
- Token validation
- Logout

## Authentication Flow

```
┌─────────┐
│  Client │
└────┬────┘
     │
     │ 1. POST /signin (email/phone + password)
     │
     ▼
┌─────────────┐
│  API Server │
└──────┬──────┘
       │
       │ 2. Validate credentials (bcrypt)
       │ 3. Check user status (enable/active)
       │
       ▼
┌──────────────┐
│  JWT Service │
└──────┬───────┘
       │
       │ 4. Generate token (userId, role)
       │
       ▼
┌─────────┐
│  Client │ ◄─── 5. Return token + user data
└─────────┘
```

## Authentication Types

### Public (Mobile App)
- **Table**: `users`
- **Valid Status**: `enable`
- **Role**: `customer` (default)
- **Response**: Includes identity and account info

### Backoffice (Admin Panel)
- **Table**: `backofficeUsers`
- **Valid Status**: `active`
- **Role**: From `backofficeRoles` table
- **Response**: Includes role and permissions

## Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **Brute-Force Protection**: Rate limiting on login endpoints
- **Token Expiration**: Configurable JWT expiration
- **Device Registration**: Track and manage user devices
- **Suspicious Activity**: Logging for unusual login patterns

## Error Codes

Common authentication error codes:

- `401 users.errors.invalidCredentials` - Invalid email/password
- `401 users.errors.userInactive` - User account inactive
- `401 users.errors.userDeleted` - User account deleted
- `401 users.errors.missingToken` - Token not provided
- `401 users.errors.expiredToken` - Token expired
- `401 users.errors.invalidToken` - Invalid token format

See [Error Codes](../error-codes.md) for complete list.

## Testing

- [Public Auth Testing Guide](../../guides/testing-public-auth.md)
- [Backoffice Auth Testing Guide](../../guides/testing-backoffice-auth.md)

## Related Documentation

- [Users Domain](../users/README.md)
- [Security & Performance](../../operations/security-performance.md)
- [Module Example](../../guides/module-example.md)
