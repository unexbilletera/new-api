# User Email Change

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Secure two-step email change process requiring verification code.

## Code References

**Controller:** `src/public/users/controllers/user.controller.ts`
**Service:** `src/public/users/services/email-change.service.ts`
**Model:** `src/public/users/models/user.model.ts`

## Endpoints

---

### POST /api/users/user/change-email/request

Initiate email change process and send verification code.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "newEmail": "newemail@example.com"
}
```

#### Request Fields

- `newEmail` (string, required): New email address

#### Success Response (200)

```json
{
  "message": "Verification code sent to new email",
  "email": "newemail@example.com",
  "expiresIn": 600
}
```

#### Error Responses

**400 - Email Already In Use**
```json
{
  "error": "400 users.errors.emailAlreadyInUse",
  "message": "Email is already registered",
  "code": 400
}
```

**400 - Invalid Email Format**
```json
{
  "error": "400 users.errors.invalidEmail",
  "message": "Invalid email format",
  "code": 400
}
```

**401 - Unauthorized**
```json
{
  "error": "401 users.errors.unauthorized",
  "message": "Invalid or missing token",
  "code": 401
}
```

---

### POST /api/users/user/change-email/confirm

Confirm email change with verification code.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "code": "123456"
}
```

#### Request Fields

- `code` (string, required): 6-digit verification code sent to new email

#### Success Response (200)

```json
{
  "message": "Email changed successfully",
  "email": "newemail@example.com",
  "verified": true
}
```

#### Error Responses

**400 - Invalid Code**
```json
{
  "error": "400 users.errors.invalidCode",
  "message": "Invalid or expired verification code",
  "code": 400
}
```

**400 - Code Expired**
```json
{
  "error": "400 users.errors.codeExpired",
  "message": "Verification code has expired",
  "code": 400
}
```

**404 - No Pending Change**
```json
{
  "error": "404 users.errors.noPendingEmailChange",
  "message": "No pending email change request found",
  "code": 404
}
```

---

## Email Change Flow

```
1. User Request
   POST /change-email/request { newEmail }
   └─> Validate new email not in use
   └─> Generate 6-digit code
   └─> Send code to new email
   └─> Store pending change in user.notes

2. User Verification
   POST /change-email/confirm { code }
   └─> Validate code matches
   └─> Check code not expired
   └─> Update user email
   └─> Clear pending change
   └─> Set emailVerifiedAt
```

---

## Business Rules

1. **Code Expiration**: Verification codes expire after 10 minutes
2. **Code Format**: 6-digit numeric code
3. **Email Uniqueness**: New email must not be registered to another user
4. **Single Request**: Only one pending email change per user at a time
5. **Verification Required**: New email automatically marked as verified after successful change
6. **Previous Email**: Old email retained in audit logs
7. **Max Attempts**: Max 5 verification attempts before code invalidation

---

## Security Considerations

- Code sent only to new email address (not to old email)
- Codes are hashed before storage
- Single-use codes (invalidated after use)
- Rate limiting: Max 3 email change requests per hour
- Email change events logged for security audit
- Old email receives notification of change

---

## Code Flow

```
EmailChangeService.requestEmailChange()
  └─> UserModel.findByEmailExcluding()  // Check email not in use
  └─> Generate verification code
  └─> Hash code with bcrypt
  └─> EmailService.sendVerificationCode()
  └─> UserModel.updateEmailChangeRequest()
      ├─> Store verifyToken (hashed code)
      └─> Store notes (pending email JSON)

EmailChangeService.confirmEmailChange()
  └─> UserModel.findById()
  └─> Parse notes to get pending email
  └─> Validate code with bcrypt.compare()
  └─> UserModel.confirmEmailChange()
      ├─> Update email
      ├─> Set emailVerifiedAt
      ├─> Clear verifyToken
      └─> Update notes
```

---

## Testing

### Test Cases

1. ✅ Request email change with valid email - should send code
2. ✅ Request with email already in use - should return 400
3. ✅ Confirm with valid code - should update email
4. ✅ Confirm with invalid code - should return 400
5. ✅ Confirm with expired code - should return 400
6. ✅ Request multiple changes - should replace pending change
7. ✅ Email verification status - should set emailVerifiedAt

### Manual Testing

```bash
# 1. Request email change
curl -X POST http://localhost:3000/api/users/user/change-email/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"newEmail": "newemail@example.com"}'

# 2. Confirm email change
curl -X POST http://localhost:3000/api/users/user/change-email/confirm \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

### Automated Testing

```bash
npm run test:e2e -- email-change.e2e-spec.ts
```

---

## Error Codes

- `400 users.errors.emailAlreadyInUse` - Email already registered
- `400 users.errors.invalidEmail` - Invalid email format
- `400 users.errors.invalidCode` - Verification code invalid
- `400 users.errors.codeExpired` - Verification code expired
- `404 users.errors.noPendingEmailChange` - No pending change found
- `401 users.errors.unauthorized` - Missing or invalid JWT token

---

## References

- [User Profile](profile.md)
- [Email Service](../../shared/email-service.md)
- [Password Change](password-change.md)
- [Account Security](../../operations/security-performance.md)

---

## Changelog

### 2026-01-14
- Added comprehensive documentation
- Documented code expiration behavior

### 2025-11-15
- Improved security with code hashing
- Added rate limiting
