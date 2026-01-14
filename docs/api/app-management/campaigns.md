# Campaigns

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Campaign code validation and redemption system. Users can validate and apply promotional campaign codes for rewards and benefits.

## Code References

**Controller:** `src/secure/campaigns/controllers/campaigns.controller.ts`
**Service:** `src/secure/campaigns/services/campaigns.service.ts`

## Endpoints

### GET /campaigns/validate/:code

Validate campaign code via URL parameter.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

\`\`\`
Authorization: Bearer {token}
\`\`\`

#### Path Parameters

- \`code\` (string): Campaign code to validate

#### Request Example

\`\`\`bash
GET /campaigns/validate/WELCOME2026
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

#### Success Response (200)

\`\`\`json
{
  "valid": true,
  "code": "WELCOME2026",
  "description": "Welcome bonus campaign",
  "reward": "10% bonus on first deposit"
}
\`\`\`

#### Error Responses

**400 - Invalid Code**
\`\`\`json
{
  "error": "400 campaigns.errors.invalidCode",
  "message": "Campaign code is invalid or expired",
  "code": 400
}
\`\`\`

#### Code Flow

\`\`\`
CampaignsController.validateByParam()
  └─> CampaignsService.validateCode()
      └─> prisma.campaigns.findUnique()
\`\`\`

---

### POST /campaigns/validate

Validate campaign code via request body.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Request Body

**Required:**
- \`code\` (string): Campaign code

#### Request Example

\`\`\`json
{
  "code": "WELCOME2026"
}
\`\`\`

#### Success Response (200)

\`\`\`json
{
  "valid": true,
  "code": "WELCOME2026",
  "description": "Welcome bonus campaign"
}
\`\`\`

---

### POST /campaigns/use

Apply and activate campaign code for user.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Request Body

**Required:**
- \`code\` (string): Campaign code to apply

#### Request Example

\`\`\`json
{
  "code": "WELCOME2026"
}
\`\`\`

#### Success Response (200)

\`\`\`json
{
  "message": "Campaign applied successfully",
  "code": "200 campaigns.success.applied",
  "campaignId": "uuid",
  "reward": "10% bonus on first deposit"
}
\`\`\`

#### Error Responses

**400 - Already Used**
\`\`\`json
{
  "error": "400 campaigns.errors.alreadyUsed",
  "message": "Campaign code already used",
  "code": 400
}
\`\`\`

---

### GET /campaigns/my

List user's applied campaigns.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Request Example

\`\`\`bash
GET /campaigns/my
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

#### Success Response (200)

\`\`\`json
{
  "campaigns": [
    {
      "id": "uuid",
      "code": "WELCOME2026",
      "description": "Welcome bonus",
      "appliedAt": "2026-01-14T10:00:00.000Z"
    }
  ]
}
\`\`\`

---

## Business Rules

1. **Single Use**: Each campaign code can only be used once per user
2. **Validation**: Code must be active and within valid date range
3. **Authentication**: JWT token required for all endpoints

## Error Codes

- \`400 campaigns.errors.invalidCode\` - Invalid or expired code
- \`400 campaigns.errors.alreadyUsed\` - Code already used by user
- \`401 auth.errors.unauthorized\` - Invalid or missing token

## Testing

### Manual Testing

\`\`\`bash
# Validate code
curl -X GET http://localhost:3000/campaigns/validate/WELCOME2026 \\
  -H "Authorization: Bearer TOKEN"

# Apply code
curl -X POST http://localhost:3000/campaigns/use \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"code": "WELCOME2026"}'

# List my campaigns
curl -X GET http://localhost:3000/campaigns/my \\
  -H "Authorization: Bearer TOKEN"
\`\`\`

## References

- [App Management Domain](README.md)
- [User Profile](../users/profile.md)
