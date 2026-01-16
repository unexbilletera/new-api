# Terms and Conditions Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Manages user acceptance of terms and conditions for various services. Tracks acceptance history, validates requirements, and ensures compliance with service-specific terms.

## Code References

**Controller:** `src/secure/terms/controllers/terms.controller.ts`
**Service:** `src/secure/terms/services/terms.service.ts`
**Database Table:** `user_term_acceptances`

## Service Types

```typescript
enum ServiceType {
  MANTECA_PIX = 'manteca_pix',
  MANTECA_EXCHANGE = 'manteca_exchange',
  GENERAL = 'general',
  PRIVACY_POLICY = 'privacy_policy'
}
```

## Endpoints

### GET /terms/:serviceType

Check if user has accepted terms for a specific service.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceType` | ServiceType | Yes | Service type enum value |

#### Request Example

```bash
GET /terms/manteca_pix
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

**When Accepted:**
```json
{
  "accepted": true,
  "serviceType": "manteca_pix",
  "acceptedAt": "2026-01-14T10:00:00.000Z"
}
```

**When Not Accepted:**
```json
{
  "accepted": false,
  "serviceType": "manteca_pix"
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "error": "401 auth.errors.unauthorized",
  "message": "Invalid or missing token",
  "code": 401
}
```

**404 - Service Not Found**
```json
{
  "error": "404 terms.errors.serviceNotFound",
  "message": "Service type not found",
  "code": 404
}
```

#### Code Flow

```
TermsController.check()
  └─> TermsService.check()
      └─> prisma.user_term_acceptances.findFirst()
          └─> Filter by userId, serviceType, latest acceptance
```

---

### POST /terms/accept

Accept terms and conditions for a service.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

**Required:**
- `serviceType` (ServiceType): Service type to accept terms for

#### Request Example

```bash
POST /terms/accept
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "serviceType": "manteca_pix"
}
```

#### Success Response (200)

**First Time Acceptance:**
```json
{
  "success": true,
  "message": "Term accepted successfully",
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "serviceType": "manteca_pix",
    "acceptedAt": "2026-01-14T10:00:00.000Z",
    "ipAddress": "192.168.1.1"
  }
}
```

**Already Accepted:**
```json
{
  "success": true,
  "message": "Term already accepted previously",
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "serviceType": "manteca_pix",
    "acceptedAt": "2026-01-13T10:00:00.000Z",
    "ipAddress": "192.168.1.1"
  }
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "error": "401 auth.errors.unauthorized",
  "message": "Invalid or missing token",
  "code": 401
}
```

#### Code Flow

```
TermsController.accept()
  └─> TermsService.accept()
      ├─> prisma.user_term_acceptances.findFirst()  // Check existing
      └─> prisma.user_term_acceptances.create()  // Create if new
          └─> Store userId, serviceType, acceptedAt, ipAddress
```

---

### GET /terms/acceptances/list

List all terms accepted by the user.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
```

#### Request Example

```bash
GET /terms/acceptances/list
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
[
  {
    "id": "uuid-1",
    "userId": "user-uuid",
    "serviceType": "manteca_pix",
    "acceptedAt": "2026-01-14T10:00:00.000Z",
    "ipAddress": "192.168.1.1"
  },
  {
    "id": "uuid-2",
    "userId": "user-uuid",
    "serviceType": "manteca_exchange",
    "acceptedAt": "2026-01-13T15:30:00.000Z",
    "ipAddress": "192.168.1.1"
  }
]
```

#### Code Flow

```
TermsController.listAcceptances()
  └─> TermsService.listAcceptances()
      └─> prisma.user_term_acceptances.findMany()
          └─> Order by acceptedAt DESC
```

---

### GET /terms/required/check

Check if user has accepted all required system terms.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
```

#### Request Example

