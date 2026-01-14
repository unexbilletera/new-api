# User Identities & Accounts Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Management of user identities, accounts, balances, and messaging.

## Code References

**Controller:** `src/public/users/controllers/user.controller.ts`
**Services:**
- `src/public/users/services/identity.service.ts`
- `src/public/users/services/account.service.ts`
- `src/public/users/services/messaging.service.ts`
**Models:**
- `src/public/users/models/identity.model.ts`
- `src/public/users/models/account.model.ts`

## Endpoints

---

### GET /api/users/user/identities/:userId

List all user identities.

**Status:** `stable`
**Auth:** Required (JWT - must match userId)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Path Parameters

- `userId` (string): User identifier (must match authenticated user)

#### Success Response (200)

```json
{
  "identities": [
    {
      "id": "uuid-identity-1",
      "country": "BR",
      "taxDocumentNumber": "12345678900",
      "taxDocumentType": "CPF",
      "identityDocumentNumber": "MG1234567",
      "identityDocumentType": "RG",
      "status": "enable",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### POST /api/users/user/setDefaultUserIdentity/:id

Set identity as default for user.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Path Parameters

- `id` (string): Identity identifier

#### Success Response (200)

```json
{
  "message": "Default identity set successfully",
  "identityId": "uuid-identity-1"
}
```

---

### POST /api/users/user/setDefaultUserAccount/:id

Set account as default for user.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Path Parameters

- `id` (string): Account identifier

#### Success Response (200)

```json
{
  "message": "Default account set successfully",
  "accountId": "uuid-account-1"
}
```

---

### POST /api/users/user/setUserAccountAlias/:id

Set custom alias for account.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Path Parameters

- `id` (string): Account identifier

#### Request Body

```json
{
  "alias": "My Main Account"
}
```

#### Request Fields

- `alias` (string, required): Custom account alias (max 50 characters)

#### Success Response (200)

```json
{
  "message": "Account alias set successfully",
  "accountId": "uuid-account-1",
  "alias": "My Main Account"
}
```

---

### GET /api/users/user/balances

Get all account balances.

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
  "accounts": [
    {
      "id": "uuid-account-1",
      "type": "checking",
      "balance": "1500.50",
      "currency": "BRL",
      "alias": "My Main Account",
      "status": "active"
    },
    {
      "id": "uuid-account-2",
      "type": "savings",
      "balance": "5000.00",
      "currency": "BRL",
      "alias": "Savings",
      "status": "active"
    }
  ],
  "totalBalance": "6500.50",
  "currency": "BRL"
}
```

---

### GET /api/users/userAccountInfo/:id

Get detailed account information.

**Status:** `stable`
**Auth:** Not required (public)
**Last Tested:** 2026-01-14

#### Path Parameters

- `id` (string): Account identifier

#### Success Response (200)

```json
{
  "id": "uuid-account-1",
  "number": "123456789",
  "type": "checking",
  "status": "active",
  "cvu": "0000003100012345678901",
  "alias": "My Account",
  "balance": "1500.50",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

### GET /api/users/sailpointInfo/:id

Get Sailpoint information.

**Status:** `beta`
**Auth:** Not required (public)
**Last Tested:** 2026-01-14

#### Path Parameters

- `id` (string): Sailpoint identifier

#### Success Response (200)

```json
{
  "message": "Sailpoint info retrieved",
  "id": "sailpoint-123"
}
```

**Note:** This is a placeholder endpoint for future Sailpoint integration.

---

### POST /api/users/sendMessage

Send message through the system.

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
  "subject": "Support Request",
  "message": "I need help with my account",
  "category": "support",
  "priority": "normal"
}
```

#### Request Fields

- `subject` (string, required): Message subject
- `message` (string, required): Message content
- `category` (string, required): Message category
  - `support`
  - `feedback`
  - `complaint`
  - `suggestion`
- `priority` (string, optional): Priority level (default: normal)
  - `low`
  - `normal`
  - `high`
  - `urgent`

#### Success Response (200)

