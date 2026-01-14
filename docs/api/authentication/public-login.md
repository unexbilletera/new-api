# Public Login

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Authenticates users from the mobile application and returns a JWT token for accessing protected endpoints.

## Code References

**Controller:** `src/public/auth/controllers/auth.controller.ts` (AuthController)
**Service:** `src/public/auth/services/signin.service.ts`
**Model:** `src/public/auth/models/user.model.ts`

## Endpoint

### POST /api/users/user/signin

Authenticate user with email/phone and password.

**Status:** `stable`
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Content-Type: application/json
```

#### Request Body

**Required:**
- `identifier` (string): Email or phone number
- `password` (string): User password (min 6 characters)

**Optional:**
- `systemVersion` (string): App version
- `deviceIdentifier` (string): Unique device ID
- `mobileDevice` (object): Mobile device info
  - `manufacturer` (string)
  - `model` (string)
  - `osVersion` (string)
- `browser` (object): Browser info
  - `name` (string)
  - `version` (string)

#### Request Example

```json
{
  "identifier": "user@example.com",
  "password": "senha123",
  "deviceIdentifier": "device-uuid-123",
  "systemVersion": "1.0.0",
  "mobileDevice": {
    "manufacturer": "Apple",
    "model": "iPhone 13",
    "osVersion": "iOS 16"
  }
}
```

#### Success Response (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "status": "enable",
    "access": "customer",
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

#### Error Responses

**401 Unauthorized - Invalid Credentials**
```json
{
  "error": "401 users.errors.invalidCredentials",
  "message": "401 users.errors.invalidCredentials",
  "code": 401
}
```

**401 Unauthorized - User Inactive**
```json
{
  "error": "401 users.errors.userInactive",
  "message": "401 users.errors.userInactive",
  "code": 401
}
```

**400 Bad Request - Invalid Parameters**
```json
{
  "error": "400 users.errors.invalidParameters",
  "message": "400 users.errors.invalidParameters",
  "code": 400
}
```

## Business Rules

1. **User Status**: User must have status `enable`
2. **Password Validation**: Password validated using bcrypt
3. **Brute-Force Protection**: Rate limiting applied (5 requests/minute)
4. **Device Registration**: Device may require registration if new
5. **Token Expiration**: Token valid for configured time (default: 1 day)

## Device Registration

If device is not registered and device registration is required, the response will indicate:

```json
{
  "requiresDeviceRegistration": true,
  "message": "Device registration required"
}
```

Client should then register device before proceeding.

## Security Considerations

- Password never returned in response
- Token should be stored securely on client
- HTTPS required in production
- Implement token refresh for long sessions
- Log failed login attempts for security monitoring

## Testing

### Test Cases

1. ✅ Valid credentials - should return token
2. ✅ Invalid password - should return 401
3. ✅ Inactive user - should return 401
4. ✅ Non-existent user - should return 401
5. ✅ Missing parameters - should return 400
6. ✅ Rate limiting - should return 429 after threshold

### Manual Testing

See [Public Auth Testing Guide](../../guides/testing-public-auth.md) for Postman collection.

### Automated Testing

```bash
npm run test:e2e -- auth.e2e-spec.ts
```

## Changelog

### 2026-01-14
- Enhanced device registration flow
- Improved error messaging

### 2026-01-07
- Added brute-force protection
- Implemented rate limiting

## Related Endpoints

- [Public Signup](public-signup.md)
- [Password Recovery](password-recovery.md)
- [User Profile](../users/profile.md)

## References

- [Error Codes](../error-codes.md)
- [Security & Performance](../../operations/security-performance.md)
- [Authentication Flow](../../flows/user-registration-flow.md)