```bash
GET /terms/required/check
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

**All Accepted:**
```json
{
  "allAccepted": true,
  "missing": [],
  "accepted": [
    "manteca_pix",
    "manteca_exchange"
  ]
}
```

**Missing Some:**
```json
{
  "allAccepted": false,
  "missing": [
    "manteca_exchange"
  ],
  "accepted": [
    "manteca_pix"
  ]
}
```

#### Code Flow

```
TermsController.checkRequired()
  └─> TermsService.checkAllRequired()
      ├─> Define requiredTerms = [MANTECA_PIX, MANTECA_EXCHANGE]
      ├─> prisma.user_term_acceptances.findMany()
      └─> Compare accepted vs required
```

---

## Business Rules

1. **IP Tracking**: IP address recorded for legal compliance
2. **Idempotent Acceptance**: Accepting same terms multiple times is allowed
3. **Latest Record**: Most recent acceptance is used for verification
4. **Required Terms**: System defines which terms are mandatory
5. **Service-Specific**: Each service has independent terms
6. **Audit Trail**: All acceptances are permanently recorded
7. **No Deletion**: Acceptances cannot be deleted (audit requirement)

## Required Terms

Currently required terms for full system access:
- `manteca_pix` - PIX transaction terms
- `manteca_exchange` - Currency exchange terms

## IP Address Tracking

IP address is extracted from:
1. Direct request IP: `req.ip`
2. Proxy headers: `x-forwarded-for`

This is required for:
- Legal compliance
- Audit trails
- Dispute resolution

## Use Cases

### First-Time User Flow

```
1. User creates account
2. System checks: GET /terms/required/check
3. Response: { allAccepted: false, missing: [...] }
4. User accepts each term: POST /terms/accept
5. System verifies: GET /terms/required/check
6. Response: { allAccepted: true }
7. User gains full access
```

### Service-Specific Access

```
1. User attempts PIX transfer
2. System checks: GET /terms/manteca_pix
3. If not accepted, prompt user
4. User accepts: POST /terms/accept
5. Transfer proceeds
```

### Compliance Audit

```
1. Audit request for user acceptances
2. System retrieves: GET /terms/acceptances/list
3. Returns all acceptances with timestamps and IPs
4. Provides complete audit trail
```

## Error Codes

- `401 auth.errors.unauthorized` - Invalid or missing token
- `404 terms.errors.serviceNotFound` - Invalid service type

## Testing

### Manual Testing

```bash
# Check specific term
curl -X GET http://localhost:3000/terms/manteca_pix \
  -H "Authorization: Bearer TOKEN"

# Accept terms
curl -X POST http://localhost:3000/terms/accept \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "manteca_pix"}'

# List all acceptances
curl -X GET http://localhost:3000/terms/acceptances/list \
  -H "Authorization: Bearer TOKEN"

# Check required terms
curl -X GET http://localhost:3000/terms/required/check \
  -H "Authorization: Bearer TOKEN"
```

### Automated Testing

```bash
npm run test:unit -- terms.service.spec.ts
npm run test:e2e -- terms.e2e-spec.ts
```

## Database Schema

```sql
CREATE TABLE user_term_acceptances (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  serviceType VARCHAR(50) NOT NULL,
  acceptedAt DATETIME NOT NULL,
  ipAddress VARCHAR(45),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_service (userId, serviceType),
  INDEX idx_accepted_at (acceptedAt),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Security Considerations

1. **JWT Required**: All endpoints require valid authentication
2. **User Isolation**: Users can only see their own acceptances
3. **IP Logging**: All acceptances logged with IP for security
4. **Immutable Records**: Acceptances cannot be modified or deleted
5. **Audit Trail**: Complete history maintained for compliance

## Related Endpoints

- [App Info](app-info.md)
- [User Profile](../users/profile.md)
- [Authentication](../authentication/public-login.md)

## References

- [App Management Domain Overview](README.md)
- [Legal Compliance](../../operations/legal-compliance.md)
- [Data Privacy](../../operations/data-privacy.md)
