# Endpoints Map - Detailed Documentation

## Public - No Auth Required

### GET /
**Description:** Health check endpoint, returns greeting message  
**Parameters:** None  
**Response:** Greeting message

### GET /health
**Description:** Health check endpoint, verifies database and server status  
**Parameters:** None  
**Response:** Status object with uptime, timestamp, and checks

### POST /api/users/user/signup
**Description:** Register a new user account  
**Body (Required):**
- `email` (string, email format)
- `password` (string, exactly 6 digits)
- `phone` (string)
- `language` (string, enum: 'es', 'pt', 'en')

**Body (Optional):**
- `firstName` (string)
- `lastName` (string)
- `deviceIdentifier` (string)
- `mobileDevice` (object)
- `browser` (object)

**Response:** Signup response or device registration required

### POST /api/users/user/signin
**Description:** Authenticate user and get access token  
**Body (Required):**
- `identifier` (string, email or phone)
- `password` (string, min 6 chars)

**Body (Optional):**
- `systemVersion` (string)
- `deviceIdentifier` (string)
- `mobileDevice` (object)
- `browser` (object)

**Response:** Signin response with token or device registration required

### POST /api/users/user/sendEmailValidation
**Description:** Send email validation code  
**Body (Required):**
- `email` (string, email format)

**Response:** Email validation response

### POST /api/users/user/verifyEmailCode
**Description:** Verify email validation code  
**Body (Required):**
- `email` (string, email format)
- `code` (string)

**Response:** Email code verification response

### POST /api/users/user/sendPhoneValidation
**Description:** Send phone validation code  
**Body (Required):**
- `phone` (string, phone number format)

**Response:** Phone validation response

### POST /api/users/user/verifyPhoneCode
**Description:** Verify phone validation code  
**Body (Required):**
- `phone` (string, phone number format)
- `code` (string)

**Response:** Phone code verification response

### POST /api/users/user/forgot
**Description:** Request password recovery  
**Body (Required):**
- `email` (string, email format)

**Response:** Forgot password response

### POST /api/users/user/verify
**Description:** Verify password recovery code and set new password  
**Body (Required):**
- `email` (string, email format)
- `code` (string)
- `newPassword` (string, exactly 6 digits)

**Response:** Password verification response

### POST /api/users/user/unlock
**Description:** Unlock user account  
**Body (Required):**
- `id` (string, UUID format)
- `password` (string, min 1 char)

**Body (Optional):**
- `systemVersion` (string)
- `mobileDevice` (object)
- `browser` (object)

**Response:** Unlock account response

### POST /api/security/token
**Description:** Get security token  
**Parameters:** None  
**Response:** Token response

### POST /api/onboarding/user/start
**Description:** Start user onboarding process  
**Body (Required):**
- `email` (string, email format)

**Response:** Start user onboarding response

### POST /api/onboarding/user/verify-code
**Description:** Verify onboarding code  
**Body (Required):**
- `email` (string, email format)
- `code` (string)
- `type` (string, enum: 'email', 'phone')

**Body (Optional):**
- `phone` (string, phone number format)

**Response:** Verify onboarding code response

### POST /api/onboarding/user/send-email-validation
**Description:** Send email validation during onboarding  
**Body (Required):**
- `email` (string, email format)

**Response:** Email validation response

### POST /api/onboarding/user/send-phone-validation
**Description:** Send phone validation during onboarding  
**Body (Required):**
- `phone` (string, phone number format)

**Response:** Phone validation response

### POST /test/auth/login
**Description:** Test endpoint for user login (development only)  
**Body (Required):**
- `email` (string)
- `password` (string)

**Response:** Token and user data

### POST /test/auth/backoffice-login
**Description:** Test endpoint for backoffice login (development only)  
**Body (Required):**
- `email` (string)
- `password` (string)

**Response:** Token and user data

## Public - Auth Required

### GET /api/users/user/me
**Description:** Get current authenticated user profile  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `systemVersion` (string)

**Response:** User profile response

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

### POST /api/users/user/address
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

### POST /api/users/user/profile
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

### POST /api/users/user/liveness
**Description:** Perform liveness check  
**Headers (Required):** Authorization Bearer token  
**Body (Optional):**
- `biometricData` (object)
- `videoBase64` (string)
- `image` (string)

**Response:** Liveness check response

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

### POST /api/users/sendMessage
**Description:** Send message to support  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `subject` (string)
- `message` (string)

**Body (Optional):**
- `attachmentUrl` (string)

**Response:** Messaging response

