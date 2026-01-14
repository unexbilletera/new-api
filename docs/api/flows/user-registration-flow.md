# User Registration Flow

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Overview

Complete end-to-end flow for user registration from initial signup through full account activation.

## Flow Diagram

```
┌─────────────┐
│   Signup    │ POST /api/users/user/signup
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Verify Email│ POST /sendEmailValidation → /verifyEmailCode
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Verify Phone│ POST /sendPhoneValidation → /verifyPhoneCode
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Login      │ POST /api/users/user/signin
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Onboarding  │ See Onboarding Flow
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │ Full account access
└─────────────┘
```

## Steps

### 1. Signup

**Endpoint:** `POST /api/users/user/signup`

**Input:**
- email
- password (6 digits)
- phone
- language

**Output:**
- User created
- Status: `enable`
- Access: `customer`

### 2. Email Validation

**Endpoints:**
- `POST /api/users/user/sendEmailValidation`
- `POST /api/users/user/verifyEmailCode`

**Process:**
- 6-digit code sent to email
- Code valid for 15 minutes
- Sets `emailVerifiedAt` timestamp

### 3. Phone Validation

**Endpoints:**
- `POST /api/users/user/sendPhoneValidation`
- `POST /api/users/user/verifyPhoneCode`

**Process:**
- SMS code sent via Twilio
- Code valid for 15 minutes
- Sets `phoneVerifiedAt` timestamp

### 4. Login

**Endpoint:** `POST /api/users/user/signin`

**Input:**
- identifier (email or phone)
- password

**Output:**
- JWT token
- User profile

### 5. Complete Onboarding

See [Onboarding Flow](../onboarding/README.md) for complete onboarding process.

## Success Criteria

- [x] User created in database
- [x] Email verified
- [x] Phone verified
- [x] User can login
- [x] Onboarding completed
- [x] Accounts created

## Error Handling

Common errors during registration:
- Email already exists
- Invalid email/phone format
- Invalid validation code
- Code expired
- User inactive

## Testing

```bash
# E2E test
npm run test:e2e -- user-registration.e2e-spec.ts
```

## References

- [Authentication Domain](../authentication/README.md)
- [Users Domain](../users/README.md)
- [Onboarding](../onboarding/README.md)
