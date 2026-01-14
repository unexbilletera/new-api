# Test Authentication

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Test authentication endpoints for development and testing environments. NOT for production use.

## Code References

**Controller:** `src/public/auth/controllers/test-auth.controller.ts`

## Endpoints

### POST /test/auth/login

Test login endpoint for public users.

**Status:** `testing-only`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Body

\`\`\`json
{
  "email": "test@example.com",
  "password": "password123"
}
\`\`\`

#### Success Response (200)

\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test User"
  }
}
\`\`\`

### POST /test/auth/backoffice-login

Test login endpoint for backoffice users.

**Status:** `testing-only`
**Auth:** Not required

## References

- [Public Login](public-login.md)
- [Backoffice Login](backoffice-login.md)