### GET /api/users/user/identities/:userId
**Description:** Get user identities  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userId` (string, UUID)

**Response:** Identity list response

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

### GET /api/users/user/balances
**Description:** Get user account balances  
**Headers (Required):** Authorization Bearer token  
**Response:** Account balance response

### GET /api/users/userAccountInfo/:id
**Description:** Get user account information  
**Path (Required):**
- `id` (string, account ID)

**Response:** Account info response

### GET /api/users/sailpointInfo/:id
**Description:** Get Sailpoint information  
**Path (Required):**
- `id` (string, Sailpoint ID)

**Response:** Sailpoint info response

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

### GET /api/users/user/onboarding/pending-data/:userIdentityId
**Description:** Get pending onboarding data  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Response:** Onboarding pending data response

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

### GET /api/users/user/onboarding/validate/:userIdentityId
**Description:** Validate onboarding data  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Response:** Validate onboarding data response

### POST /api/users/user/onboarding/retry/:userIdentityId
**Description:** Retry onboarding process  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userIdentityId` (string, UUID)

**Response:** Retry onboarding response

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

### GET /api/auth/devices/:userId
**Description:** List user devices  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userId` (string, UUID)

**Response:** List devices response

### GET /api/auth/device/health-check
**Description:** Check device health  
**Headers (Required):** Authorization Bearer token  
**Query (Required):**
- `userId` (string)
- `deviceIdentifier` (string)

**Response:** Check device health response

## Secure - Auth Required

### GET /notifications
**Description:** List user notifications  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string, enum: 'pending', 'read')

**Response:** List notifications response

### PATCH /notifications/:id/read
**Description:** Mark notification as read  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, notification ID)

**Response:** Mark as read response

### PATCH /notifications/read-all
**Description:** Mark all notifications as read  
**Headers (Required):** Authorization Bearer token  
**Response:** Mark all as read response

### DELETE /notifications/:id
**Description:** Delete notification  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, notification ID)

**Response:** Delete notification response

### POST /notifications/push-token
**Description:** Update push notification token  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `pushToken` (string)

**Body (Optional):**
- `platform` (string, enum: 'ios', 'android')
- `deviceId` (string)

**Response:** Update push token response

### GET /notifications/push-token
**Description:** Get push notification token  
**Headers (Required):** Authorization Bearer token  
**Response:** Get push token response

### POST /notifications/test
**Description:** Send test push notification  
**Headers (Required):** Authorization Bearer token  
**Body (Optional):**
- `title` (string)
- `message` (string)

**Response:** Send test push response

### GET /actions/layout
**Description:** Get full actions layout  
**Headers (Required):** Authorization Bearer token  
**Response:** Layout response with all action sections

### GET /actions/home
**Description:** Get home actions  
**Headers (Required):** Authorization Bearer token  
**Response:** Action response array

### GET /actions/services
**Description:** Get services actions  
**Headers (Required):** Authorization Bearer token  
**Response:** Action response array

### GET /actions/modules
**Description:** Get available modules  
**Headers (Required):** Authorization Bearer token  
**Response:** Module response array

### GET /actions/modules/:key/enabled
**Description:** Check if module is enabled  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `key` (string, module key)

**Response:** Module status response

### GET /actions/filtered
**Description:** Get filtered actions by module  
**Headers (Required):** Authorization Bearer token  
**Response:** Actions with module filter response

### GET /actions/section/:section
**Description:** Get actions by section  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `section` (string, enum: 'home', 'bottom_tab', 'menu', 'quick_action', 'services')

**Response:** Action response array

### GET /actions
**Description:** Get all actions or filtered by section  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `section` (string, enum: 'home', 'bottom_tab', 'menu', 'quick_action', 'services')
- `activeOnly` (boolean)

**Response:** Layout response or action array

### GET /app-info
**Description:** Get full app information  
**Headers (Required):** Authorization Bearer token  
**Headers (Optional):**
- `x-app-version` (string)

**Response:** Full app info response

### GET /app-info/basic
**Description:** Get basic app information  
**Headers (Required):** Authorization Bearer token  
**Headers (Optional):**
- `x-app-version` (string)

**Response:** App info response

### GET /app-info/version
**Description:** Check app version  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `version` (string)
- `platform` (string)

**Headers (Optional):**
- `x-app-version` (string)

**Response:** Version check response

### GET /app-info/news
**Description:** Get app news  
**Headers (Required):** Authorization Bearer token  
**Response:** News response array

### GET /app-info/features
**Description:** Get app features  
**Headers (Required):** Authorization Bearer token  
**Response:** Features response

### GET /campaigns/validate/:code
**Description:** Validate campaign code by path parameter  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `code` (string)

**Response:** Campaign validation response

### POST /campaigns/validate
**Description:** Validate campaign code by body  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `code` (string)

**Response:** Campaign validation response

### POST /campaigns/use
**Description:** Use campaign code  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `code` (string)

**Response:** Use campaign response

### GET /campaigns/my
**Description:** List user's used campaigns  
**Headers (Required):** Authorization Bearer token  
**Response:** List user campaigns response

### GET /terms/:serviceType
**Description:** Check term acceptance status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `serviceType` (string, enum: 'manteca_pix', 'manteca_exchange')

**Response:** Term check response

### GET /terms/acceptances/list
**Description:** List all term acceptances  
**Headers (Required):** Authorization Bearer token  
**Response:** Term acceptance response array

### GET /terms/required/check
**Description:** Check all required terms  
**Headers (Required):** Authorization Bearer token  
**Response:** Check all required response

### POST /terms/accept
**Description:** Accept term  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `serviceType` (string, enum: 'manteca_pix', 'manteca_exchange')

**Response:** Accept term response

### POST /transactions/pix/cronos/create
**Description:** Create PIX Cronos transaction  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `sourceAccountId` (string)
- `amount` (number, min 0.01)
- `targetKeyType` (string, enum: 'cpf', 'cnpj', 'email', 'phone', 'evp')
- `targetKeyValue` (string)

**Body (Optional):**
- `description` (string)

**Response:** Transaction creation response

### POST /transactions/pix/cronos/confirm
**Description:** Confirm PIX Cronos transaction  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `transactionId` (string)

**Response:** Transaction confirmation response

## Backoffice - Auth Required

### POST /backoffice/auth/login
**Description:** Backoffice user login  
**Body (Required):**
- `email` (string, email format)
- `password` (string, min 6 chars)

**Response:** Login response with token

### GET /backoffice/auth/me
**Description:** Get current backoffice user  
**Headers (Required):** Authorization Bearer token  
**Response:** User response

### GET /backoffice/clients
**Description:** List clients  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string)
- `startDate` (string, date format)
- `endDate` (string, date format)
- `search` (string)

**Response:** Client list response

### GET /backoffice/clients/:id/details
**Description:** Get client details  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Client details response

### GET /backoffice/clients/:id/accounts
**Description:** Get client accounts  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Account list response

### GET /backoffice/clients/:id/logs
**Description:** Get client access logs  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Query (Optional):**
- `page` (number)
- `limit` (number)

**Response:** Log list response

### GET /backoffice/clients/:id/transactions
**Description:** Get client transactions  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Query (Optional):**
- `page` (number)
- `limit` (number)

**Response:** Transaction list response

### PATCH /backoffice/clients/:id
**Description:** Update client information  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `name` (string)
- `email` (string)
- `phone` (string)
- `status` (string)

**Response:** Updated client response

### POST /backoffice/clients/:id/block
**Description:** Block client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `reason` (string)

**Response:** Success response

### POST /backoffice/clients/:id/unblock
**Description:** Unblock client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

### POST /backoffice/clients/:id/disable
**Description:** Disable client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `reason` (string)

**Response:** Success response

### POST /backoffice/clients/:id/enable
**Description:** Enable client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

### GET /backoffice/onboarding/users
**Description:** List users in onboarding  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string)
- `country` (string)
- `search` (string)

**Response:** Onboarding user list response

### GET /backoffice/onboarding/pending
**Description:** List pending onboarding users  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string)
- `country` (string)
- `search` (string)

**Response:** Onboarding user list response

### GET /backoffice/onboarding/users/:id
**Description:** Get user onboarding details  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Onboarding user details response

### PATCH /backoffice/onboarding/users/:id
**Description:** Update user onboarding information  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body:** Dynamic object with fields to update

**Response:** Updated user response

### POST /backoffice/onboarding/users/:id/approve
**Description:** Approve user onboarding  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `notes` (string)

**Response:** Success response

### POST /backoffice/onboarding/users/:id/reject
**Description:** Reject user onboarding  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `stepsToCorrect` (array of strings)

**Body (Optional):**
- `reason` (string)

**Response:** Success response

### POST /backoffice/onboarding/users/:id/request-correction
**Description:** Request correction for user onboarding  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `stepsToCorrect` (array of strings)

**Body (Optional):**
- `message` (string)

**Response:** Success response

### GET /backoffice/actions
**Description:** List actions/services  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `group` (string)
- `search` (string)
- `activeOnly` (boolean)
- `page` (number)
- `limit` (number)

**Response:** Action list response

### GET /backoffice/actions/groups
**Description:** List action groups/modules  
**Headers (Required):** Authorization Bearer token  
**Response:** Group list response

### GET /backoffice/actions/:id
**Description:** Get action by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Action response

### POST /backoffice/actions
**Description:** Create action  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `code` (string)
- `description` (string)

**Body (Optional):**
- `group` (string)
- `isActive` (boolean)
- `metadata` (object: { icon?, order? })

**Response:** Created action response

### PUT /backoffice/actions/:id
**Description:** Update action  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `description` (string)
- `group` (string)
- `isActive` (boolean)
- `metadata` (object)

**Response:** Updated action response

### PATCH /backoffice/actions/:id/toggle
**Description:** Toggle action active status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `enabled` (boolean)

**Response:** Updated action response

### DELETE /backoffice/actions/:id
**Description:** Delete action  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

### POST /backoffice/actions/reorder
**Description:** Reorder actions  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- Array of objects: `{ id: string, order: number }[]`

**Response:** Success response

### GET /backoffice/actions/check/:userId/:actionName
**Description:** Check if user can perform action  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userId` (string, UUID)
- `actionName` (string)

