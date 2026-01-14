# Onboarding Process

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

The onboarding process is a comprehensive multi-step KYC (Know Your Customer) workflow that guides new users through account verification, identity confirmation, and document submission to comply with regulatory requirements.

## Code References

**Controller:** `src/public/onboarding/controllers/onboarding.controller.ts`
**Services:**
- `src/public/onboarding/services/user-onboarding.service.ts`
- `src/public/onboarding/services/verification.service.ts`
- `src/public/onboarding/services/identity-onboarding.service.ts`
- `src/public/onboarding/services/email-validation-onboarding.service.ts`
- `src/public/auth/services/phone-validation.service.ts`

**Models:**
- `src/public/onboarding/models/user-onboarding.model.ts`
- `src/public/onboarding/models/identity-onboarding.model.ts`

## Complete Flow

See [Flow Diagram](flow-diagram.md) for detailed visual representation of the complete onboarding process.

## Onboarding Steps

The process consists of 8 sequential steps that must be completed in order:

### Step 1: [Start Onboarding](steps/01-start-onboarding.md)
Initialize the onboarding process and set user state.

**Endpoint:** `POST /api/public/onboarding/start`
**Auth:** Not required
**State:** Sets `onboardingState.step = 'email_validation'`

### Step 2: [Email Validation](steps/02-email-validation.md)
Send and verify a 6-digit code sent to user's email.

**Endpoints:**
- `POST /api/users/user/sendEmailValidation`
- `POST /api/users/user/verifyEmailCode`

**Auth:** Not required
**State:** Sets `emailVerifiedAt` timestamp

### Step 3: [Phone Validation](steps/03-phone-validation.md)
Send and verify a code sent via SMS to user's phone.

**Endpoints:**
- `POST /api/users/user/sendPhoneValidation`
- `POST /api/users/user/verifyPhoneCode`

**Auth:** Not required
**State:** Sets `phoneVerifiedAt` timestamp

### Step 4: [Password Creation](steps/04-password.md)
User creates and confirms their account password.

**Endpoint:** `POST /api/public/onboarding/password`
**Auth:** Not required (session-based)
**State:** Password hashed and saved

### Step 5: [Personal Data](steps/05-personal-data.md)
Collect user's personal information (name, birthdate, etc.).

**Endpoint:** `POST /api/public/onboarding/personal-data`
**Auth:** Required (JWT token)
**State:** Profile updated

### Step 6: [Liveness Verification](steps/06-liveness-verification.md)
Verify user is a real person through facial recognition.

**Endpoint:** `POST /api/public/onboarding/liveness`
**Auth:** Required
**State:** Sets `livenessVerifiedAt` timestamp

### Step 7: [Identity Onboarding](steps/07-identity-onboarding.md)
Collect and validate identity documents (CPF/CNPJ for Brazil, DNI for Argentina).

**Endpoint:** `POST /api/public/onboarding/identity`
**Auth:** Required
**State:** Creates identity record

### Step 8: [Document Upload](steps/08-document-upload.md)
Upload document images (front, back, selfie) for verification.

**Endpoint:** `POST /api/public/onboarding/documents`
**Auth:** Required
**State:** Sets `onboardingState.completed = true`

## State Management

### Onboarding State Object

```json
{
  "step": "email_validation",
  "completed": false,
  "completedAt": null,
  "emailValidated": false,
  "phoneValidated": false,
  "personalDataCompleted": false,
  "livenessCompleted": false,
  "identityCompleted": false,
  "documentsUploaded": false
}
```

### Step Progression

Each step updates the `onboardingState` object:
1. Validates current step completion
2. Updates relevant flags
3. Advances to next step
4. Persists state to database

## Country-Specific Flows

### Brazil
- Document: CPF (11 digits)
- Provider: Cronos for PIX integration
- Automatic account creation after backoffice approval

### Argentina
- Document: DNI with PDF417 barcode
- Provider: RENAPER for validation, Bind for CVU
- Facial validation with liveness photo

See [Country Implementations](country-implementations.md) for details.

## Validation Rules

### Email
- Must be valid email format
- Must be unique
- Code valid for 15 minutes

### Phone
- Must include country code
- Valid phone number format
- SMS code valid for 15 minutes

### Personal Data
- Name: min 2 characters
- Birthdate: user must be 18+
- Gender, marital status required

### Documents
- Supported formats: JPG, PNG, PDF
- Max file size: 5MB
- Required: front, back, selfie

## Testing

Comprehensive testing guides available:
- [Public Auth Testing](../../guides/testing-public-auth.md)
- [Testing Guide](../../guides/testing.md)

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "400 users.errors.invalidEmail",
  "message": "400 users.errors.invalidEmail",
  "code": 400
}
```

See [Error Codes](../error-codes.md) for complete list.

## Security

- Brute-force protection on validation endpoints
- Rate limiting (3 requests/minute)
- Secure code generation (6-digit random)
- Password hashing with bcrypt
- Document storage in encrypted S3 bucket

## Related Documentation

- [User Domain](../users/README.md)
- [Authentication Domain](../authentication/README.md)
- [User Registration Flow](../../flows/user-registration-flow.md)
- [Provider Features](../../operations/provider-features.md)
