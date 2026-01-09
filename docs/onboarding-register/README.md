# Onboarding & Registration Flow Documentation

## Overview

This documentation provides a comprehensive guide to the user onboarding and registration process. The onboarding flow is divided into multiple stages, each requiring specific user data and validations. The implementation follows the same architecture as the old API, including RENAPER integration for Argentina, Cronos onboarding for Brazil, and automatic account creation via Bind, Manteca, and Cronos services.

## Flow Architecture

The onboarding process consists of two main phases:

1. **User Onboarding** (Steps 1.1 - 1.13): Basic user registration and profile setup
2. **Identity Onboarding** (Steps 2.x for Argentina, 3.x for Brazil): Identity document validation and account creation

## Onboarding Steps Overview

### Phase 1: User Onboarding

| Step | Description | Endpoint | Status |
|------|-------------|----------|--------|
| 1.1 | Start onboarding (email registration) | `POST /api/onboarding/user/start` | ✅ Required |
| 1.2 | Email validation code sent | `POST /api/onboarding/user/send-email-validation` | ✅ Required |
| 1.3 | Email code verified | `POST /api/onboarding/user/verify-code` | ✅ Required |
| 1.4 | Phone number provided | `PATCH /api/onboarding/user/:userId` | ✅ Required |
| 1.5 | Phone validation code sent | `POST /api/onboarding/user/send-phone-validation` | ✅ Required |
| 1.6 | Phone code verified | `POST /api/onboarding/user/verify-code` | ✅ Required |
| 1.7 | Password created | `PATCH /api/onboarding/user/:userId` | ✅ Required |
| 1.8 | Personal information (name) | `PATCH /api/onboarding/user/:userId` | ✅ Required |
| 1.9 | Additional personal data | `PATCH /api/onboarding/user/:userId` | ✅ Required |
| 1.10 | PEP declaration | `PATCH /api/onboarding/user/:userId` | ✅ Required |
| 1.11 | Liveness verification initiated | `PATCH /api/onboarding/user/:userId` or `POST /api/users/user/liveness` | ✅ Required |
| 1.12 | Liveness verification completed | Automatic | ✅ Required |
| 1.13 | All user steps completed | Automatic | ✅ Required |

### Phase 2: Identity Onboarding

#### Argentina (Steps 2.1 - 2.4)

| Step | Description | Endpoint | Status |
|------|-------------|----------|--------|
| 2.1 | Start identity onboarding | `POST /api/onboarding/identity/:userId` | ✅ Required |
| 2.2 | Document information provided | `PATCH /api/onboarding/identity/:identityId` | ✅ Required |
| 2.3 | Document uploaded with RENAPER validation | `POST /api/onboarding/identity/ar/upload-document` | ✅ Implemented |
| 2.4 | Document verification success | Automatic | ✅ Implemented |

**Argentina Implementation Details:**
- ✅ PDF417 barcode parsing from DNI documents
- ✅ RENAPER API integration for document validity verification
- ✅ RENAPER facial validation (when liveness image available)
- ✅ S3 storage for document images
- ✅ Automatic account creation via Bind (CVU) and Manteca (crypto) after backoffice approval

#### Brazil (Steps 3.1 - 3.5)

| Step | Description | Endpoint | Status |
|------|-------------|----------|--------|
| 3.1 | Start identity onboarding | `POST /api/onboarding/identity/:userId` | ✅ Required |
| 3.2 | Document information provided | `PATCH /api/onboarding/identity/:identityId` | ✅ Required |
| 3.3 | Cronos onboarding started | Automatic (via backoffice approval) | ✅ Implemented |
| 3.4 | Cronos onboarding completed | Automatic (via backoffice approval) | ✅ Implemented |
| 3.5 | Document verification success | Automatic | ✅ Implemented |

**Brazil Implementation Details:**
- ✅ Cronos onboarding integration (`onboardingStart`, `onboarding`, `getOnboardingStatus`)
- ✅ Automatic PIX key generation (EVP)
- ✅ Automatic account creation via Cronos (PIX) and Manteca (crypto) after backoffice approval
- ✅ Account status synchronization with Cronos

## Backoffice Approval Process

After completing identity onboarding, users must be approved by the backoffice before accounts are created:

### Approval Endpoint

```
POST /backoffice/onboarding/users/:id/approve
```

### Automatic Account Creation

Upon approval, the system automatically creates accounts based on the user's country:

#### Argentina
1. **Bind CVU**: Creates CVU (Cuenta Virtual Única) for ARS transactions
2. **Manteca**: Creates crypto account for Argentina exchange
3. **Status Update**: Sets identity and user status to `enable`

#### Brazil
1. **Cronos**: Creates PIX account and generates EVP key if missing
2. **Manteca**: Creates crypto account for Brazil exchange
3. **Status Update**: Sets identity and user status to `enable`

### Account Status Flow

- **Pending** → User completes onboarding
- **Process** → Document uploaded, awaiting backoffice review
- **Enable** → Approved by backoffice, accounts created
- **Rejected** → Rejected by backoffice, requires correction

## Environment Configuration

### Mock Mode

The onboarding flow supports mock mode for testing via environment variables:

