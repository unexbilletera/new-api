# Backoffice Onboarding Approval

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Backoffice onboarding approval and management. Review and approve/reject user onboarding submissions.

## Code References

**Controller:** `src/backoffice/onboarding/controllers/onboarding.controller.ts`
**Service:** `src/backoffice/onboarding/services/onboarding.service.ts`

## Endpoints

### GET /backoffice/onboarding/users

List users in onboarding process.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 1)
**Last Tested:** 2026-01-14

#### Query Parameters

- `status` (string, optional): Filter by onboarding status
- `country` (string, optional): Filter by country
- `search` (string, optional): Search by name or email
- `page`, `limit` (number, optional): Pagination

#### Success Response (200)

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "User Name",
      "email": "user@example.com",
      "country": "BR",
      "onboardingStatus": "pending_approval",
      "submittedAt": "2026-01-14T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

---

### GET /backoffice/onboarding/pending

List users pending approval.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 1)

#### Success Response (200)

```json
{
  "pendingUsers": [...],
  "count": 15
}
```

---

### GET /backoffice/onboarding/users/:id

Get user onboarding details.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 1)

#### Path Parameters

- `id` (string): User identifier

#### Success Response (200)

```json
{
  "id": "uuid",
  "name": "User Name",
  "email": "user@example.com",
  "phone": "+5511999999999",
  "identity": {
    "documentType": "CPF",
    "documentNumber": "12345678900",
    "frontImage": "https://...",
    "backImage": "https://...",
    "selfieImage": "https://..."
  },
  "onboardingState": {...},
  "submittedAt": "2026-01-14T10:00:00.000Z"
}
```

---

### PATCH /backoffice/onboarding/users/:id

Update user information during review.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `id` (string): User identifier

#### Request Body

```json
{
  "name": "Corrected Name",
  "phone": "+5511999999999"
}
```

---

### POST /backoffice/onboarding/users/:id/approve

Approve user onboarding.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `id` (string): User identifier

#### Request Body

```json
{
  "notes": "All documents verified successfully"
}
```

#### Success Response (200)

```json
{
  "message": "User approved successfully",
  "userId": "uuid"
}
```

---

### POST /backoffice/onboarding/users/:id/reject

Reject user onboarding.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `id` (string): User identifier

#### Request Body

```json
{
  "reason": "Documents are not clear",
  "details": "Please resubmit clearer photos"
}
```

#### Success Response (200)

```json
{
  "message": "User rejected successfully",
  "userId": "uuid"
}
```

---

### POST /backoffice/onboarding/users/:id/request-correction

Request information correction from user.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `id` (string): User identifier

#### Request Body

```json
{
  "fields": ["documentFront", "documentBack"],
  "message": "Please resubmit document photos with better lighting"
}
```

#### Success Response (200)

```json
{
  "message": "Correction requested successfully",
  "userId": "uuid"
}
```

---

## Business Rules

1. **Access Levels**: MinLevel 1 to view, MinLevel 2 to approve/reject
2. **Approval Process**: User must complete all onboarding steps before approval
3. **Account Creation**: Upon approval, user account is fully activated
4. **Notifications**: User receives notification of approval/rejection status
5. **Audit Trail**: All approval/rejection actions are logged

## Onboarding Statuses

| Status | Description |
|--------|-------------|
| `pending_approval` | Awaiting backoffice review |
| `approved` | Approved by backoffice |
| `rejected` | Rejected by backoffice |
| `correction_requested` | Corrections requested from user |

## Error Codes

- `400 onboarding.errors.invalidStatus` - User not in correct status for operation
- `401 backoffice.errors.unauthorized` - Invalid or missing token
- `403 backoffice.errors.insufficientLevel` - Insufficient access level
- `404 onboarding.errors.userNotFound` - User not found

## References

- [Backoffice Domain](README.md)
- [Onboarding Flow](../onboarding/README.md)
- [Client Management](clients.md)
