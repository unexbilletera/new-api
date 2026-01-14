# Users Domain

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Overview

The users domain handles user profile management, validation processes, and account operations for authenticated users.

## Endpoints

### Profile Management
- [User Profile](profile.md) - `GET/POST /api/users/user/me`, `/profile`
- [Address Management](profile.md#address) - `POST /api/users/user/address`
- [Change Email](profile.md#change-email) - Email change request/confirm

### Validation
- [Email Validation](email-validation.md) - Send/verify email codes
- [Phone Validation](phone-validation.md) - Send/verify phone codes

### Password Management
- [Change Password](password-management.md) - Password update endpoints
- [Password Recovery](password-recovery.md) - Reset password flow

### Device Management
- [Device Registration](device-management.md) - Register and manage devices

## Domain Flow

```
┌──────────────┐
│ Registration │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Email Verify │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Phone Verify │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Onboarding  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Full Profile │
└──────────────┘
```

## User States

- **Registered**: User created, email/phone not verified
- **Email Verified**: Email validated with code
- **Phone Verified**: Phone validated with code
- **Onboarding**: Completing identity verification
- **Active**: Full profile, verified, ready to use app

## Security & Validation

- Email validation required before certain operations
- Phone validation required for sensitive actions
- Password changes require current password
- Device registration for security monitoring

## Error Codes

Common user domain error codes:

- `400 users.errors.userNotFound` - User does not exist
- `400 users.errors.invalidEmail` - Invalid email format
- `400 users.errors.invalidPassword` - Invalid password
- `401 users.errors.invalidCredentials` - Authentication failed

See [Error Codes](../error-codes.md) for complete list.

## Testing

- [Testing Guide](../../guides/testing.md)
- [Public Auth Testing](../../guides/testing-public-auth.md)

## Related Documentation

- [Authentication Domain](../authentication/README.md)
- [Onboarding Flow](../onboarding/README.md)
- [User Registration Flow](../../flows/user-registration-flow.md)
