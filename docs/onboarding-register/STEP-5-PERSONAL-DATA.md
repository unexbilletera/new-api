# Step 5: Personal Data

## Overview

This step collects additional personal information from the user, including name, country, birthdate, gender, marital status, and PEP (Politically Exposed Person) declaration.

## Endpoint

```
PATCH /api/onboarding/user/:userId
```

## Authentication

No authentication required (public endpoint).

## Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "country": "br",
  "birthdate": "1990-01-15",
  "gender": "male",
  "maritalStatus": "single",
  "pep": "0",
  "pepSince": null,
  "address": {
    "street": "Main Street",
    "number": "123",
    "complement": "Apt 4B",
    "neighborhood": "Downtown",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  }
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | No | User's first name |
| lastName | string | No | User's last name |
| country | string | No | Country code (e.g., "br", "ar") |
| birthdate | string | No | Birth date in ISO format (YYYY-MM-DD) |
| gender | string | No | Gender ("male", "female", "other") |
| maritalStatus | string | No | Marital status |
| pep | string | No | PEP declaration ("0" = no, "1" = yes) |
| pepSince | string | No | Date when user became PEP (if applicable) |
| address | object | No | Address information (see below) |

### Address Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| street | string | No | Street name |
| number | string | No | Street number |
| complement | string | No | Address complement |
| neighborhood | string | No | Neighborhood |
| city | string | No | City |
| state | string | No | State/Province |
| zipCode | string | No | ZIP/Postal code |

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User data updated successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingState": {
    "completedSteps": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10"],
    "needsCorrection": []
  },
  "nextStep": "livenessForm"
}
```

### Error Responses

#### 400 Bad Request - Invalid Data
```json
{
  "statusCode": 400,
  "message": "users.errors.invalidData",
  "error": "Bad Request"
}
```

#### 404 Not Found - User Not Found
```json
{
  "statusCode": 404,
  "message": "users.errors.userNotFound",
  "error": "Not Found"
}
```

## Implementation Details

### Step Tracking
- **Step 1.8**: Completed when `firstName` or `lastName` is provided
- **Step 1.9**: Completed when `country`, `birthdate`, `gender`, or `maritalStatus` is provided
- **Step 1.10**: Completed when `pep` or `pepSince` is provided

### Data Processing
- `name` field is automatically generated from `firstName` and `lastName`
- `username` is set to `firstName` if provided
- `birthdate` is converted to Date object
- `gender` is normalized (e.g., "M" → "male", "F" → "female")
- PEP declaration is stored for compliance purposes

## State Management

After successful update:
- `onboardingState.completedSteps` includes `"1.8"`, `"1.9"`, and `"1.10"` (as applicable)
- Personal data is stored in user record
- Next step is liveness verification

## PEP Declaration

PEP (Politically Exposed Person) declaration is required for compliance:
- `pep: "0"` = User is not a PEP
- `pep: "1"` = User is a PEP
- `pepSince` = Date when user became PEP (required if PEP = "1")

## Next Steps

1. [Step 6: Liveness Verification](./STEP-6-LIVENESS-VERIFICATION.md) - Complete liveness verification

## Example cURL

```bash
curl -X PATCH https://api.example.com/api/onboarding/user/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "country": "br",
    "birthdate": "1990-01-15",
    "gender": "male",
    "maritalStatus": "single",
    "pep": "0",
    "address": {
      "street": "Main Street",
      "number": "123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    }
  }'
```

## Notes

- All fields are optional, but providing complete information is recommended
- Country code determines which identity validation flow will be used (AR vs BR)
- PEP declaration is mandatory for compliance with financial regulations
- Address information is stored for KYC (Know Your Customer) compliance
