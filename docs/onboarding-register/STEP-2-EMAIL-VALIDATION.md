# Step 2: Email Validation

## Overview

This step involves sending a validation code to the user's email and verifying it to confirm email ownership. This step consists of two sub-steps:
- **Step 1.2**: Send email validation code
- **Step 1.3**: Verify email validation code

## Endpoints

### Send Email Validation Code

```
POST /api/onboarding/user/send-email-validation
```

### Verify Email Validation Code

```
POST /api/onboarding/user/verify-code
```

## Authentication

No authentication required (public endpoints).

## Send Email Validation Code

### Request Body

```json
{
  "email": "user@example.com"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Validation email sent successfully"
}
```

#### Error Responses

**400 Bad Request - Invalid Email**
```json
{
  "statusCode": 400,
  "message": "users.errors.invalidEmail",
  "error": "Bad Request"
}
```

**400 Bad Request - Email Already Registered**
```json
{
  "statusCode": 400,
  "message": "users.errors.emailAlreadyInUse",
  "error": "Bad Request"
}
```

## Verify Email Validation Code

### Request Body

```json
{
  "email": "user@example.com",
  "code": "123456",
  "type": "email"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| code | string | Yes | Validation code received via email |
| type | string | Yes | Must be `"email"` |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Code verified successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingState": {
    "completedSteps": ["1.1", "1.2", "1.3"],
    "needsCorrection": []
  },
  "nextStep": "phoneForm"
}
```

#### Error Responses

**400 Bad Request - Code Not Found or Expired**
```json
{
  "statusCode": 400,
  "message": "users.errors.codeNotFoundOrExpired",
  "error": "Bad Request"
}
```

**400 Bad Request - Invalid Code**
```json
{
  "statusCode": 400,
  "message": "users.errors.invalidCode",
  "error": "Bad Request"
}
```

## Implementation Details

### Send Email Validation Code
- Generates a 6-digit validation code
- Sends email with validation code (unless `WALLET_SANDBOX_SEND_MAIL=false`)
- Stores code hash in database with expiration time
- In sandbox mode with `ENABLE_MOCK_CODES=true`, accepts mock codes

### Verify Email Validation Code
- Validates the code against stored hash
- Checks code expiration
- Marks email as verified (`emailVerifiedAt` timestamp)
- Updates `onboardingState.completedSteps` to include `"1.2"` and `"1.3"`

## State Management

After successful verification:
- `onboardingState.completedSteps` includes `"1.2"` and `"1.3"`
- `emailVerifiedAt` is set to current timestamp
- Next step is phone validation

## Mock Codes

When `ENABLE_MOCK_CODES=true`:
- Email validation can be bypassed with mock codes
- See [Mock Codes Documentation](../PROVIDER_FEATURES.md) for details

## Environment Configuration

```env
# Enable mock codes (bypasses real validation)
ENABLE_MOCK_CODES=false

# Sandbox flags
WALLET_SANDBOX_SEND_MAIL=true
```

## Next Steps

1. [Step 3: Phone Validation](./STEP-3-PHONE-VALIDATION.md) - Send and verify phone validation code

## Example cURL

### Send Email Validation Code
```bash
curl -X POST https://api.example.com/api/onboarding/user/send-email-validation \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Verify Email Validation Code
```bash
curl -X POST https://api.example.com/api/onboarding/user/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "type": "email"
  }'
```

## Notes

- Validation codes expire after a set time (typically 10-15 minutes)
- Codes are hashed before storage for security
- Email verification is required before proceeding to phone validation
