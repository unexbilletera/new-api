# Step 1: Start Onboarding

## Overview

This is the first step of the user onboarding process. It initiates the registration by creating a new user account with an email address.

## Endpoint

```
POST /api/onboarding/user/start
```

## Authentication

No authentication required (public endpoint).

## Request Body

```json
{
  "email": "user@example.com"
}
```

### Request Fields

| Field | Type   | Required | Description                                       |
| ----- | ------ | -------- | ------------------------------------------------- |
| email | string | Yes      | User's email address (must be valid email format) |

### Validation Rules

- Email must be valid email format
- Email must be unique (not already registered)
- Email is normalized to lowercase

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Onboarding started successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingState": {
    "completedSteps": ["1.1"],
    "needsCorrection": []
  },
  "nextStep": "emailForm"
}
```

### Error Responses

#### 400 Bad Request - Invalid Email Format

```json
{
  "statusCode": 400,
  "message": "users.errors.invalidEmail",
  "error": "Bad Request"
}
```

#### 409 Conflict - Email Already Registered

```json
{
  "statusCode": 409,
  "message": "users.errors.emailAlreadyInUse",
  "error": "Conflict"
}
```

## Implementation Details

- Creates a new user record with status `pending`
- Sets `access` to `user`
- Initializes `onboardingState` with `completedSteps: ["1.1"]`
- Generates a unique `userId` (UUID)
- Sets `username` to the part before `@` in the email

## State Management

After this step:

- `onboardingState.completedSteps` includes `"1.1"`
- User status is set to `pending`
- Next step is to send email validation code

## Next Steps

1. [Step 2: Email Validation](./STEP-2-EMAIL-VALIDATION.md) - Send and verify email validation code

## Example cURL

```bash
curl -X POST https://api.example.com/api/onboarding/user/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

## Notes

- The email address is used as the primary identifier for the user
- All emails are normalized to lowercase before storage
- The user must complete email validation before proceeding to the next step
