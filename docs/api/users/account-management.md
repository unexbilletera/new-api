# Account Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Account lifecycle management including closure, liveness verification, and onboarding status.

## Code References

**Controller:** `src/public/users/controllers/user.controller.ts`
**Services:**
- `src/public/users/services/account-closure.service.ts`
- `src/public/users/services/liveness.service.ts`
- `src/public/users/services/onboarding-status.service.ts`
**Model:** `src/public/users/models/user.model.ts`

## Endpoints

---

### POST /api/users/user/closeAccount

Request account closure.

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
  "reason": "no_longer_needed",
  "feedback": "Found better alternative",
  "password": "userPassword123"
}
```

#### Request Fields

- `reason` (string, required): Closure reason code
  - `no_longer_needed`
  - `switching_service`
  - `privacy_concerns`
  - `too_expensive`
  - `other`
- `feedback` (string, optional): Additional feedback
- `password` (string, required): Current password for verification

#### Success Response (200)

```json
{
  "message": "Account closure request submitted successfully",
  "status": "disable",
  "closureDate": "2026-01-21T00:00:00.000Z"
}
```

#### Error Responses

**400 - Invalid Password**
```json
{
  "error": "400 users.errors.invalidPassword",
  "message": "Password is incorrect",
  "code": 400
}
```

**400 - Pending Transactions**
```json
{
  "error": "400 users.errors.pendingTransactions",
  "message": "Cannot close account with pending transactions",
  "code": 400
}
```

**400 - Outstanding Balance**
```json
{
  "error": "400 users.errors.outstandingBalance",
  "message": "Account has outstanding balance",
  "code": 400
}
```

---

### POST /api/users/user/liveness

Perform liveness verification.

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
  "image": "base64_encoded_selfie_image",
  "validaId": "valida-enrollment-id"
}
```

#### Request Fields

- `image` (string, required): Base64 encoded selfie image
- `validaId` (string, optional): Valida enrollment ID if already enrolled

#### Success Response (200)

```json
{
  "message": "Liveness verification successful",
  "verified": true,
  "livenessVerifiedAt": "2026-01-14T10:30:00.000Z",
  "validaId": "valida-12345"
}
```

#### Error Responses

**400 - Verification Failed**
```json
{
  "error": "400 users.errors.livenessVerificationFailed",
  "message": "Liveness verification failed. Please try again.",
  "code": 400
}
```

**400 - Invalid Image**
```json
{
  "error": "400 users.errors.invalidImage",
  "message": "Invalid or corrupted image",
  "code": 400
}
```

---

### POST /api/users/user/onboarding/:step

Advance onboarding to specific step.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Path Parameters

- `step` (string): Onboarding step identifier
  - `email_verification`
  - `phone_verification`
  - `personal_info`
  - `identity_document`
  - `address`
  - `liveness_check`
  - `campaign_code`
  - `complete`

#### Success Response (200)

```json
{
  "message": "Onboarding step updated",
  "currentStep": "identity_document",
  "completedSteps": ["email_verification", "phone_verification", "personal_info"],
  "progress": 50
}
```

---

### POST /api/users/user/onboarding

Update overall onboarding status.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "message": "Onboarding status updated",
  "status": "in_progress",
  "currentStep": "identity_document",
  "completedSteps": ["email_verification", "phone_verification", "personal_info"],
  "progress": 50,
  "onboardingState": {
    "emailVerified": true,
    "phoneVerified": true,
    "personalInfoCompleted": true,
    "identityDocumentCompleted": false
  }
}
```

---

## Account Closure Flow

```
1. User requests account closure
   POST /user/closeAccount
   └─> Verify password
   └─> Check pending transactions
   └─> Check outstanding balances
   └─> Set status to 'disable'
   └─> Schedule data deletion (7 days)
   └─> Send confirmation email
   └─> Log closure request

2. Grace Period (7 days)
   └─> User can reactivate account
   └─> All services remain accessible (read-only)

3. Final Deletion (after 7 days)
   └─> Soft delete user data
   └─> Anonymize transactions
   └─> Clear personal information
