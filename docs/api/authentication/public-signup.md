# Public Signup

**Status:** `stable`
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Author:** Authentication Team
**Version:** v1.0

## Overview

Register a new user account in the system. This is the entry point for new users in the mobile application.

## Endpoint

### POST /api/users/user/signup

Create a new user account.

**Status:** `stable`
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Content-Type: application/json
```

#### Request Body

**Required:**
- `email` (string): Valid email address
- `password` (string): Password (exactly 6 digits)
- `phone` (string): Phone number with country code
- `language` (string): User language (`es`, `pt`, `en`)

**Optional:**
- `firstName` (string): User first name
- `lastName` (string): User last name
- `deviceIdentifier` (string): Unique device ID
- `mobileDevice` (object): Mobile device information
- `browser` (object): Browser information

#### Request Example

```json
{
  "email": "newuser@example.com",
  "password": "123456",
  "phone": "+5511999999999",
  "language": "pt",
  "firstName": "John",
  "lastName": "Doe",
  "deviceIdentifier": "device-uuid-123"
}
```

#### Success Response (200)

```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "phone": "+5511999999999",
    "language": "pt",
    "status": "enable"
  },
  "message": "200 users.success.register",
  "code": "200 users.success.register"
}
```

#### Error Responses

**400 Bad Request - Email Already Exists**
```json
{
  "error": "400 users.errors.emailAlreadyExists",
  "message": "400 users.errors.emailAlreadyExists",
  "code": 400
}
```

**400 Bad Request - Invalid Email**
```json
{
  "error": "400 users.errors.invalidEmail",
  "message": "400 users.errors.invalidEmail",
  "code": 400
}
```

**400 Bad Request - Invalid Password**
```json
{
  "error": "400 users.errors.invalidPassword",
  "message": "400 users.errors.invalidPassword",
  "code": 400
}
```

## Business Rules

1. **Email Uniqueness**: Email must not already exist in system
2. **Password Format**: Exactly 6 digits required
3. **Phone Format**: Valid phone with country code
4. **Language**: Must be one of: `es`, `pt`, `en`
5. **Default Status**: User created with status `enable`
6. **Default Access**: User created with access `customer`

## Post-Registration Flow

After successful registration, user should:

1. Verify email address (see [Email Validation](../users/email-validation.md))
2. Verify phone number (see [Phone Validation](../users/phone-validation.md))
3. Complete onboarding (see [Onboarding Flow](../onboarding/README.md))

## Security Considerations

- Password hashed with bcrypt (10 rounds) before storage
- Email validation required before full account access
- Rate limiting applied (3 requests/minute)
- Device registration may be required

## Testing

### Test Cases

1. ✅ Valid registration - should create user
2. ✅ Duplicate email - should return 400
3. ✅ Invalid email format - should return 400
4. ✅ Invalid password format - should return 400
5. ✅ Missing required fields - should return 400

### Manual Testing

See [Public Auth Testing Guide](../../guides/testing-public-auth.md).

## Changelog

### 2026-01-14
- Improved validation messaging
- Enhanced device registration

### 2026-01-07
- Added rate limiting
- Improved error handling

## Related Endpoints

- [Public Login](public-login.md)
- [Email Validation](../users/email-validation.md)
- [Phone Validation](../users/phone-validation.md)

## References

- [Error Codes](../error-codes.md)
- [User Registration Flow](../../flows/user-registration-flow.md)
- [Onboarding Overview](../onboarding/README.md)