```env
# Enable mock codes (bypasses real validation)
ENABLE_MOCK_CODES=false

# Sandbox flags
WALLET_SANDBOX=enable
WALLET_SANDBOX_SEND_MAIL=true
WALLET_SANDBOX_SEND_SMS=true

# Valida configuration (for liveness)
WALLET_VALIDA=enable
VALIDA_ENABLED=true
```

### External Services Configuration

#### RENAPER (Argentina)
```env
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
```

#### Bind (Argentina)
```env
WALLET_BIND=enable
WALLET_BIND_LOG=enable
WALLET_BIND_PROXY=enable
WALLET_BIND_URL=https://api.bind.com.ar
WALLET_BIND_USERNAME=...
WALLET_BIND_PASSWORD=...
WALLET_BIND_ACCOUNT=...
WALLET_BIND_KEY=...
WALLET_BIND_CRT=...
WALLET_BIND_PASSPHRASE=...
```

#### Cronos (Brazil)
```env
WALLET_CRONOS=enable
WALLET_CRONOS_LOG=enable
WALLET_CRONOS_PROXY=enable
WALLET_CRONOS_URL=https://apibr.unex.ar
WALLET_CRONOS_USERNAME=...
WALLET_CRONOS_PASSWORD=...
WALLET_CRONOS_USER_PASSWORD=...
```

#### Manteca (Crypto)
```env
WALLET_MANTECA=enable
WALLET_MANTECA_LOG=enable
WALLET_MANTECA_URL=https://api.manteca.dev/crypto
WALLET_MANTECA_KEY=...
```

#### S3 Storage
```env
WALLET_FILES_KEY=...
WALLET_FILES_PASSWORD=...
WALLET_FILES_REGION=us-east-2
WALLET_FILES_BUCKET=...
WALLET_FILES_PUBLIC_URL=...
```

### Mock Code Behavior

When `ENABLE_MOCK_CODES=true`:
- Email validation codes can be bypassed with mock codes
- SMS validation codes can be bypassed with mock codes
- See [Mock Codes Documentation](../PROVIDER_FEATURES.md) for details

## Authentication

- **Phase 1 (User Onboarding)**: No authentication required
- **Phase 2 (Identity Onboarding)**: Requires JWT Bearer token
  - Token obtained after completing Phase 1
  - Use `Authorization: Bearer <token>` header
- **Backoffice Approval**: Requires backoffice JWT Bearer token

## State Management

The onboarding state is stored in the `onboardingState` field of the user record:

```json
{
  "completedSteps": ["1.1", "1.2", "1.3", ...],
  "needsCorrection": []
}
```

### Tracking Progress

- Each completed step is added to `completedSteps` array
- Steps that need correction are added to `needsCorrection` array
- The system automatically checks if all required steps are completed
- Argentina: `documentVerificationSuccess.ar` is added after successful RENAPER validation
- Brazil: Account creation steps are tracked via Cronos status

## Validation Rules

### Email
- Must be valid email format
- Must be unique (not already registered)
- Normalized to lowercase

### Phone
- Must be valid phone number format
- Normalized (non-digit characters removed)
- Country-specific validation

### Password
- Must be 6 digits (numeric only)
- Format: `^\d{6}$`

### Liveness
- **Valida Enabled**: Full Valida flow via `/api/users/user/liveness`
- **Valida Disabled**: Simple photo upload via `PATCH /api/onboarding/user/:userId`

### Document Validation

#### Argentina
- PDF417 barcode data extraction and validation
- RENAPER validity verification (vigencia)
- RENAPER facial validation (when liveness image available)
- Document images uploaded to S3

#### Brazil
- CPF format validation
- Cronos onboarding status verification
- Automatic PIX key generation

## Error Handling

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "users.errors.invalidEmail",
  "error": "Bad Request"
}
```

Common error codes:
- `users.errors.emailAlreadyInUse` - Email already registered
- `users.errors.invalidEmail` - Invalid email format
- `users.errors.codeNotFoundOrExpired` - Validation code expired
- `users.errors.invalidCode` - Invalid validation code
- `users.errors.userNotFound` - User not found
- `RENAPER_FORBIDDEN` - IP not authorized on RENAPER API whitelist

## Logging

All onboarding operations are logged with appropriate prefixes for easy tracking:

```
[ONBOARDING] Starting user onboarding
[ONBOARDING] Email code verified successfully
[RENAPER] Document validation successful
[CronosService] Onboarding started for document
[BindService] CVU created successfully
[MantecaService] User created successfully
```

## Next Steps

1. Read the detailed documentation for each step:
   - [Step 1: Start Onboarding](./STEP-1-START-ONBOARDING.md)
   - [Step 2: Email Validation](./STEP-2-EMAIL-VALIDATION.md)
   - [Step 3: Phone Validation](./STEP-3-PHONE-VALIDATION.md)
   - [Step 4: Password Creation](./STEP-4-PASSWORD.md)
   - [Step 5: Personal Data](./STEP-5-PERSONAL-DATA.md)
   - [Step 6: Liveness Verification](./STEP-6-LIVENESS-VERIFICATION.md)
   - [Step 7: Identity Onboarding](./STEP-7-IDENTITY-ONBOARDING.md)
   - [Step 8: Document Upload](./STEP-8-DOCUMENT-UPLOAD.md)

2. For backoffice operations, see the backoffice onboarding documentation
3. For external service integration details, see the service-specific documentation
