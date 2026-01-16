# Authentication Validation Flow

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Complete email/phone validation and password recovery flow for user authentication.

## Code References

**Controller:** `src/public/auth/controllers/auth.controller.ts`
**Services:**
- `src/public/auth/services/email-validation.service.ts`
- `src/public/auth/services/phone-validation.service.ts`
- `src/public/auth/services/password-recovery.service.ts`

## Endpoints

---

### POST /api/users/user/sendEmailValidation

Send validation code via email.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Success Response (200)

```json
{
  "message": "Validation code sent successfully",
  "email": "user@example.com",
  "codeLength": 6,
  "expiresIn": 300
}
```

#### Error Responses

**400 - Invalid Email**
```json
{
  "error": "400 validation.errors.invalidEmail",
  "message": "Invalid email format",
  "code": 400
}
```

**429 - Rate Limit**
```json
{
  "error": "429 validation.errors.rateLimitExceeded",
  "message": "Too many requests. Try again later.",
  "code": 429
}
```

---

### POST /api/users/user/verifyEmailCode

Verify email validation code.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

#### Success Response (200)

```json
{
  "message": "Email verified successfully",
  "email": "user@example.com",
  "verified": true
}
```

#### Error Responses

**400 - Invalid Code**
```json
{
  "error": "400 validation.errors.invalidCode",
  "message": "Invalid or expired code",
  "code": 400
}
```

**404 - Code Not Found**
```json
{
  "error": "404 validation.errors.codeNotFound",
  "message": "Validation code not found",
  "code": 404
}
```

---

### POST /api/users/user/sendPhoneValidation

Send validation code via SMS.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

```json
{
  "phone": "+5511999999999"
}
```

#### Success Response (200)

```json
{
  "message": "Validation code sent successfully",
  "phone": "+5511999999999",
  "codeLength": 6,
  "expiresIn": 300
}
```

#### Error Responses

**400 - Invalid Phone**
```json
{
  "error": "400 validation.errors.invalidPhone",
  "message": "Invalid phone number format",
  "code": 400
}
```

**429 - Rate Limit**
```json
{
  "error": "429 validation.errors.rateLimitExceeded",
  "message": "Too many requests. Try again later.",
  "code": 429
}
```

---

### POST /api/users/user/verifyPhoneCode

Verify phone validation code.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

```json
{
  "phone": "+5511999999999",
  "code": "123456"
}
```

#### Success Response (200)

```json
{
  "message": "Phone verified successfully",
  "phone": "+5511999999999",
  "verified": true
}
```

#### Error Responses

**400 - Invalid Code**
```json
{
  "error": "400 validation.errors.invalidCode",
  "message": "Invalid or expired code",
  "code": 400
}
```

**404 - Code Not Found**
```json
{
  "error": "404 validation.errors.codeNotFound",
  "message": "Validation code not found",
  "code": 404
}
```

---

### POST /api/users/user/forgot

Initiate password recovery process.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Success Response (200)

```json
{
  "message": "Recovery code sent successfully",
  "email": "user@example.com",
  "codeLength": 6,
  "expiresIn": 600
}
```

#### Error Responses

**404 - User Not Found**
```json
{
  "error": "404 users.errors.userNotFound",
  "message": "User not found",
  "code": 404
}
```

**429 - Rate Limit**
```json
{
  "error": "429 validation.errors.rateLimitExceeded",
  "message": "Too many requests. Try again later.",
  "code": 429
}
```

---

### POST /api/users/user/verify

Verify password recovery code.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newSecurePass123"
}
```

#### Success Response (200)

```json
{
  "message": "Password reset successfully",
  "email": "user@example.com"
}
```

#### Error Responses

**400 - Invalid Code**
```json
{
  "error": "400 validation.errors.invalidCode",
  "message": "Invalid or expired recovery code",
  "code": 400
}
```

**400 - Weak Password**
```json
{
  "error": "400 validation.errors.weakPassword",
  "message": "Password must be at least 8 characters",
  "code": 400
}
```

---

### POST /api/users/user/unlock

Unlock account after successful verification.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

```json
{
  "email": "user@example.com",
  "unlockToken": "token-from-verify-endpoint"
}
```

#### Success Response (200)

```json
{
  "message": "Account unlocked successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "enable"
  }
}
```

#### Error Responses

**400 - Invalid Token**
```json
{
  "error": "400 users.errors.invalidUnlockToken",
  "message": "Invalid or expired unlock token",
  "code": 400
}
```

**404 - User Not Found**
```json
{
  "error": "404 users.errors.userNotFound",
  "message": "User not found",
  "code": 404
}
```

---

## Validation Flow Diagram

```
Email Validation Flow:
1. POST /sendEmailValidation → Sends code via email
2. POST /verifyEmailCode → Validates code
3. User email verified ✓

Phone Validation Flow:
1. POST /sendPhoneValidation → Sends code via SMS
2. POST /verifyPhoneCode → Validates code
3. User phone verified ✓

Password Recovery Flow:
1. POST /forgot → Sends recovery code
2. POST /verify → Validates code + sets new password
3. POST /unlock → Returns JWT token
4. User can login with new password ✓
```

## Business Rules

1. **Code Expiration**: Validation codes expire in 5 minutes (email/phone) or 10 minutes (password recovery)
2. **Code Length**: All codes are 6 digits
3. **Rate Limiting**: Max 3 code requests per 5 minutes per email/phone
4. **Code Attempts**: Max 5 verification attempts before code invalidation
5. **Password Policy**: Minimum 8 characters with at least one letter and one number
6. **Account Lock**: After 5 failed password recovery attempts, account is temporarily locked

## Security Considerations

- All codes are hashed before storage
- Codes are single-use only
- SMS delivery uses secure provider
- Email delivery uses encrypted SMTP
- Rate limiting prevents abuse
- All recovery events are logged

## Testing

### Test Cases

1. ✅ Send email validation - should receive code
2. ✅ Verify valid code - should succeed
3. ✅ Verify expired code - should return 400
4. ✅ Verify invalid code - should return 400
5. ✅ Rate limiting - should return 429 after threshold
6. ✅ Complete password recovery flow - should reset password

### Automated Testing

```bash
npm run test:e2e -- validation.e2e-spec.ts
```

## Error Codes

- `400 validation.errors.invalidEmail` - Email format invalid
- `400 validation.errors.invalidPhone` - Phone format invalid
- `400 validation.errors.invalidCode` - Code invalid or expired
- `404 validation.errors.codeNotFound` - Code not found in database
- `429 validation.errors.rateLimitExceeded` - Too many requests
- `400 validation.errors.weakPassword` - Password doesn't meet requirements
- `400 users.errors.invalidUnlockToken` - Unlock token invalid or expired

## References

- [Public Login](public-login.md)
- [Public Signup](public-signup.md)
- [User Profile](../users/profile.md)
- [Email Service](../../shared/email-service.md)
- [SMS Service](../../shared/sms-service.md)
