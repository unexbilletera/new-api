# Public Endpoints - Auth Required

Public endpoints that require authentication (Bearer token in Authorization header).

## User Profile

### GET /api/users/user/me ✅ TESTED
**Description:** Get current authenticated user profile  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `systemVersion` (string)

**Test Result:**
- ✅ Endpoint working correctly
- Returns complete authenticated user profile
- Status: 200 OK
- Response includes: user details (id, email, phone, name, status, access, language, country, birthdate, gender, maritalStatus, pep, identities, accounts), forceUpgrade, exchangeRates

**Response:** User profile response

### POST /api/users/user/profile ✅ TESTED
**Description:** Update user profile information  
**Headers (Required):** Authorization Bearer token  
**Body (Optional):**
- `firstName` (string)
- `lastName` (string)
- `phone` (string)
- `profilePicture` (object: { url?, key? })
- `language` (string)
- `timezone` (string)
- `country` (string)
- `birthdate` (string)
- `gender` (string)
- `maritalStatus` (string)

**Response:** Profile update response

**Test Result:**
- ✅ Endpoint working correctly
- Successfully updates user profile information
- Status: 200 OK
- Response includes: success, user object with updated fields (id, email, firstName, lastName, phone, name, language, country, birthdate, gender, maritalStatus, image)

### POST /api/users/user/address ✅ TESTED
**Description:** Update user address  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `zipCode` (string)
- `street` (string)
- `number` (string)
- `city` (string)
- `state` (string)

**Body (Optional):**
- `neighborhood` (string)
- `complement` (string)

**Response:** Address update response

**Test Result:**
- ✅ Endpoint working correctly
- Successfully updates user address
- Status: 200 OK
- Response includes: success, address object with all fields (zipCode, street, number, neighborhood, city, state, complement)

## Account Management

### POST /api/users/user/change-email/request
**Description:** Request email change  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `newEmail` (string, email format)

**Response:** Email change request response

### POST /api/users/user/change-email/confirm
**Description:** Confirm email change with code  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `newEmail` (string, email format)
- `code` (string)

**Response:** Email change confirmation response

### POST /api/users/user/change-password
**Description:** Change user password  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `currentPassword` (string)
- `newPassword` (string)

**Response:** Password change response

### POST /api/users/user/signout
**Description:** Sign out user session  
**Headers (Required):** Authorization Bearer token  
**Body (Optional):**
- `deviceId` (string)

**Response:** Signout response

### POST /api/users/user/closeAccount
**Description:** Close user account  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `password` (string)

**Body (Optional):**
- `reason` (string)

**Response:** Account closure response

## Liveness & Biometrics

### POST /api/users/user/liveness
**Description:** Perform liveness check  
**Headers (Required):** Authorization Bearer token  
**Body (Optional):**
- `biometricData` (object)
- `videoBase64` (string)
- `image` (string)

**Response:** Liveness check response

## Onboarding

### POST /api/users/user/onboarding/:step
**Description:** Update onboarding step  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `step` (string)

**Response:** Onboarding response

### POST /api/users/user/onboarding
**Description:** Get onboarding status  
**Headers (Required):** Authorization Bearer token  
**Response:** Onboarding response

### PATCH /api/onboarding/user/:userId
**Description:** Update user onboarding data  
**Path (Required):**
- `userId` (string, UUID)

**Body (Optional):**
- `firstName` (string)
- `lastName` (string)
- `phone` (string)
- `password` (string, exactly 6 digits)
- `campaignCode` (string)
- `country` (string)
- `birthdate` (string)
- `gender` (string)
- `maritalStatus` (string)
- `pep` (string)
- `pepSince` (string)
- `livenessImage` (string)
- `cpf` (string)
- `address` (object: { street?, number?, complement?, neighborhood?, city?, state?, zipCode? })

**Response:** Update user onboarding response

### POST /api/onboarding/identity/:userId
**Description:** Start identity onboarding  
**Path (Required):**
- `userId` (string, UUID)

**Body (Optional):**
- `countryCode` (string)
- `country` (string, enum: 'ar', 'br')
- `documentType` (string)

**Response:** Start identity onboarding response

### PATCH /api/onboarding/identity/:identityId
**Description:** Update identity onboarding  
**Path (Required):**
- `identityId` (string, UUID)

**Body (Optional):**
- `documentNumber` (string)
- `documentExpiration` (string)
- `documentIssuer` (string)
- `biometricData` (object)

**Response:** Update identity onboarding response

### POST /api/onboarding/identity/ar/upload-document
**Description:** Upload Argentina document  
**Body (Required):**
- `userId` (string)
- `identityId` (string)
- `frontImage` (string)

**Body (Optional):**
- `backImage` (string)
- `pdf417Data` (object: { documentNumber?, firstName?, lastName?, dateOfBirth?, gender?, documentExpiration? })

**Response:** Upload Argentina document response

### GET /api/users/user/onboarding/pending-data/:userIdentityId ✅ TESTED
**Description:** Get pending onboarding data  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Response:** Onboarding pending data response

**Test Result:**
- ✅ Endpoint working correctly
- Returns pending onboarding data for user identity
- Status: 200 OK
- Response includes: pendingFields (array), needsCorrection (array)

### POST /api/users/user/onboarding/update-specific-data/:userIdentityId
**Description:** Update specific onboarding data  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Body:** Dynamic object with fields to update

**Response:** Success response

### GET /api/users/user/onboarding/status/:userIdentityId
**Description:** Get onboarding status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Response:** Onboarding status response

