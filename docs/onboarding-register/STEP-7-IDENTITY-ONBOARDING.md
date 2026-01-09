# Step 7: Identity Onboarding

## Overview

This step initiates the identity document validation process. The flow differs based on the user's country:
- **Argentina**: RENAPER validation with PDF417 barcode parsing
- **Brazil**: Cronos onboarding integration

## Endpoints

### Start Identity Onboarding

```
POST /api/onboarding/identity/:userId
```

### Update Identity Information

```
PATCH /api/onboarding/identity/:identityId
```

## Authentication

Requires JWT Bearer token (obtained after completing Phase 1 user onboarding).

## Start Identity Onboarding

### Request Body

```json
{
  "countryCode": "AR",
  "country": "ar",
  "documentType": "dni"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| countryCode | string | No | Country code (e.g., "AR", "BR") |
| country | string | No | Country code in lowercase (must be "ar" or "br") |
| documentType | string | No | Document type (e.g., "dni", "cpf") |

### Response

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Identity onboarding started successfully",
  "identityId": "660e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "country": "ar",
  "onboardingState": {
    "completedSteps": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10", "1.11", "1.12", "2.1"],
    "needsCorrection": []
  }
}
```

## Update Identity Information

### Request Body

```json
{
  "documentNumber": "12345678",
  "documentExpiration": "2025-12-31",
  "documentIssuer": "RENAPER"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documentNumber | string | No | Identity document number |
| documentExpiration | string | No | Document expiration date |
| documentIssuer | string | No | Document issuer |
| biometricData | object | No | Biometric data (if applicable) |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Identity updated successfully",
  "identityId": "660e8400-e29b-41d4-a716-446655440000"
}
```

## Implementation Details

### Argentina Flow (Step 2.1 - 2.4)
1. **Step 2.1**: Start identity onboarding
   - Creates identity record with country `"ar"`
   - Sets identity status to `pending`
   - Marks step `2.1` as completed

2. **Step 2.2**: Provide document information
   - User provides document number and expiration
   - Marks step `2.2` as completed

3. **Step 2.3**: Upload document with RENAPER validation
   - Document images uploaded to S3
   - PDF417 barcode data extracted
   - RENAPER validation performed
   - See [Step 8: Document Upload](./STEP-8-DOCUMENT-UPLOAD.md) for details

4. **Step 2.4**: Document verification success
   - Automatic after successful RENAPER validation
   - Identity status updated to `process`
   - Ready for backoffice approval

### Brazil Flow (Step 3.1 - 3.5)
1. **Step 3.1**: Start identity onboarding
   - Creates identity record with country `"br"`
   - Sets identity status to `pending`
   - Marks step `3.1` as completed

2. **Step 3.2**: Provide document information
   - User provides CPF number
   - Marks step `3.2` as completed

3. **Step 3.3**: Cronos onboarding started
   - Triggered automatically via backoffice approval
   - Cronos onboarding process initiated
   - See backoffice documentation for details

4. **Step 3.4**: Cronos onboarding completed
   - Automatic after Cronos onboarding success
   - PIX key generated (EVP)

5. **Step 3.5**: Document verification success
   - Automatic after account creation
   - Identity status updated to `enable`

## State Management

After starting identity onboarding:
- `onboardingState.completedSteps` includes `"2.1"` (Argentina) or `"3.1"` (Brazil)
- Identity record is created with status `pending`
- Next step depends on country:
  - **Argentina**: Document upload with RENAPER validation
  - **Brazil**: Document information collection, then backoffice approval

## Country-Specific Details

### Argentina
- Document type: DNI (Documento Nacional de Identidad)
- Validation: RENAPER API integration
- Features: PDF417 barcode parsing, facial validation, document validity check

### Brazil
- Document type: CPF (Cadastro de Pessoas Físicas)
- Validation: Cronos onboarding integration
- Features: Automatic PIX key generation, account creation

## Next Steps

1. **Argentina**: [Step 8: Document Upload](./STEP-8-DOCUMENT-UPLOAD.md) - Upload document with RENAPER validation
2. **Brazil**: Provide CPF and wait for backoffice approval (Cronos onboarding)

## Example cURL

### Start Identity Onboarding (Argentina)
```bash
curl -X POST https://api.example.com/api/onboarding/identity/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "countryCode": "AR",
    "country": "ar",
    "documentType": "dni"
  }'
```

### Start Identity Onboarding (Brazil)
```bash
curl -X POST https://api.example.com/api/onboarding/identity/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "countryCode": "BR",
    "country": "br",
    "documentType": "cpf"
  }'
```

### Update Identity Information
```bash
curl -X PATCH https://api.example.com/api/onboarding/identity/660e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "documentNumber": "12345678",
    "documentExpiration": "2025-12-31",
    "documentIssuer": "RENAPER"
  }'
```

## Notes

- Identity onboarding requires JWT authentication
- The country determines which validation flow is used
- Argentina uses RENAPER for document validation
- Brazil uses Cronos for account creation and PIX key generation
- Identity status must be approved by backoffice before accounts are created