**Response:** Check response with canPerform boolean

### GET /backoffice/system-config
**Description:** List system configurations  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `group` (string)
- `search` (string)
- `page` (number)
- `limit` (number)

**Response:** System config list response

### GET /backoffice/system-config/groups
**Description:** List configuration groups  
**Headers (Required):** Authorization Bearer token  
**Response:** Group list response

### GET /backoffice/system-config/key/:key
**Description:** Get configuration by key  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `key` (string)

**Response:** System config response

### POST /backoffice/system-config
**Description:** Create system configuration  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `key` (string)
- `value` (string)

**Body (Optional):**
- `description` (string)
- `group` (string)

**Response:** Created config response

### PUT /backoffice/system-config/:id
**Description:** Update system configuration  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `value` (string)
- `description` (string)
- `group` (string)

**Response:** Updated config response

### DELETE /backoffice/system-config/:id
**Description:** Delete system configuration  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

### GET /backoffice/system-config/modules
**Description:** List system modules  
**Headers (Required):** Authorization Bearer token  
**Response:** Module list response

### GET /backoffice/system-config/modules/:id
**Description:** Get module by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Response:** Module response

### POST /backoffice/system-config/modules
**Description:** Create module  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `name` (string)
- `isActive` (boolean)

**Body (Optional):**
- `description` (string)

