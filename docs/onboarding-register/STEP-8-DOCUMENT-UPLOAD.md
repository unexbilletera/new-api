# Step 8: Document Upload (Argentina)

## Overview

This step is specific to Argentina users. It involves uploading the front and back images of the DNI (Documento Nacional de Identidad) document, extracting PDF417 barcode data, and performing RENAPER validation.

## Endpoint

```
POST /api/onboarding/identity/ar/upload-document
```

## Authentication

Requires JWT Bearer token (obtained after completing Phase 1 user onboarding).

## Request Body

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "identityId": "660e8400-e29b-41d4-a716-446655440000",
  "frontImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "backImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "pdf417Data": {
    "documentNumber": "12345678",
    "firstName": "Juan",
    "lastName": "Pérez",
    "dateOfBirth": "1990-01-15",
    "gender": "M",
    "documentExpiration": "2025-12-31"
  }
}
```

### Request Fields

| Field      | Type   | Required | Description                               |
| ---------- | ------ | -------- | ----------------------------------------- |
| userId     | string | Yes      | User identifier                           |
| identityId | string | Yes      | Identity document identifier              |
| frontImage | string | Yes      | Base64-encoded front image of DNI         |
| backImage  | string | Yes      | Base64-encoded back image of DNI          |
| pdf417Data | object | Yes      | PDF417 barcode extracted data (see below) |

### PDF417 Data Object

| Field              | Type   | Required | Description                |
| ------------------ | ------ | -------- | -------------------------- |
| documentNumber     | string | Yes      | DNI document number        |
| firstName          | string | Yes      | First name from document   |
| lastName           | string | Yes      | Last name from document    |
| dateOfBirth        | string | Yes      | Date of birth (YYYY-MM-DD) |
| gender             | string | Yes      | Gender ("M" or "F")        |
| documentExpiration | string | No       | Document expiration date   |

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Document uploaded and validated successfully",
  "identityId": "660e8400-e29b-41d4-a716-446655440000",
  "renaperValidation": {
    "valid": true,
    "message": "Document validated successfully",
    "vigencia": true,
    "facial": true
  },
  "onboardingState": {
    "completedSteps": [
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6",
      "1.7",
      "1.8",
      "1.9",
      "1.10",
      "1.11",
      "1.12",
      "2.1",
      "2.2",
      "2.3",
      "2.4"
    ],
    "needsCorrection": []
  },
  "s3Urls": {
    "frontImage": "https://s3.amazonaws.com/bucket/front-image.jpg",
    "backImage": "https://s3.amazonaws.com/bucket/back-image.jpg"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Images

```json
{
  "statusCode": 400,
  "message": "Front and back images are required",
  "error": "Bad Request"
}
```

#### 400 Bad Request - Missing PDF417 Data

```json
{
  "statusCode": 400,
  "message": "PDF417 data is required",
  "error": "Bad Request"
}
```

#### 400 Bad Request - Incomplete PDF417 Data

```json
{
  "statusCode": 400,
  "message": "PDF417 data incomplete (documentNumber, gender, dateOfBirth, firstName, lastName are required)",
  "error": "Bad Request"
}
```

#### 400 Bad Request - Invalid Country

```json
{
  "statusCode": 400,
  "message": "This endpoint is only for Argentine documents",
  "error": "Bad Request"
}
```

#### 403 Forbidden - RENAPER IP Not Authorized

```json
{
  "statusCode": 403,
  "message": "RENAPER_FORBIDDEN",
  "error": "Forbidden"
}
```

## Implementation Details

### Document Upload Process

1. **Image Upload to S3**
   - Front and back images are uploaded to S3 storage
   - Images are stored with unique identifiers
   - S3 URLs are returned in response

2. **PDF417 Barcode Data**
   - PDF417 barcode data must be extracted from the document
   - Required fields: `documentNumber`, `firstName`, `lastName`, `dateOfBirth`, `gender`
   - Optional field: `documentExpiration`

3. **RENAPER Validation**
   - **Vigencia Check**: Verifies document validity
   - **Facial Validation**: Compares document photo with liveness image (if available)
   - **Fingerprint Validation**: Optional fingerprint verification

4. **Data Updates**
   - Document images stored in identity record
   - User data updated from PDF417 (name, birthdate, gender)
   - Identity status updated to `process`
   - Steps `2.3` and `2.4` marked as completed

### RENAPER Validation Details

The RENAPER service performs three types of validation:

1. **Vigencia (Validity)**
   - Checks if the document is valid and not expired
   - Verifies document number matches RENAPER records

2. **Facial Recognition**
   - Compares document photo with user's liveness image
   - Requires `livenessImage` to be available
   - Confidence threshold: `WALLET_RENAPER_MIN_CONFIDENCE` (default: 0.85)

3. **Fingerprint (Huella)**
   - Optional fingerprint verification
   - Requires fingerprint data from biometric capture

## State Management

After successful upload:

- `onboardingState.completedSteps` includes `"2.3"` and `"2.4"`
- Identity status is set to `process` (awaiting backoffice approval)
- Document images are stored in S3
- User data is updated from PDF417 information
- Next step: Backoffice approval (triggers automatic account creation)

## Environment Configuration

```env
# RENAPER Configuration
WALLET_RENAPER=enable
WALLET_RENAPER_LOG=enable
WALLET_RENAPER_PROXY=enable
WALLET_RENAPER_URL=https://apirenaper.idear.gov.ar/CHUTROFINAL
WALLET_RENAPER_VIGENCIA_USER=...
WALLET_RENAPER_VIGENCIA_PASSWORD=...
WALLET_RENAPER_FACIAL_USER=...
WALLET_RENAPER_FACIAL_PASSWORD=...
WALLET_RENAPER_HUELLA_USER=...
WALLET_RENAPER_HUELLA_PASSWORD=...
WALLET_RENAPER_MIN_CONFIDENCE=0.85
WALLET_RENAPER_TIMEOUT=30000

