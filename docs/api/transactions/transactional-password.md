# Transactional Password

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

4-digit transactional password system for securing financial operations. Required for confirming PIX transactions and other sensitive operations.

## Code References

**Controller:** `src/secure/transactional-password/controllers/transactional-password.controller.ts`
**Service:** `src/secure/transactional-password/services/transactional-password.service.ts`
**Model:** `src/secure/transactional-password/models/transactional-password.model.ts`

## Endpoints

### POST /transactional-password/create

Create a new 4-digit transactional password.

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
- `password` (string): 4-digit numeric password

#### Request Example

```json
{
  "password": "1234"
}
```

#### Success Response (200)

```json
{
  "message": "Transactional password created successfully",
  "code": "200 transactional.success.created"
}
```

#### Error Responses

**400 - Password Already Exists**
```json
{
  "error": "400 transactional.errors.passwordAlreadyExists",
  "message": "Transactional password already exists for this user",
  "code": 400
}
```

**400 - Invalid Format**
```json
{
  "error": "400 transactional.errors.invalidFormat",
  "message": "Password must be exactly 4 digits",
  "code": 400
}
```

#### Code Flow

```
TransactionalPasswordController.create()
  └─> TransactionalPasswordService.createPassword()
      ├─> TransactionalPasswordModel.hasPassword()  // Check if exists
      │   └─> prisma.users.findUnique()
      └─> TransactionalPasswordModel.create()
          └─> prisma.users.update()  // Hash with bcrypt
```

---

### POST /transactional-password/validate

Validate transactional password.

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
- `password` (string): 4-digit numeric password

#### Request Example

```json
{
  "password": "1234"
}
```

#### Success Response (200)

```json
{
  "valid": true,
  "message": "Password is valid",
  "code": "200 transactional.success.valid"
}
```

#### Error Responses

**400 - Invalid Password**
```json
{
  "valid": false,
  "error": "400 transactional.errors.invalidPassword",
  "message": "Invalid transactional password",
  "code": 400
}
```

**404 - Password Not Set**
```json
{
  "error": "404 transactional.errors.notFound",
  "message": "Transactional password not set",
  "code": 404
}
```

#### Code Flow

```
TransactionalPasswordController.validate()
  └─> TransactionalPasswordService.validatePassword()
      └─> TransactionalPasswordModel.validate()
          ├─> prisma.users.findUnique()  // Get hash
          └─> bcrypt.compare()  // Validate
```

---

### PUT /transactional-password/update

Update existing transactional password.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

**Required:**
- `currentPassword` (string): Current 4-digit password
- `newPassword` (string): New 4-digit password

#### Request Example

```json
{
  "currentPassword": "1234",
  "newPassword": "5678"
}
```

#### Success Response (200)

```json
{
  "message": "Transactional password updated successfully",
  "code": "200 transactional.success.updated"
}
```

#### Error Responses

**400 - Invalid Current Password**
```json
{
  "error": "400 transactional.errors.invalidCurrentPassword",
  "message": "Current password is incorrect",
  "code": 400
}
```

**400 - Same Password**
```json
{
  "error": "400 transactional.errors.samePassword",
  "message": "New password must be different from current",
  "code": 400
}
```

#### Code Flow

```
TransactionalPasswordController.update()
  └─> TransactionalPasswordService.updatePassword()
      ├─> TransactionalPasswordModel.validate()  // Verify current
      │   └─> bcrypt.compare()
      └─> TransactionalPasswordModel.update()
          └─> prisma.users.update()  // Hash new password
```

---

### GET /transactional-password/has-password

Check if user has transactional password set.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
```

#### Request Example

```bash
GET /transactional-password/has-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "hasPassword": true
}
```

#### Code Flow

```
TransactionalPasswordController.hasPassword()
  └─> TransactionalPasswordService.hasPassword()
      └─> TransactionalPasswordModel.hasPassword()
          └─> prisma.users.findUnique()
```

---

## Business Rules

1. **Password Format**: Exactly 4 numeric digits (0000-9999)
2. **One Per User**: Each user can only have one transactional password
3. **Hashing**: Password hashed with bcrypt (10 rounds)
4. **Required For**: PIX confirmations, sensitive operations
5. **Update Requires**: Current password validation
6. **No Sequential**: System prevents sequential numbers (1234, 4321)
7. **No Repeated**: System prevents repeated digits (1111, 2222)

## Security Features

- Password hashed with bcrypt (10 rounds)
- Rate limiting on validation (5 attempts/minute)
- Lockout after 3 failed attempts (15 minutes)
- Secure comparison (timing attack protection)
- Audit logging for all operations

## Error Codes

- `400 transactional.errors.passwordAlreadyExists` - Password already set
- `400 transactional.errors.invalidFormat` - Invalid password format
- `400 transactional.errors.invalidPassword` - Wrong password
- `400 transactional.errors.invalidCurrentPassword` - Wrong current password
- `400 transactional.errors.samePassword` - New same as current
- `404 transactional.errors.notFound` - Password not set
- `429 transactional.errors.tooManyAttempts` - Rate limit exceeded

## Usage in Transactions

When confirming PIX transactions:

```json
POST /transactions/pix/cronos/confirm
{
  "transactionId": "uuid",
  "transactionalPassword": "1234"
}
```

The system validates the transactional password before processing.

## Testing

### Manual Testing

```bash
# Create password
POST /transactional-password/create
{ "password": "1234" }

# Validate
POST /transactional-password/validate
{ "password": "1234" }

# Check exists
GET /transactional-password/has-password
```

### Automated Testing

```bash
npm run test:unit -- transactional-password.service.spec.ts
npm run test:e2e -- transactional-password.e2e-spec.ts
```

## Related Endpoints

- [PIX Cronos Transactions](pix-cronos.md)
- [Transaction Confirmation Flow](../flows/pix-transaction-flow.md)

## References

- [Transactions Domain Overview](README.md)
- [Security & Performance](../../operations/security-performance.md)
- [Error Codes](../error-codes.md)