### GET /api/users/user/onboarding/validate/:userIdentityId ✅ TESTED
**Description:** Validate onboarding data  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Response:** Validate onboarding data response

**Test Result:**
- ✅ Endpoint working correctly
- Validates onboarding data for user identity
- Status: 200 OK
- Response includes: isValid (boolean), errors (array)

### POST /api/users/user/onboarding/retry/:userIdentityId
**Description:** Retry onboarding process  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Response:** Retry onboarding response

## Biometric Devices

### POST /api/auth/challenge
**Description:** Generate biometric challenge  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `userId` (string)
- `deviceId` (string)

**Response:** Generate challenge response

### POST /api/auth/verify
**Description:** Verify biometric signature  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `userId` (string)
- `deviceId` (string)
- `challengeId` (string)
- `signature` (string)

**Body (Optional):**
- `signatureFormat` (string, enum: 'der', 'p1363')

**Response:** Verify signature response

### POST /api/auth/register-device
**Description:** Register biometric device  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `publicKeyPem` (string)
- `keyType` (string, enum: 'ES256', 'RS256')
- `platform` (string, enum: 'ios', 'android', 'web')
- `deviceIdentifier` (string)

**Body (Optional):**
- `attestation` (string)
- `registrationType` (string, enum: 'soft', 'hard')

**Response:** Register device response

### POST /api/auth/register-device-soft
**Description:** Register soft biometric device  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `publicKeyPem` (string)
- `keyType` (string, enum: 'ES256', 'RS256')
- `platform` (string, enum: 'ios', 'android', 'web')
- `deviceIdentifier` (string)

**Body (Optional):**
- `attestation` (string)

**Response:** Register device soft response

### POST /api/auth/device/send-sms-validation
**Description:** Send SMS validation for device  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `deviceId` (string)

**Response:** Send device SMS validation response

### POST /api/auth/device/verify-sms-and-activate
**Description:** Verify SMS code and activate device  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `deviceId` (string)
- `code` (string)

**Response:** Verify SMS challenge response

### POST /api/auth/revoke-device
**Description:** Revoke biometric device  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `deviceId` (string)

**Response:** Revoke device response

### GET /api/auth/devices/:userId ✅ TESTED
**Description:** List user devices  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userId` (string, UUID)

**Response:** List devices response

**Test Result:**
- ✅ Endpoint working correctly
- Returns list of user devices
- Status: 200 OK
- Response includes: array of devices with deviceId, deviceIdentifier, platform, keyType, status, registeredAt, lastUsedAt, userId

### GET /api/auth/device/health-check ✅ TESTED
**Description:** Check device health  
**Headers (Required):** Authorization Bearer token  
**Query (Required):**
- `userId` (string, optional - if provided must match authenticated user)
- `deviceIdentifier` (string)

**Response:** Check device health response

**Test Result:**
- ✅ Endpoint working correctly
- Checks device health status
- Status: 200 OK
- Response includes: isValid, status (active/revoked/not_found), error (optional), message (optional), canRegister (optional)
- Note: BiometricModule was added to app.module.ts, CurrentUser decorator fixed to extract field when specified

## Support & Messaging

### POST /api/users/sendMessage ✅ TESTED
**Description:** Send message to support  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `subject` (string)
- `message` (string)

**Body (Optional):**
- `attachmentUrl` (string)

**Response:** Messaging response

**Test Result:**
- ✅ Endpoint working correctly
- Successfully sends message to support
- Status: 200 OK
- Response: { "message": "Message sent successfully" }

## Identities & Accounts

### GET /api/users/user/identities/:userId ✅ TESTED
**Description:** Get user identities  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userId` (string, UUID)

**Response:** Identity list response

**Test Result:**
- ✅ Endpoint working correctly
- Returns user identities list
- Status: 200 OK
- Response includes: identities array with id, country, taxDocumentNumber, taxDocumentType, identityDocumentNumber, identityDocumentType, status, createdAt for each identity

### POST /api/users/user/setDefaultUserIdentity/:id
**Description:** Set default user identity  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, identity ID)

**Response:** Success response

### POST /api/users/user/setDefaultUserAccount/:id
**Description:** Set default user account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, account ID)

**Response:** Success response

### POST /api/users/user/setUserAccountAlias/:id
**Description:** Set user account alias  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, account ID)

**Body (Required):**
- `alias` (string)

**Response:** Success response

### GET /api/users/user/balances ✅ TESTED
**Description:** Get user account balances  
**Headers (Required):** Authorization Bearer token  
**Response:** Account balance response

**Test Result:**
- ✅ Endpoint working correctly
- Returns user account balances
- Status: 200 OK
- Response includes: accounts array with id, type, balance, alias, status for each account

### GET /api/users/userAccountInfo/:id ✅ TESTED
**Description:** Get user account information  
**Path (Required):**
- `id` (string, account ID)

**Response:** Account info response

**Test Result:**
- ✅ Endpoint working correctly
- Returns detailed user account information
- Status: 200 OK
- Response includes: account object with id, userId, userIdentityId, number, type, status, cvu, alias, balance, createdAt, updatedAt, deletedAt, notes, accountNumber, cronosId

### GET /api/users/sailpointInfo/:id ✅ TESTED
**Description:** Get Sailpoint information  
**Path (Required):**
- `id` (string, Sailpoint ID)

**Response:** Sailpoint info response

**Test Result:**
- ✅ Endpoint working correctly
- Returns Sailpoint information message
- Status: 200 OK
- Response: { "message": "Sailpoint info retrieved" }
- Note: Does not require authentication
