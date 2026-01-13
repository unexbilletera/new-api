# Step 4: Password Creation

## Overview

This step allows the user to create a password for their account. The password must be 6 digits (numeric only).

## Endpoint

```
PATCH /api/onboarding/user/:userId
```

## Authentication

No authentication required (public endpoint).

## Request Body

```json
{
  "password": "123456",
  "campaignCode": "PROMO2024"
}
```

### Request Fields

| Field        | Type   | Required | Description                              |
| ------------ | ------ | -------- | ---------------------------------------- |
| password     | string | Yes      | User password (must be exactly 6 digits) |
| campaignCode | string | No       | Optional campaign/referral code          |

### Validation Rules

- Password must be exactly 6 digits: `^\d{6}$`
- Password is hashed using bcrypt before storage
- Campaign code is optional and can be used for referral tracking

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User data updated successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingState": {
    "completedSteps": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"],
    "needsCorrection": []
  },
  "nextStep": "personalDataForm"
}
```

### Error Responses

#### 400 Bad Request - Invalid Password Format

```json
{
  "statusCode": 400,
  "message": "users.errors.invalidPassword",
  "error": "Bad Request"
}
```

#### 404 Not Found - User Not Found

```json
{
  "statusCode": 404,
  "message": "users.errors.userNotFound",
  "error": "Not Found"
}
```

## Implementation Details

- Password is hashed using bcrypt before storage
- `passwordUpdatedAt` timestamp is set
- User status remains `pending` until onboarding is complete
- Campaign code is processed if provided (referral tracking)
- Updates `onboardingState.completedSteps` to include `"1.7"`

## State Management

After successful password creation:

- `onboardingState.completedSteps` includes `"1.7"`
- `passwordUpdatedAt` is set to current timestamp
- Password hash is stored in database
- Next step is personal data collection

## Security Considerations

- Passwords are never stored in plain text
- Password hashing uses industry-standard bcrypt algorithm
- Password format is restricted to 6 digits for simplicity (can be changed if needed)

## Next Steps

1. [Step 5: Personal Data](./STEP-5-PERSONAL-DATA.md) - Provide personal information

## Example cURL

```bash
curl -X PATCH https://api.example.com/api/onboarding/user/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "password": "123456",
    "campaignCode": "PROMO2024"
  }'
```

## Notes

- Password must be exactly 6 numeric digits
- The password is used for authentication after onboarding completion
- Campaign codes are optional and used for referral tracking
