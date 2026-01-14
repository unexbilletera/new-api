# Security Token

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Generates security tokens for public operations that don't require user authentication but need request validation.

## Code References

**Controller:** `src/public/auth/controllers/auth.controller.ts` (SecurityController)
**Service:** `src/public/auth/services/token.service.ts`

## Endpoint

### POST /api/security/token

Generate a new security token for public operations.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Headers

```
Content-Type: application/json
```

#### Request Body

No body required.

#### Request Example

```bash
curl -X POST https://api.example.com/api/security/token \
  -H "Content-Type: application/json"
```

#### Success Response (200)

```json
{
  "token": "sec_1234567890abcdef",
  "expiresIn": 3600,
  "type": "Bearer"
}
```

#### Response Fields

- `token` (string): The generated security token
- `expiresIn` (number): Token expiration time in seconds
- `type` (string): Token type (always "Bearer")

---

## Business Rules

1. **Token Purpose**: Used for public API operations like health checks, app info, etc.
2. **Token Lifespan**: Tokens expire after 1 hour (3600 seconds)
3. **Rate Limiting**: Max 100 token requests per IP per hour
4. **No Authentication**: This endpoint doesn't require user authentication
5. **Single Use**: Tokens are not reusable after expiration

## Use Cases

### 1. Mobile App Initialization

When the mobile app starts, it requests a security token before any user login:

```javascript
// Mobile app startup
const { token } = await fetch('/api/security/token', {
  method: 'POST'
}).then(r => r.json());

// Use token for subsequent public requests
const appInfo = await fetch('/api/app-info', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json());
```

### 2. Public API Access

Accessing public information without user authentication:

```javascript
// Get security token
const { token } = await getSecurityToken();

// Access public endpoints
const campaigns = await fetch('/api/campaigns/public', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json());
```

---

## Security Considerations

- **Token Storage**: Store securely on client device
- **Token Refresh**: Request new token before expiration
- **HTTPS Only**: Always use HTTPS in production
- **IP Throttling**: Rate limiting applied per IP address
- **Token Validation**: All public endpoints validate token signature
- **Logging**: Token generation events are logged for security monitoring

---

## Error Responses

**429 - Rate Limit Exceeded**
```json
{
  "error": "429 security.errors.rateLimitExceeded",
  "message": "Too many token requests. Please try again later.",
  "code": 429
}
```

**500 - Token Generation Failed**
```json
{
  "error": "500 security.errors.tokenGenerationFailed",
  "message": "Failed to generate security token",
  "code": 500
}
```

---

## Code Flow

```
SecurityController.getToken()
  └─> TokenService.getToken()
      ├─> Generate random token
      ├─> Sign token with secret key
      ├─> Set expiration (1 hour)
      └─> Return token response
```

---

## Testing

### Test Cases

1. ✅ Generate token - should return valid token
2. ✅ Token format - should match expected pattern
3. ✅ Token expiration - should expire after 1 hour
4. ✅ Rate limiting - should return 429 after threshold
5. ✅ Use token on public endpoint - should succeed

### Manual Testing

```bash
# Generate security token
curl -X POST http://localhost:3000/api/security/token

# Use token to access public endpoint
curl -X GET http://localhost:3000/api/app-info \
  -H "Authorization: Bearer <token>"
```

### Automated Testing

```bash
npm run test:unit -- token.service.spec.ts
npm run test:e2e -- security.e2e-spec.ts
```

---

## Performance

- **Response Time**: < 50ms
- **Cache**: No caching (tokens are unique per request)
- **Throughput**: Supports 1000+ requests/second

---

## Error Codes

- `429 security.errors.rateLimitExceeded` - Too many token requests
- `500 security.errors.tokenGenerationFailed` - Internal error during token generation

---

## References

- [Public Authentication](public-login.md)
- [Public Signup](public-signup.md)
- [App Info Endpoints](../app-management/app-info.md)
- [Security Best Practices](../../operations/security-performance.md)

---

## Changelog

### 2026-01-14
- Added comprehensive documentation
- Documented rate limiting behavior

### 2025-12-01
- Initial implementation
- Basic token generation
