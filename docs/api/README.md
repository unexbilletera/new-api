# API Documentation

This section contains comprehensive API reference documentation for all endpoints.

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoint Categories

### [Public - No Authentication Required](public-no-auth.md)

Public endpoints accessible without authentication:

- Health checks and system status
- User authentication and registration
- Email and phone validation
- Password recovery
- Initial onboarding flow
- Test endpoints

### [Public - Authentication Required](public-auth.md)

Public endpoints that require user authentication:

- User profile management
- Account management
- Identity onboarding
- Biometric registration
- Device management
- Identity and account information

### [Secure - Authentication Required](secure-auth.md)

Secure endpoints for authenticated users:

- Push notifications
- App actions and modules
- App information and news
- Campaign codes
- Terms of service acceptance
- PIX transactions

### [Backoffice - Authentication Required](backoffice-auth.md)

Administrative endpoints for backoffice users:

- Backoffice authentication
- Client management
- User onboarding approval
- Action and service management
- System configuration
- User and role management

## Onboarding Process

The user registration flow follows a multi-step onboarding process:

- [Onboarding Documentation](onboarding/)

## Error Handling

All endpoints follow a standard error response format. See [Error Codes](error-codes.md) for complete reference.

### Error Response Format

```json
{
  "error": "401 users.errors.invalidCredentials",
  "message": "401 users.errors.invalidCredentials",
  "code": 401
}
```

### Success Response Format

```json
{
  "data": { ... },
  "message": "200 users.success.operationComplete",
  "code": "200 users.success.operationComplete"
}
```

## Rate Limiting

Authentication endpoints have rate limiting enabled to prevent abuse:

- Login: 5 requests per minute
- Registration: 3 requests per minute
- Password reset: 3 requests per hour

## API Versioning

Currently, the API does not use versioning. Breaking changes will be communicated in advance and migration guides provided.

## Testing

Use the `/api/public/test` endpoints for development and testing without affecting production data.

## References

- [Architecture Overview](../architecture/overview.md)
- [Error Codes](error-codes.md)
- [Authentication Guide](../guides/authentication.md)
