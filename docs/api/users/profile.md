# User Profile Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Complete user profile management including profile updates, address management, and account settings.

## Code References

**Controller:** `src/public/users/controllers/user.controller.ts`
**Services:**
- `src/public/users/services/user-profile.service.ts`
- `src/public/users/services/email-change.service.ts`
- `src/public/users/services/password.service.ts`

**Models:**
- `src/public/users/models/user.model.ts`
- `src/public/users/models/user-profile.model.ts`

## Endpoints

### GET /api/users/user/me

Get current authenticated user profile.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
```

#### Query Parameters

**Optional:**
- `systemVersion` (string): Client system version
- `include` (string): Include additional data
  - `rates`: Include exchange rates

#### Request Example

```bash
GET /api/users/user/me?include=rates
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+5511999999999",
    "name": "User Name",
    "firstName": "User",
    "lastName": "Name",
    "status": "enable",
    "access": "customer",
    "language": "pt",
    "country": "BR",
    "birthdate": "1990-01-01",
    "gender": "male",
    "maritalStatus": "single",
    "emailVerified": true,
    "phoneVerified": true,
    "livenessVerified": true,
    "image": "https://...",
    "identities": [...],
    "accounts": [...],
    "onboardingState": {...},
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "forceUpgrade": false,
  "exchangeRates": {
    "USDBRL": 5.50,
    "USDARS": 850.00
  }
}
```

#### Code Flow

```
UserController.getCurrentUser()
  └─> UserProfileService.getCurrentUser()
      └─> UserProfileModel.findById()
          └─> prisma.users.findFirst()
```

---

### POST /api/users/user/profile

Update user profile information.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

**Optional Fields:**
- `firstName` (string): First name
- `lastName` (string): Last name
- `phone` (string): Phone number
- `profilePicture` (object): Profile picture
  - `url` (string): Image URL
  - `key` (string): S3 key
- `language` (string): User language (en, es, pt)
- `timezone` (string): User timezone
- `country` (string): Country code
- `birthdate` (string): Birth date (YYYY-MM-DD)
- `gender` (string): Gender (male, female, other)
- `maritalStatus` (string): Marital status

#### Request Example

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+5511999999999",
  "language": "pt",
  "country": "BR",
  "birthdate": "1990-01-01",
  "gender": "male",
  "maritalStatus": "single"
}
```

#### Success Response (200)

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+5511999999999",
    "name": "John Doe",
    "language": "pt",
    "country": "BR",
    "birthdate": "1990-01-01",
    "gender": "male",
    "maritalStatus": "single",
    "image": "https://..."
  },
  "message": "200 users.success.profileUpdated",
  "code": "200 users.success.profileUpdated"
}
```

#### Code Flow

```
UserController.updateProfile()
  └─> UserProfileService.updateProfile()
      └─> UserProfileModel.update()
          └─> prisma.users.update()
```

---

### POST /api/users/user/address

Update user address.

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
- `zipCode` (string): Postal code
- `street` (string): Street name
- `number` (string): Street number
- `city` (string): City name
- `state` (string): State/province

**Optional:**
- `neighborhood` (string): Neighborhood
- `complement` (string): Additional address info

#### Request Example

```json
{
  "zipCode": "01310-100",
  "street": "Av. Paulista",
  "number": "1578",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "complement": "Apto 101"
}
```

#### Success Response (200)

```json
{
  "address": {
    "zipCode": "01310-100",
    "street": "Av. Paulista",
    "number": "1578",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "complement": "Apto 101"
  },
  "message": "200 users.success.addressUpdated",
  "code": "200 users.success.addressUpdated"
}
```

#### Code Flow

```
UserController.updateAddress()
  └─> UserProfileService.updateAddress()
      └─> UserProfileModel.updateAddress()
          └─> prisma.users.update()
```

---

## Business Rules

1. **Profile Update**: Only user can update their own profile
2. **Address Validation**: ZIP code format validated based on country
3. **Phone Format**: Must include country code
4. **Birthdate**: User must be 18+ years old
5. **Language**: Must be one of: en, es, pt

## Error Codes

- `400 users.errors.invalidParameters` - Invalid input data
- `400 users.errors.userNotFound` - User does not exist
- `401 users.errors.invalidToken` - Invalid or expired token
- `400 users.errors.invalidBirthdate` - User under 18 years

## Testing

### Manual Testing

See [Testing Guide](../../guides/testing.md)

### Automated Testing

```bash
npm run test:unit -- user-profile.service.spec.ts
npm run test:e2e -- user-profile.e2e-spec.ts
```

## Related Endpoints

- [Email Validation](email-validation.md)
- [Phone Validation](phone-validation.md)
- [Password Management](password-management.md)

## References

- [Users Domain Overview](README.md)
- [Error Codes](../error-codes.md)