# S3 Storage Configuration
WALLET_FILES_KEY=...
WALLET_FILES_PASSWORD=...
WALLET_FILES_REGION=us-east-2
WALLET_FILES_BUCKET=...
WALLET_FILES_PUBLIC_URL=...
```

## Backoffice Approval

After document upload:

- Identity status is set to `process`
- Document is ready for backoffice review
- Upon approval, automatic account creation is triggered:
  - **Bind CVU**: Creates CVU (Cuenta Virtual Única) for ARS transactions
  - **Manteca**: Creates crypto account for Argentina exchange
  - Identity and user status updated to `enable`

## Error Handling

### RENAPER Errors

- **IP Not Authorized**: Server IP must be whitelisted on RENAPER
- **Invalid Document**: Document number not found in RENAPER
- **Expired Document**: Document has expired
- **Facial Mismatch**: Document photo doesn't match liveness image

### S3 Upload Errors

- **Upload Failed**: Network or permission issues
- **Invalid Image Format**: Image must be valid JPEG/PNG

## Next Steps

1. Wait for backoffice approval
2. Automatic account creation (Bind CVU + Manteca)
3. Account activation and access granted

## Example cURL

```bash
curl -X POST https://api.example.com/api/onboarding/identity/ar/upload-document \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "identityId": "660e8400-e29b-41d4-a716-446655440000",
    "frontImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "backImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "pdf417Data": {
      "documentNumber": "12345678",
      "firstName": "Juan",
      "lastName": "Pérez",
      "dateOfBirth": "1990-01-15",
      "gender": "M",
      "documentExpiration": "2025-12-31"
    }
  }'
```

## Notes

- This endpoint is **only for Argentina** users
- PDF417 barcode data must be extracted from the document before upload
- RENAPER validation requires server IP to be whitelisted
- Document images are permanently stored in S3
- Facial validation requires a liveness image from Step 6
- After successful upload, identity status is `process` (awaiting approval)
- Account creation is automatic upon backoffice approval
