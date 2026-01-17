# API Documentation

**Status:** `stable`
**Last Updated:** 2026-01-16
**Owner:** Unex Development Team

## Overview

Comprehensive API reference organized by domains, resources, and complete end-to-end flows.

## Quick Navigation

### By Domain

- [Authentication](authentication/README.md) - User and backoffice authentication
- [Users](users/README.md) - Profile management and validation
- [Onboarding](onboarding/README.md) - KYC onboarding process
- [Transactions](transactions/README.md) - Financial operations
- [Notifications](notifications/README.md) - Push notifications
- [Backoffice](backoffice/README.md) - Administrative operations
- [Webhooks](webhooks/README.md) - External service callbacks

### By Flow

Complete end-to-end user journeys:

- [User Registration Flow](flows/user-registration-flow.md) - Signup to active account
- [PIX Transaction Flow](flows/pix-transaction-flow.md) - Create and confirm PIX transfer
- [Onboarding Flow Diagram](onboarding/flow-diagram.md) - Complete onboarding process

### Resources

- [Error Codes](error-codes.md) - Complete error code reference
- [CHANGELOG](CHANGELOG.md) - API changes history

## API Structure

### Authentication Domain

**Public Authentication:**
- `POST /api/users/user/signin` - [Login](authentication/public-login.md)
- `POST /api/users/user/signup` - [Signup](authentication/public-signup.md)

**Backoffice Authentication:**
- `POST /backoffice/auth/login` - [Backoffice Login](authentication/backoffice-login.md)
- `GET /backoffice/auth/me` - [Get Profile](authentication/backoffice-login.md#get-profile)

### Users Domain

**Profile Management:**
- `GET /api/users/user/me` - Get user profile
- `POST /api/users/user/profile` - Update profile
- `POST /api/users/user/address` - Update address

**Validation:**
- Email validation endpoints
- Phone validation endpoints
- Password management

### Onboarding Domain

**8-Step Process:**
1. `POST /api/public/onboarding/start` - [Start](onboarding/steps/01-start-onboarding.md)
2. Email validation - [Step 2](onboarding/steps/02-email-validation.md)
3. Phone validation - [Step 3](onboarding/steps/03-phone-validation.md)
4. Password creation - [Step 4](onboarding/steps/04-password.md)
5. Personal data - [Step 5](onboarding/steps/05-personal-data.md)
6. Liveness verification - [Step 6](onboarding/steps/06-liveness-verification.md)
7. Identity onboarding - [Step 7](onboarding/steps/07-identity-onboarding.md)
8. Document upload - [Step 8](onboarding/steps/08-document-upload.md)

See [Onboarding Overview](onboarding/README.md) for complete flow.

### Transactions Domain

**PIX Cronos:**
- `POST /transactions/pix/cronos/create` - Create PIX transaction
- `POST /transactions/pix/cronos/confirm` - Confirm transaction

**Billet Cronos:**
- `POST /transactions/billet/cronos/create` - Consult and create billet payment
- `POST /transactions/billet/cronos/confirm` - Confirm billet payment

**History:**
- `GET /transactions/history` - List transactions
- `GET /transactions/:id` - Get transaction details

See [Transactions Overview](transactions/README.md).

### Webhooks

**Cronos Webhooks:**
- `POST /api/cronos/webhook` - Receive transaction status updates

See [Webhooks Overview](webhooks/README.md).

### Notifications Domain

**Management:**
- `GET /notifications` - List notifications
- `PATCH /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification

**Push Notifications:**
- `POST /notifications/push-token` - Update token
- `GET /notifications/push-token` - Get token

See [Notifications Overview](notifications/README.md).

### Backoffice Domain

**Administrative Operations:**
- Client management
- User administration
- Onboarding approval
- System configuration

See [Backoffice Overview](backoffice/README.md).

## Authentication

### Public Endpoints

Most endpoints require JWT authentication:

```
Authorization: Bearer {token}
```

Obtain token via:
- `POST /api/users/user/signin` - Public login
- `POST /backoffice/auth/login` - Backoffice login

### No Authentication Required

- Health checks (`GET /`, `GET /health`)
- Signup endpoint
- Email/phone validation (initial steps)
- Start onboarding

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "401 users.errors.invalidCredentials",
  "message": "401 users.errors.invalidCredentials",
  "code": 401
}
```

See [Error Codes](error-codes.md) for complete reference.

## Rate Limiting

Rate limits by endpoint type:

- **Authentication**: 5 requests/minute
- **Validation**: 3 requests/minute
- **Transactions**: 10 requests/minute
- **General**: 100 requests/minute

## Testing

### Manual Testing

- [Public Auth Testing](../guides/testing-public-auth.md)
- [Backoffice Auth Testing](../guides/testing-backoffice-auth.md)
- [PIX Cronos Testing](../guides/testing-pix-cronos.md)
- [Cronos cURL Testing](../guides/testing-cronos-curl.md)

### Automated Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Specific test
npm run test:e2e -- auth.e2e-spec.ts
```

See [Testing Guide](../guides/testing.md).

## Environments

- **Development**: `http://localhost:3000`
- **Sandbox**: Staging environment with test data
- **Production**: Live environment

## Versioning

Current version: **v1.0**

API follows semantic versioning. Breaking changes will be communicated in advance with migration guides.

## Support

For issues or questions:
- Check [Error Codes](error-codes.md)
- Review domain-specific documentation
- Check [CHANGELOG](CHANGELOG.md) for recent changes

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Security & Performance](../operations/security-performance.md)
- [Provider Features](../operations/provider-features.md)
- [Module Example](../guides/module-example.md)
