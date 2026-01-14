# Step 6: Liveness Verification

## Overview

This step verifies that the user is a real person through liveness detection. The implementation supports two modes:

- **Valida Enabled**: Full Valida flow with biometric verification
- **Valida Disabled**: Simple photo upload verification

## Endpoints

### Simple Photo Upload (Valida Disabled)

```
PATCH /api/onboarding/user/:userId
```

### Full Valida Flow (Valida Enabled)

```
POST /api/users/user/liveness
```

## Authentication

- **Simple Photo Upload**: No authentication required (public endpoint)
- **Full Valida Flow**: Requires JWT Bearer token (obtained after completing previous steps)

## Simple Photo Upload (Valida Disabled)

### Request Body

```json
{
  "livenessImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Request Fields

| Field         | Type   | Required | Description                   |
| ------------- | ------ | -------- | ----------------------------- |
| livenessImage | string | Yes      | Base64-encoded image data URL |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User data updated successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingState": {
    "completedSteps": [
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6",
      "1.7",
      "1.8",
      "1.9",
      "1.10",
      "1.11",
      "1.12"
    ],
    "needsCorrection": []
  },
  "nextStep": "identityForm"
}
```

## Full Valida Flow (Valida Enabled)

### Request Body

```json
{
  "validaId": "valida_123456789",
  "refId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Request Fields

| Field    | Type   | Required | Description          |
| -------- | ------ | -------- | -------------------- |
| validaId | string | Yes      | Valida enrollment ID |
| refId    | string | Yes      | User reference ID    |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Liveness verification completed",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "next": "verifySuccess",
  "onboardingState": {
    "completedSteps": [
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6",
      "1.7",
      "1.8",
      "1.9",
      "1.10",
      "1.11",
      "1.12"
    ],
    "needsCorrection": []
  }
}
```

## Implementation Details

### Valida Disabled Mode

- User uploads a selfie image (base64-encoded)
- Image is stored in `livenessImage` field
- `livenessVerifiedAt` timestamp is set
- Email notification is sent to user
- Steps `1.11` and `1.12` are marked as completed

### Valida Enabled Mode

- User completes Valida enrollment process (external)
- System checks Valida enrollment status
- If enrollment is successful:
  - `livenessImage` is extracted from Valida response
  - `livenessVerifiedAt` timestamp is set
  - `validaId` is stored in user record
  - Steps `1.11` and `1.12` are marked as completed
  - User access is updated to `customer`

## State Management

After successful verification:

- `onboardingState.completedSteps` includes `"1.11"` and `"1.12"`
- `livenessVerifiedAt` is set to current timestamp
- `livenessImage` is stored (if available)
- Next step is identity onboarding

## Environment Configuration

```env
# Valida configuration
WALLET_VALIDA=enable
VALIDA_ENABLED=true
```

### Valida Disabled

When `VALIDA_ENABLED=false`:

- Simple photo upload is used
- No external service integration required
- Faster verification process

### Valida Enabled

When `VALIDA_ENABLED=true`:

- Full biometric verification via Valida
- More secure verification process
- Requires Valida enrollment completion

## Email Notification

When Valida is disabled and photo is uploaded:

- Email is sent to user with subject: "Selfie recebida"
- Message: "We received your selfie for proof-of-life verification."

## Next Steps

1. [Step 7: Identity Onboarding](./STEP-7-IDENTITY-ONBOARDING.md) - Start identity document validation

## Example cURL

### Simple Photo Upload (Valida Disabled)

```bash
curl -X PATCH https://api.example.com/api/onboarding/user/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "livenessImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

### Full Valida Flow (Valida Enabled)

```bash
curl -X POST https://api.example.com/api/users/user/liveness \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "validaId": "valida_123456789",
    "refId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## Notes

- Liveness verification is required before proceeding to identity onboarding
- Valida provides more secure biometric verification but requires external enrollment
- Simple photo upload is faster but less secure
- The verification method depends on `VALIDA_ENABLED` environment variable
