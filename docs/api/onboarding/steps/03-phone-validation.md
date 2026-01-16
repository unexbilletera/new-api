# Step 3: Phone Validation

## Overview

This step involves sending a validation code to the user's phone number via SMS and verifying it to confirm phone ownership. This step consists of two sub-steps:

- **Step 1.4**: Provide phone number
- **Step 1.5**: Send phone validation code
- **Step 1.6**: Verify phone validation code

## Endpoints

### Update User Phone Number

```
PATCH /api/onboarding/user/:userId
```

### Send Phone Validation Code

```
POST /api/onboarding/user/send-phone-validation
```

### Verify Phone Validation Code

```
POST /api/onboarding/user/verify-code
```

## Authentication

No authentication required (public endpoints).

## Update User Phone Number

### Request Body

```json
{
  "phone": "+5511987654321"
}
```

### Request Fields

| Field | Type   | Required | Description                                      |
| ----- | ------ | -------- | ------------------------------------------------ |
| phone | string | Yes      | User's phone number (must be valid phone format) |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User data updated successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingState": {
    "completedSteps": ["1.1", "1.2", "1.3", "1.4"],
    "needsCorrection": []
  },
  "nextStep": "phoneForm"
}
```

## Send Phone Validation Code

### Request Body

```json
{
  "phone": "+5511987654321"
}
```

### Request Fields

| Field | Type   | Required | Description         |
| ----- | ------ | -------- | ------------------- |
| phone | string | Yes      | User's phone number |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Validation SMS sent successfully"
}
```

#### Error Responses

**400 Bad Request - Invalid Phone Number**

```json
{
  "statusCode": 400,
  "message": "users.errors.invalidPhone",
  "error": "Bad Request"
}
```

## Verify Phone Validation Code

### Request Body

```json
{
  "email": "user@example.com",
  "phone": "+5511987654321",
  "code": "123456",
  "type": "phone"
}
```

### Request Fields

| Field | Type   | Required | Description                      |
| ----- | ------ | -------- | -------------------------------- |
| email | string | Yes      | User's email address             |
| phone | string | Yes      | User's phone number              |
| code  | string | Yes      | Validation code received via SMS |
| type  | string | Yes      | Must be `"phone"`                |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Code verified successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingState": {
    "completedSteps": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"],
    "needsCorrection": []
  },
  "nextStep": "passwordForm"
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

### Phone Number Normalization

- Non-digit characters are removed
- Phone numbers are validated according to country format
- For Brazil, phone must match Brazilian phone format

### Send Phone Validation Code

- Generates a 6-digit validation code
- Sends SMS with validation code (unless `WALLET_SANDBOX_SEND_SMS=false`)
- Stores code hash in database with expiration time
- In sandbox mode with `ENABLE_MOCK_CODES=true`, accepts mock codes

### Verify Phone Validation Code

- Validates the code against stored hash
- Checks code expiration
- Marks phone as verified (`phoneVerifiedAt` timestamp)
- Updates `onboardingState.completedSteps` to include `"1.4"`, `"1.5"`, and `"1.6"`

## State Management

After successful verification:

- `onboardingState.completedSteps` includes `"1.4"`, `"1.5"`, and `"1.6"`
- `phoneVerifiedAt` is set to current timestamp
- User's phone number is stored
- Next step is password creation

## Mock Codes

When `ENABLE_MOCK_CODES=true`:

- Phone validation can be bypassed with mock codes
- See [Mock Codes Documentation](../PROVIDER_FEATURES.md) for details

## Environment Configuration

```env
# Enable mock codes (bypasses real validation)
ENABLE_MOCK_CODES=false

# Sandbox flags
WALLET_SANDBOX_SEND_SMS=true
```

## Next Steps

1. [Step 4: Password Creation](./STEP-4-PASSWORD.md) - Create user password

## Example cURL

### Update Phone Number

```bash
curl -X PATCH https://api.example.com/api/onboarding/user/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511987654321"
  }'
```

### Send Phone Validation Code

```bash
curl -X POST https://api.example.com/api/onboarding/user/send-phone-validation \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511987654321"
  }'
```

### Verify Phone Validation Code

```bash
curl -X POST https://api.example.com/api/onboarding/user/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+5511987654321",
    "code": "123456",
    "type": "phone"
  }'
```

## Notes

- Phone numbers are normalized (non-digit characters removed)
- Validation codes expire after a set time (typically 10-15 minutes)
- Codes are hashed before storage for security
- Phone verification is required before proceeding to password creation