```

---

## Business Rules

### Account Closure
1. **Password Required**: Must verify password before closure
2. **Pending Checks**: No pending transactions or outstanding balances
3. **Grace Period**: 7-day grace period before final deletion
4. **Data Retention**: Transaction history anonymized, not deleted
5. **Reactivation**: Account can be reactivated within grace period
6. **Notification**: Confirmation email sent to user

### Liveness Verification
1. **Image Requirements**: Clear selfie, face visible, good lighting
2. **Valida Integration**: Uses Valida service for verification
3. **One-Time Enrollment**: Valida enrollment done on first verification
4. **Verification Status**: Sets livenessVerifiedAt timestamp
5. **Retry Limit**: Max 3 attempts per day

### Onboarding
1. **Sequential Steps**: Steps must be completed in order
2. **State Tracking**: Progress tracked in onboardingState
3. **Validation**: Each step validated before advancing
4. **Completion**: All steps required for full account activation

---

## Security Considerations

### Account Closure
- Password verification required
- All sessions invalidated immediately
- Closure events logged with IP and timestamp
- Data deletion follows GDPR requirements
- Grace period allows recovery from accidental closure

### Liveness
- Images encrypted in transit and at rest
- Valida service used for secure verification
- Failed attempts logged for security monitoring
- Daily retry limit prevents abuse

---

## Code Flow

### Close Account

```
AccountClosureService.closeAccount()
  └─> Verify password
  └─> Check pending transactions
  └─> Check account balances
  └─> UserModel.closeAccount()
      ├─> Set status = 'disable'
      ├─> Clear accessToken
      ├─> Clear unlockToken
      └─> Update closureDate
  └─> Schedule deletion job (7 days)
  └─> EmailService.sendClosureConfirmation()
  └─> Log closure event
```

### Liveness Check

```
LivenessService.livenessCheck()
  └─> Decode base64 image
  └─> Validate image format
  └─> If no validaId:
      └─> ValidaService.enroll(image)
      └─> Store validaId
  └─> ValidaService.verify(validaId, image)
  └─> If verified:
      └─> UserModel.updateLivenessSimple()
          ├─> Set livenessImage
          ├─> Set livenessVerifiedAt
          └─> Update onboardingState
```

---

## Testing

### Test Cases

1. ✅ Close account with valid password - should succeed
2. ✅ Close account with invalid password - should return 400
3. ✅ Close account with pending transactions - should return 400
4. ✅ Liveness verification with valid image - should succeed
5. ✅ Liveness verification with invalid image - should return 400
6. ✅ Onboarding step advancement - should update progress
7. ✅ Complete onboarding flow - should activate account

### Manual Testing

```bash
# Close account
curl -X POST http://localhost:3000/api/users/user/closeAccount \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "no_longer_needed",
    "password": "userPassword123"
  }'

# Liveness check
curl -X POST http://localhost:3000/api/users/user/liveness \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_image_data"
  }'

# Update onboarding step
curl -X POST http://localhost:3000/api/users/user/onboarding/liveness_check \
  -H "Authorization: Bearer <token>"
```

---

## Error Codes

- `400 users.errors.invalidPassword` - Password incorrect
- `400 users.errors.pendingTransactions` - Pending transactions exist
- `400 users.errors.outstandingBalance` - Outstanding balance exists
- `400 users.errors.livenessVerificationFailed` - Liveness check failed
- `400 users.errors.invalidImage` - Image invalid or corrupted
- `401 users.errors.unauthorized` - Missing or invalid JWT

---

## References

- [User Profile](profile.md)
- [Onboarding Flow](../onboarding/README.md)
- [Password Management](password-session.md)
- [Valida Integration](../../integrations/valida.md)
- [GDPR Compliance](../../operations/gdpr-compliance.md)

---

## Changelog

### 2026-01-14
- Added comprehensive documentation
- Documented closure grace period

### 2025-12-05
- Implemented Valida liveness verification
- Added onboarding step tracking