**Response:** Created module response

### PUT /backoffice/system-config/modules/:id
**Description:** Update module  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Body (Optional):**
- `name` (string)
- `description` (string)
- `isActive` (boolean)

**Response:** Updated module response

### PATCH /backoffice/system-config/modules/:id/toggle
**Description:** Toggle module active status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Body (Required):**
- `isActive` (boolean)

**Response:** Updated module response

### DELETE /backoffice/system-config/modules/:id
**Description:** Delete module  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Response:** Success response

### GET /backoffice/management/roles
**Description:** List backoffice roles  
**Headers (Required):** Authorization Bearer token  
**Response:** Role list response

### GET /backoffice/management/roles/:id
**Description:** Get role by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Role response

### POST /backoffice/management/roles
**Description:** Create role  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `name` (string)
- `level` (number, min 1, max 10)

**Body (Optional):**
- `description` (string)

**Response:** Created role response

### PUT /backoffice/management/roles/:id
**Description:** Update role  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `name` (string)
- `description` (string)
- `level` (number, min 1, max 10)

**Response:** Updated role response

### DELETE /backoffice/management/roles/:id
**Description:** Delete role  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

### GET /backoffice/management/users
**Description:** List backoffice users  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `search` (string)
- `roleId` (string, UUID)
- `status` (string)

**Response:** Backoffice user list response

### GET /backoffice/management/users/:id
**Description:** Get backoffice user by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Backoffice user response

### POST /backoffice/management/users
**Description:** Create backoffice user  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `name` (string)
- `email` (string, email format)
- `password` (string, min 8 chars)
- `roleId` (string, UUID)

**Response:** Created user response

### PUT /backoffice/management/users/:id
**Description:** Update backoffice user  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `name` (string)
- `email` (string, email format)
- `password` (string, min 8 chars)
- `roleId` (string, UUID)
- `status` (string)

**Response:** Updated user response

### DELETE /backoffice/management/users/:id
**Description:** Delete backoffice user  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response