```json
{
  "message": "Message sent successfully",
  "ticketId": "TICKET-12345",
  "status": "pending",
  "createdAt": "2026-01-14T10:30:00.000Z"
}
```

---

## Business Rules

### Identities
1. **Multiple Identities**: Users can have identities from different countries
2. **Default Identity**: One identity marked as default
3. **Verification Required**: Identity must be verified before transactions
4. **Self-Access Only**: Users can only access their own identities

### Accounts
1. **Multiple Accounts**: Users can have multiple accounts (checking, savings, etc.)
2. **Default Account**: One account marked as default for transactions
3. **Custom Aliases**: Users can set friendly names for accounts
4. **Balance Privacy**: Balances only visible to account owner

### Messaging
1. **Authentication Required**: Must be logged in to send messages
2. **Message Tracking**: Each message assigned unique ticket ID
3. **Priority Routing**: Urgent messages escalated to support team
4. **Response SLA**: Support responds within 24 hours (normal priority)

---

## Security Considerations

### Identities
- User ID validation prevents access to other users' data
- Identity verification required for sensitive operations
- All identity access logged for audit

### Accounts
- Balance information encrypted in transit
- Account operations logged for security monitoring
- CVU/alias changes require authentication

### Messaging
- Messages sanitized to prevent XSS
- Rate limiting: Max 10 messages per hour
- Spam detection applied
- All messages logged with sender info

---

## Code Flow

### Get User Identities

```
IdentityService.getUserIdentities()
  └─> Check userId matches authenticated user
  └─> IdentityModel.findByUserId()
  └─> Return identity list
```

### Set Default Identity

```
IdentityService.setDefaultIdentity()
  └─> Verify identity belongs to user
  └─> UserModel.setDefaultIdentity()
  └─> Log default change event
```

### Get Account Balances

```
AccountService.getAccountBalances()
  └─> AccountModel.findByUserId()
  └─> Calculate total balance
  └─> Return account list with balances
```

### Send Message

```
MessagingService.sendMessage()
  └─> Validate message content
  └─> Sanitize input
  └─> Generate ticket ID
  └─> Store in message queue
  └─> Send notification to support
  └─> Return ticket confirmation
```

---

## Testing

### Test Cases

1. ✅ Get user identities - should return list
2. ✅ Get other user's identities - should return 403
3. ✅ Set default identity - should update default
4. ✅ Set account alias - should update alias
5. ✅ Get account balances - should return all accounts
6. ✅ Send message - should create ticket
7. ✅ Rate limiting - should return 429 after threshold

### Manual Testing

```bash
# Get identities
curl -X GET http://localhost:3000/api/users/user/identities/<userId> \
  -H "Authorization: Bearer <token>"

# Set default identity
curl -X POST http://localhost:3000/api/users/user/setDefaultUserIdentity/<identityId> \
  -H "Authorization: Bearer <token>"

# Get balances
curl -X GET http://localhost:3000/api/users/user/balances \
  -H "Authorization: Bearer <token>"

# Send message
curl -X POST http://localhost:3000/api/users/sendMessage \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Support Request",
    "message": "Need help",
    "category": "support"
  }'
```

---

## Error Codes

- `403 users.errors.forbidden` - Cannot access other user's data
- `404 users.errors.identityNotFound` - Identity not found
- `404 users.errors.accountNotFound` - Account not found
- `400 users.errors.invalidAlias` - Alias invalid (too long or empty)
- `429 users.errors.rateLimitExceeded` - Too many messages sent
- `401 users.errors.unauthorized` - Missing or invalid JWT

---

## References

- [User Profile](profile.md)
- [Account Management](account-management.md)
- [Onboarding](../onboarding/README.md)
- [Messaging System](../../integrations/messaging.md)

---

## Changelog

### 2026-01-14
- Added comprehensive documentation
- Documented all identity and account endpoints

### 2025-12-20
- Added messaging system
- Implemented ticket tracking

### 2025-11-10
- Added account alias feature
- Improved balance calculation
